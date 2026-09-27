#!/usr/bin/env node
// The one CLI. Every slash command in .claude/commands runs a command here.
//   npm run farm -- <command> [name] --field=value [--json]
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {getDb,REPO_ROOT} from './lib/db.mjs';
import {table} from './lib/format.mjs';
import {page,table as htmlTable,writeOut} from './lib/render.mjs';
import {TABLES} from './lib/tables.mjs';
import {importFarmiq} from './lib/import.mjs';

export const READS={
 farms:'select name,nait_number,region,n_cap_kg_ha,ffp_status,ffp_due,nzfap_audit_due,nait_declared_on from farms order by name',
 mobs:'select name,species,stock_class,paddock,head,su_per_head,round(head*su_per_head,1) stock_units,last_weighed,whp_clear,unknown_hold,history_verified from mob_summary order by name',
 animals:'select a.name,a.nait_eid,m.name mob,a.birth_date,a.sex,a.nait_registered_on,a.status from animals a join mobs m on m.id=a.mob_id order by a.name',
 paddocks:'select p.name,p.area_ha,p.land_use,p.rest_days,p.cover_kg_dm,p.cover_measured,p.grazing_clear from paddocks p order by p.name',
 grazing:'select paddock,area_ha,head,su_per_ha,cover_kg_dm,cover_age_days,rest_so_far,rest_days,decision from grazing_board order by paddock',
 reconciliation:`select m.name,m.opening_head,coalesce(sum(e.delta) filter(where e.kind='birth'),0) births,coalesce(sum(e.delta) filter(where e.kind in ('purchase','transfer-in')),0) bought_in,coalesce(-sum(e.delta) filter(where e.kind='death'),0) deaths,coalesce(-sum(e.delta) filter(where e.kind in ('sale','transfer-out')),0) sold_out,coalesce(sum(e.delta) filter(where e.kind='adjustment'),0) adjustments,s.head closing_head from mobs m join mob_summary s on s.id=m.id left join stock_events e on e.mob_id=m.id group by m.id,s.head order by m.name`,
 movements:'select m.name mob,p.name from_paddock,q.name to_paddock,v.moved_on,v.head,v.note from movements v join mobs m on m.id=v.mob_id join paddocks p on p.id=v.from_paddock join paddocks q on q.id=v.to_paddock order by v.moved_on desc',
 treatments:'select mob,product,batch,acvm_number,treated_on,head,dose_ml,operator,whp_days,whp_clear,cost from treatment_register order by treated_on desc,mob',
 withholding:'select name mob,head,history_verified,whp_clear,unknown_hold from mob_summary where head>0 order by name',
 inventory:'select name,batch,expiry,stock_ml,whp_days,acvm_number from products order by expiry',
 performance:'select * from performance_board order by mob',
 costs:'select *,sales-purchases-animal_health recorded_cash_margin from cost_board order by mob',
 mating:`select j.id,m.name mob,j.sire,j.joined_on,j.ended_on,j.females,j.scanned_in_lamb,j.scan_due,round(100.0*j.scanned_in_lamb/j.females,0) scanning_percent,case when j.scanned_in_lamb is null and j.scan_due<current_date then 'SCAN OVERDUE' when j.scanned_in_lamb is null then 'SCAN DUE' else 'SCANNED' end status from matings j join mobs m on m.id=j.mob_id order by j.scan_due`,
 sales:`select m.name mob,e.kind,e.event_date,abs(e.delta) head,e.amount,e.reference,e.other_nait,e.asd_ref,e.nait_recorded_on from stock_events e join mobs m on m.id=e.mob_id where e.kind in ('sale','transfer-out','purchase','transfer-in') order by e.event_date desc`,
 'sale-check':'select name,mob,sale_date,head,destination,whp_clear,decision from sale_readiness order by sale_date',
 nait:'select mob,kind,event_date,head,reference,other_nait,due,nait_recorded_on,status from nait_movements order by status<>\'DUE\',status<>\'OVERDUE\',event_date desc',
 tagging:'select animal,mob,species,birth_date,due,nait_eid,nait_registered_on,status from nait_tagging order by status<>\'OVERDUE\',due',
 nitrogen:'select farm,paddock,land_use,area_ha,n_kg_ha,cap_kg_ha,decision from nitrogen_board order by decision<>\'OVER CAP\',decision<>\'NEAR CAP\',n_kg_ha desc',
 fertiliser:'select p.name paddock,x.applied_on,x.product,x.rate_kg_ha,x.n_percent,round(x.rate_kg_ha*x.n_percent/100,1) n_kg_ha,x.area_ha,x.applicator,x.cost from fertiliser x join paddocks p on p.id=x.paddock_id order by x.applied_on desc',
 'spray-diary':'select p.name paddock,s.applied_on,s.product,s.rate,s.target,s.operator,s.wind,s.grazing_whp_days,s.applied_on+s.grazing_whp_days grazing_clear from sprays s join paddocks p on p.id=s.paddock_id order by s.applied_on desc',
 hazards:'select name,location,controls,owner,reviewed_on,current_date-reviewed_on days_since_review from hazards order by reviewed_on nulls first',
 incidents:'select name,occurred_on,description,notifiable,worksafe_ref,reported_by from incidents order by occurred_on desc',
 'farm-plan':`select f.name farm,f.ffp_status,f.ffp_due,a.name action,a.risk,a.due,a.status,case when a.status='open' and a.due<current_date then 'OVERDUE' when a.status='open' then 'OPEN' else 'DONE' end decision from farms f left join ffp_actions a on a.farm_id=f.id order by a.status,a.due`,
 tasks:'select id,name,due,owner,status from farm_tasks order by status,due',
 diary:'select d.created_at,coalesce(m.name,p.name,f.name) record,d.body,d.author from diary d join farms f on f.id=d.farm_id left join mobs m on m.id=d.mob_id left join paddocks p on p.id=d.paddock_id order by d.created_at desc',
 compliance:'select * from compliance_findings order by rule,record',
 attention:'select * from attention_board order by priority,kind,record',
};
export const MUTATIONS=['add','move','treat','weigh','stocktake','stock-event','nait-recorded','tag','declare-nait','mate','scan','plan-sale','release-sale','fertilise','spray','cover','hazard-review','incident','worksafe-notified','action-done','verify-history','task-add','task-done','log'];
export const COMMANDS=[...Object.keys(READS),'mob','weekly-review',...MUTATIONS,'import','export','draft-sale','draft-treatment','draft-audit','help'];

export function argsOf(args){
 const flags={},pos=[];
 for(let i=0;i<args.length;i++){const a=args[i];if(a.startsWith('--')){const j=a.indexOf('=');if(j>=0)flags[a.slice(2,j)]=a.slice(j+1);else flags[a.slice(2)]=['json','dry-run','help','notifiable'].includes(a.slice(2))?true:(args[i+1]&&!args[i+1].startsWith('--')?args[++i]:true);}else pos.push(a);}
 return {flags,pos};
}
const need=(o,k)=>{if(typeof o[k]!=='string'||!o[k].trim())throw Error(`Required --${k}=...`);return o[k].trim();};
const number=(o,k,{min=0,max=Infinity,integer=false,optional=false}={})=>{if(optional&&o[k]===undefined)return 0;const n=Number(need(o,k));if(!Number.isFinite(n)||n<min||n>max||(integer&&!Number.isInteger(n)))throw Error(`--${k} must be ${integer?'a whole number':'a number'} from ${min}${max<Infinity?' to '+max:''}`);return n;};
const day=(v)=>{if(!/^\d{4}-\d{2}-\d{2}$/.test(v)||Number.isNaN(Date.parse(v))||new Date(v).toISOString().slice(0,10)!==v)throw Error('Date must be a real YYYY-MM-DD');return v;};
const today=async(db)=>(await db.query('select current_date::text d'))[0].d;
const dated=async(db,f)=>f.date?day(need(f,'date')):today(db);

// Exact name or id first, then a unique partial match. Ambiguous lists the candidates and stops.
export async function resolve(db,t,q){
 if(!TABLES.includes(t))throw Error('Unknown register');if(!q||typeof q!=='string')throw Error(`Name the ${t.replace(/s$/,'')} (name or id)`);
 const rows=await db.query(`select * from ${t} where lower(name)=lower($1) or id::text=$1`,[q]);
 const found=rows.length?rows:await db.query(`select * from ${t} where position(lower($1) in lower(name))>0 or starts_with(id::text,$1) order by name`,[q]);
 if(found.length!==1)throw Error(`${found.length?'Ambiguous':'No match'} ${t}: ${q}${found.length?'\n'+found.map(r=>r.id+'  '+r.name).join('\n'):''}`);
 return found[0];
}
async function insert(db,t,values){const cols=Object.keys(values);return (await db.query(`insert into ${t} (${cols.join(',')}) values (${cols.map((_,i)=>'$'+(i+1)).join(',')}) returning *`,Object.values(values)))[0];}
async function mobLocked(db,q){const m=await resolve(db,'mobs',q);return (await db.query('select * from mobs where id=$1 for update',[m.id]))[0];}
async function summary(db,m){return (await db.query('select * from mob_summary where id=$1',[m.id]))[0];}
async function farmOf(db,f){if(f.farm)return resolve(db,'farms',f.farm);const all=await db.query('select * from farms order by name');if(all.length!==1)throw Error('More than one farm: add --farm=...');return all[0];}

export async function execute(db,args){
 const {flags:f,pos}=argsOf(args),[cmd='help',q]=pos;
 if(cmd==='help'||f.help)return {commands:COMMANDS,usage:'npm run farm -- <command> [name] --field=value [--json]',details:'docs/commands.md lists every field. Reads accept --json. Drafts never send.'};
 if(READS[cmd])return db.query(READS[cmd]);
 if(cmd==='mob'){const m=await resolve(db,'mobs',q);return {mob:await summary(db,m),events:await db.query('select event_date,kind,delta,reference,other_nait,asd_ref,nait_recorded_on from stock_events where mob_id=$1 order by event_date',[m.id]),treatments:await db.query('select treated_on,product,batch,head,whp_days,operator from treatments where mob_id=$1 order by treated_on',[m.id]),diary:await db.query('select created_at,body,author from diary where mob_id=$1 order by created_at',[m.id])};}
 if(cmd==='weekly-review')return {attention:await db.query(READS.attention),grazing:await db.query(READS.grazing),sales:await db.query(READS['sale-check']),nait:await db.query("select * from nait_movements where status in ('DUE','OVERDUE')")};
 if(cmd==='import'){if(q!=='farmiq')throw Error('Use: import farmiq --paddocks=file.csv ...');return importFarmiq(db,f);}
 if(cmd==='export'){
  const out={format:'farm-records-v1',exported_at:new Date().toISOString(),tables:{}};
  await db.exec('BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY');
  try{for(const t of TABLES)out.tables[t]=await db.query(`select * from ${t} order by ${t==='import_rows'?'hash':'id'}`);await db.exec('COMMIT');}catch(e){await db.exec('ROLLBACK');throw e;}
  const file=path.resolve(f.file||path.join(REPO_ROOT,'exports',`farm-records-${Date.now()}.json`));fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,JSON.stringify(out,null,2));
  return {file,tables:TABLES.length,rows:Object.values(out.tables).reduce((n,a)=>n+a.length,0)};
 }
 if(cmd.startsWith('draft-')){
  let title,sections,name;
  if(cmd==='draft-audit'){title='NZFAP and farm plan working pack';name='audit';sections=[{title:'Findings',html:htmlTable(await db.query(READS.compliance))},{title:'Stock reconciliation',html:htmlTable(await db.query(READS.reconciliation))},{title:'Nitrogen this season',html:htmlTable(await db.query(READS.nitrogen))},{title:'Farm plan actions',html:htmlTable(await db.query(READS['farm-plan']))},{title:'Hazards',html:htmlTable(await db.query(READS.hazards))}];}
  else if(cmd==='draft-treatment'){const m=await resolve(db,'mobs',q);name=m.name;title='Animal health treatment record';sections=[{title:m.name,html:htmlTable(await db.query('select product,batch,acvm_number,treated_on,head,dose_ml,operator,whp_days,whp_clear from treatment_register where mob=$1',[m.name]))}];}
  else if(cmd==='draft-sale'){const s=await resolve(db,'sale_plans',q);name=s.name;title='ASD preparation worksheet';sections=[{title:s.name,html:htmlTable(await db.query('select name,mob,sale_date,head,destination,whp_clear,decision from sale_readiness where id=$1',[s.id]))},{title:'Treatments that may still be within withholding',html:htmlTable(await db.query('select product,treated_on,whp_days,whp_clear from treatment_register t join sale_plans sp on sp.id=$1 join mobs m on m.id=sp.mob_id where t.mob=m.name and (t.whp_clear is null or t.whp_clear>sp.sale_date)',[s.id]))},{title:'Recorded details',html:htmlTable([{destination:s.destination,destination_nait:s.destination_nait,asd_ref:s.asd_ref,status:s.status}])}];}
  else throw Error(`Unknown command ${cmd}`);
  const file=writeOut('drafts',`${cmd}-${name.replace(/[^a-z0-9]+/gi,'-')}-${Date.now()}`,page({title,subtitle:'DRAFT. Working record only. Not an ASD, a NAIT record or an audit certificate.',sections}));
  return {file,draft:true};
 }
 if(!MUTATIONS.includes(cmd))throw Error(`Unknown command ${cmd}. Run help.`);
 await db.exec('BEGIN');
 try{
  const result=await write(db,cmd,q,f);
  await db.exec('COMMIT');return result;
 }catch(e){await db.exec('ROLLBACK');throw e;}
}

async function write(db,cmd,q,f){
 const now=await today(db);
 if(cmd==='add'){
  if(q==='farm')return insert(db,'farms',{name:need(f,'name'),nait_number:f.nait||'',region:f.region||'',ffp_due:f['ffp-due']?day(f['ffp-due']):null});
  if(q==='paddock'){const farm=await farmOf(db,f);return insert(db,'paddocks',{farm_id:farm.id,name:need(f,'name'),area_ha:number(f,'area',{min:0.01}),land_use:f.use||'pastoral',rest_days:f.rest===undefined?30:number(f,'rest',{integer:true})});}
  if(q==='mob'){const p=await resolve(db,'paddocks',need(f,'paddock'));return insert(db,'mobs',{paddock_id:p.id,name:need(f,'name'),species:need(f,'species').toLowerCase(),stock_class:f.class||'',opening_head:number(f,'head',{integer:true}),opening_date:await dated(db,f),su_per_head:number(f,'su',{min:0.01}),purchase_cost:number(f,'cost',{optional:true}),history_verified:true});}
  if(q==='product')return insert(db,'products',{name:need(f,'name'),batch:need(f,'batch'),expiry:day(need(f,'expiry')),stock_ml:number(f,'stock'),whp_days:number(f,'whp',{integer:true}),acvm_number:need(f,'acvm')});
  if(q==='animal'){const m=await mobLocked(db,need(f,'mob'));const s=await summary(db,m);const c=Number((await db.query("select count(*) n from animals where mob_id=$1 and status='on-farm'",[m.id]))[0].n);if(c>=s.head)throw Error('More tagged animals than the mob head count');return insert(db,'animals',{mob_id:m.id,name:need(f,'name'),nait_eid:f.eid||null,birth_date:day(need(f,'born')),sex:f.sex||''});}
  if(q==='hazard'){const farm=await farmOf(db,f);return insert(db,'hazards',{farm_id:farm.id,name:need(f,'name'),location:f.location||'',controls:need(f,'controls'),owner:need(f,'owner'),reviewed_on:now});}
  if(q==='action'){const farm=await farmOf(db,f);return insert(db,'ffp_actions',{farm_id:farm.id,name:need(f,'name'),risk:f.risk||'',due:day(need(f,'due'))});}
  throw Error('add supports farm, paddock, mob, product, animal, hazard, action');
 }
 if(cmd==='task-add'){const farm=await farmOf(db,f);return insert(db,'farm_tasks',{farm_id:farm.id,name:need(f,'name'),due:day(need(f,'due')),owner:need(f,'owner')});}
 if(cmd==='task-done'){const t=await resolve(db,'farm_tasks',q);return (await db.query("update farm_tasks set status='done' where id=$1 returning *",[t.id]))[0];}
 if(cmd==='action-done'){const a=await resolve(db,'ffp_actions',q);return (await db.query("update ffp_actions set status='done',evidence=$2 where id=$1 returning *",[a.id,need(f,'evidence')]))[0];}
 if(cmd==='hazard-review'){const h=await resolve(db,'hazards',q);return (await db.query('update hazards set reviewed_on=$2,controls=coalesce($3,controls) where id=$1 returning *',[h.id,now,f.controls||null]))[0];}
 if(cmd==='incident'){const farm=await farmOf(db,f);return insert(db,'incidents',{farm_id:farm.id,name:need(f,'name'),occurred_on:await dated(db,f),description:need(f,'what'),notifiable:!!f.notifiable,reported_by:need(f,'by')});}
 if(cmd==='worksafe-notified'){const i=await resolve(db,'incidents',q);return (await db.query('update incidents set worksafe_ref=$2 where id=$1 returning *',[i.id,need(f,'reference')]))[0];}
 if(cmd==='declare-nait'){const farm=await farmOf(db,f);return (await db.query('update farms set nait_declared_on=$2 where id=$1 returning name,nait_declared_on',[farm.id,await dated(db,f)]))[0];}
 if(cmd==='cover'){const p=await resolve(db,'paddocks',q);return (await db.query('update paddocks set cover_kg_dm=$2,cover_measured=$3 where id=$1 returning name,cover_kg_dm,cover_measured',[p.id,number(f,'kg'),await dated(db,f)]))[0];}
 if(cmd==='fertilise'){const p=await resolve(db,'paddocks',q);const area=f.area===undefined?Number(p.area_ha):number(f,'area',{min:0.01});if(area>Number(p.area_ha))throw Error('Spread area is larger than the paddock');return insert(db,'fertiliser',{paddock_id:p.id,applied_on:await dated(db,f),product:need(f,'product'),rate_kg_ha:number(f,'rate',{min:0.01}),n_percent:number(f,'n',{max:100}),area_ha:area,applicator:f.by||'',cost:number(f,'cost',{optional:true})});}
 if(cmd==='spray'){
  const p=await resolve(db,'paddocks',q),date=await dated(db,f),whp=number(f,'whp',{integer:true});
  const r=await insert(db,'sprays',{paddock_id:p.id,applied_on:date,product:need(f,'product'),rate:need(f,'rate'),target:f.target||'',operator:need(f,'operator'),wind:need(f,'wind'),grazing_whp_days:whp,cost:number(f,'cost',{optional:true})});
  await db.query('update paddocks set grazing_clear=greatest(coalesce(grazing_clear,$2::date),$2::date) where id=$1',[p.id,addDays(date,whp)]);return r;
 }
 if(cmd==='scan'){const j=await db.query('select * from matings where starts_with(id::text,$1) for update',[q||'-']);if(j.length!==1)throw Error('Use one mating id from the mating list');return (await db.query('update matings set scanned_in_lamb=$1 where id=$2 returning *',[number(f,'scanned',{integer:true}),j[0].id]))[0];}
 if(cmd==='nait-recorded'){
  const r=await db.query("select e.* from stock_events e join mobs m on m.id=e.mob_id where e.reference=$1 and m.species in ('cattle','deer') and e.kind in ('purchase','transfer-in','sale','transfer-out')",[q||'']);
  if(r.length!==1)throw Error('Reference must match exactly one cattle or deer movement');const d=await dated(db,f);if(d<r[0].event_date)throw Error('NAIT record date is before the movement');
  return (await db.query('update stock_events set nait_recorded_on=$2 where id=$1 returning reference,event_date,nait_recorded_on',[r[0].id,d]))[0];
 }
 if(cmd==='tag'){const a=await resolve(db,'animals',q);return (await db.query('update animals set nait_eid=$2,nait_registered_on=$3 where id=$1 returning name,nait_eid,nait_registered_on',[a.id,need(f,'eid'),await dated(db,f)]))[0];}
 if(cmd==='release-sale'){
  const s=await resolve(db,'sale_plans',q);await db.query('select id from sale_plans where id=$1 for update',[s.id]);const m=await mobLocked(db,s.mob_id);
  const check=(await db.query('select * from sale_readiness where id=$1',[s.id]))[0];if(check.decision!=='READY FOR REVIEW')throw Error(`Release blocked: ${check.decision}`);
  if(s.sale_date!==now)throw Error('Release only on the planned date. Future plans stay plans.');
  const by=need(f,'reviewed-by');
  const tagged=Number((await db.query("select count(*) n from animals where mob_id=$1 and status='on-farm'",[m.id]))[0].n);const head=(await summary(db,m)).head;if(head-s.head<tagged)throw Error('Tagged animals would outnumber the mob. Mark which tagged animals left first.');
  const r=await insert(db,'stock_events',{mob_id:m.id,event_date:now,kind:'sale',delta:-s.head,amount:s.amount,reference:`PLAN-${s.id.slice(0,8)}`,other_nait:s.destination_nait,asd_ref:s.asd_ref});
  await db.query("update sale_plans set status='released' where id=$1",[s.id]);
  const p=(await db.query('select farm_id from paddocks where id=$1',[m.paddock_id]))[0];await insert(db,'diary',{farm_id:p.farm_id,mob_id:m.id,body:`Released ${s.head} head to ${s.destination} (${s.name}); reviewed by ${by}`,author:by});
  return r;
 }
 const m=await mobLocked(db,q),s=await summary(db,m),date=await dated(db,f);
 if(!['plan-sale','mate','log','verify-history'].includes(cmd)){if(date>now)throw Error('Completed work cannot be dated in the future');if(date<m.opening_date)throw Error('Date is before the mob was opened');}
 const heads=()=>{const x=number(f,'head',{min:1,integer:true});if(x>s.head)throw Error(`Head ${x} exceeds the mob's ${s.head}`);return x;};
 const farmId=(await db.query('select farm_id from paddocks where id=$1',[m.paddock_id]))[0].farm_id;
 if(cmd==='move'){
  const p=await resolve(db,'paddocks',need(f,'to'));if(p.farm_id!==farmId)throw Error('That paddock is on another farm. Use stock-event transfer-out and transfer-in, and record both in NAIT.');
  if(p.id===m.paddock_id)throw Error('The mob is already there');if(p.land_use==='non-pastoral')throw Error('That block is not for grazing');
  if(p.grazing_clear&&date<=p.grazing_clear)throw Error(`Spray hold on ${p.name} until ${p.grazing_clear}`);
  const last=(await db.query('select max(moved_on) d from movements where mob_id=$1',[m.id]))[0].d;if(last&&date<last)throw Error('Move is dated before the last recorded move');
  const r=await insert(db,'movements',{mob_id:m.id,from_paddock:m.paddock_id,to_paddock:p.id,moved_on:date,head:s.head,note:f.note||''});await db.query('update mobs set paddock_id=$1 where id=$2',[p.id,m.id]);return r;
 }
 if(cmd==='treat'){
  const p=await resolve(db,'products',need(f,'product'));const fresh=(await db.query('select * from products where id=$1 for update',[p.id]))[0];
  if(fresh.expiry<date)throw Error('Product expired');if(fresh.whp_days===null||!fresh.acvm_number)throw Error('Record the product\'s withholding period and ACVM number first');
  const h=heads(),dose=number(f,'dose',{min:0.001}),use=h*dose;if(use>Number(fresh.stock_ml))throw Error(`Not enough product on hand: need ${use} ml, have ${fresh.stock_ml}`);
  const r=await insert(db,'treatments',{mob_id:m.id,product_id:p.id,product:p.name,batch:p.batch,treated_on:date,head:h,dose_ml:dose,operator:need(f,'operator'),whp_days:p.whp_days,acvm_number:p.acvm_number,cost:number(f,'cost',{optional:true})});
  await db.query('update products set stock_ml=stock_ml-$1 where id=$2',[use,p.id]);return r;
 }
 if(cmd==='weigh')return insert(db,'weights',{mob_id:m.id,weighed_on:date,average_kg:number(f,'kg',{min:0.01}),sample_head:heads()});
 if(cmd==='stocktake'){if(date!==now)throw Error('A count compares with today\'s book, so it must be dated today');return insert(db,'counts',{mob_id:m.id,counted_on:date,observed:number(f,'head',{integer:true}),expected:s.head,note:need(f,'note')});}
 if(cmd==='stock-event'){
  const kind=need(f,'kind');if(kind==='sale')throw Error('Sales go through plan-sale then release-sale, so the withholding and ASD checks run');
  if(!['birth','purchase','transfer-in','death','transfer-out','adjustment'].includes(kind))throw Error('kind is birth, purchase, transfer-in, death, transfer-out or adjustment');
  const delta=Number(need(f,'delta'));if(!Number.isInteger(delta)||delta===0||s.head+delta<0)throw Error('Invalid count change');
  const last=(await db.query('select max(event_date) d from stock_events where mob_id=$1',[m.id]))[0].d;if(last&&date<last)throw Error('Dated before the latest recorded change');
  const moving=['purchase','transfer-in','transfer-out'].includes(kind);if(moving&&s.nait_species&&!f.nait)throw Error('Cattle and deer moving on or off need the other --nait location number');
  return insert(db,'stock_events',{mob_id:m.id,event_date:date,kind,delta,amount:number(f,'amount',{optional:true}),reference:need(f,'reference'),other_nait:f.nait||'',asd_ref:f.asd||''});
 }
 if(cmd==='mate'){const females=heads();return insert(db,'matings',{mob_id:m.id,sire:need(f,'sire'),joined_on:day(need(f,'start')),ended_on:day(need(f,'end')),females,scan_due:day(need(f,'scan-due'))});}
 if(cmd==='plan-sale')return insert(db,'sale_plans',{mob_id:m.id,name:need(f,'name'),sale_date:day(need(f,'date')),head:heads(),destination:need(f,'destination'),destination_nait:f.nait||'',asd_ref:f.asd||'',amount:number(f,'amount',{optional:true})});
 if(cmd==='verify-history'){const r=await insert(db,'diary',{farm_id:farmId,mob_id:m.id,body:`Treatment history verified: ${need(f,'evidence')}`,author:need(f,'by')});await db.query('update mobs set history_verified=true where id=$1',[m.id]);return r;}
 if(cmd==='log')return insert(db,'diary',{farm_id:farmId,mob_id:m.id,body:need(f,'note'),author:need(f,'by')});
 throw Error(`Unknown command ${cmd}`);
}
function addDays(d,n){return new Date(Date.parse(d)+n*86400000).toISOString().slice(0,10);}

function print(value){
 if(Array.isArray(value)){const hide=['id','updated_at','farm_id',...(value[0]&&'body' in value[0]?[]:['created_at'])];console.log(table(value,value.length?Object.keys(value[0]).filter(k=>!hide.includes(k)).map(k=>({key:k,label:k.replaceAll('_',' '),format:v=>v instanceof Date?v.toISOString().slice(0,10):v})):[]));return;}
 for(const [k,v] of Object.entries(value||{})){if(Array.isArray(v)||v&&typeof v==='object'&&!(v instanceof Date)){console.log('\n'+k);print(Array.isArray(v)?v:[v]);}else console.log(`${k}: ${v instanceof Date?v.toISOString().slice(0,10):v??''}`);}
}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href){
 const args=process.argv.slice(2);let db;
 try{db=await getDb();const result=await execute(db,args);if(argsOf(args).flags.json)console.log(JSON.stringify(result,null,2));else print(result);}
 catch(e){if(argsOf(args).flags.json)console.error(JSON.stringify({error:e.message}));else console.error(e.message);process.exitCode=1;}
 finally{if(db)await db.close();}
}
