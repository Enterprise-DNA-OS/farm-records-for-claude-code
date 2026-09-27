// import farmiq: CSV files saved from FarmIQ reports (open the Excel download, Save As CSV).
// Headers are matched case-insensitively against the aliases below, so a renamed column still maps.
// The whole batch runs in one transaction: one bad row rolls every file back. Replaying the same rows is skipped, never duplicated.
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {parse} from 'csv-parse/sync';

const aliases={
 name:['Mob','Mob Name','Name','Group'],paddock:['Paddock','Paddock Name','Location','Block'],area:['Effective Area (ha)','Area (ha)','Area','Hectares','Effective Area'],
 species:['Species','Stock Type','Animal Type'],class:['Stock Class','Class','Category'],head:['Number','Head','Count','Stock Count','Number of Animals','Quantity'],
 date:['Date','Event Date','Treatment Date','Weigh Date','Application Date'],product:['Product','Product Name','Treatment','Fertiliser','Fertiliser Product'],
 dose:['Dose (ml)','Dose','Dosage','Dose Rate'],whp:['Meat WHP (days)','Meat WHP','WHP (days)','WHP','Withholding Period'],acvm:['ACVM','ACVM Number','ACVM No','Registration Number'],
 batch:['Batch','Batch Number','Batch No'],operator:['Operator','Applied By','User','Recorded By'],kg:['Average Weight (kg)','Average Weight','Liveweight (kg)','Weight (kg)','Avg Weight'],
 eid:['EID','NAIT Tag','RFID','Electronic ID'],vid:['VID','Visual ID','Tag','Management Tag'],rate:['Rate (kg/ha)','Rate','Application Rate'],n:['N (%)','N %','Nitrogen %','N Content'],
 su:['SU per Head','Stock Units per Head','SU'],
};
const get=(r,k)=>{for(const a of aliases[k]||[k]){const found=Object.keys(r).find(x=>x.trim().toLowerCase()===a.toLowerCase());if(found&&String(r[found]).trim())return String(r[found]).trim();}return '';};
const req=(r,k)=>{const v=get(r,k);if(!v)throw Error(`missing ${k} (accepted headers: ${(aliases[k]||[k]).join(', ')})`);return v;};
const num=(v,label,{min=0,integer=false}={})=>{if(!/^-?\d+(\.\d+)?$/.test(v.replace(/,/g,'')))throw Error(`${label}: plain number required, got "${v}"`);const n=Number(v.replace(/,/g,''));if(n<min||integer&&!Number.isInteger(n))throw Error(`${label}: out of range`);return n;};
// FarmIQ is a NZ product: slashes are day first.
const date=(v)=>{let s=v;const m=/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(v);if(m)s=`${m[3]}-${m[2].padStart(2,'0')}-${m[1].padStart(2,'0')}`;if(!/^\d{4}-\d{2}-\d{2}$/.test(s)||Number.isNaN(Date.parse(s))||new Date(s).toISOString().slice(0,10)!==s)throw Error(`date "${v}": use DD/MM/YYYY or YYYY-MM-DD`);return s;};
const SU={sheep:1,cattle:6,deer:1.9};
async function exact(db,t,name,farmId){const rows=await db.query(t==='mobs'?'select m.* from mobs m join paddocks p on p.id=m.paddock_id where lower(m.name)=lower($1) and p.farm_id=$2':'select * from paddocks where lower(name)=lower($1) and farm_id=$2',[name,farmId]);if(rows.length!==1)throw Error(`no ${t==='mobs'?'mob':'paddock'} named "${name}" on this farm`);return rows[0];}
async function insert(db,t,r){const cols=Object.keys(r);return db.query(`insert into ${t} (${cols.join(',')}) values (${cols.map((_,i)=>'$'+(i+1)).join(',')})`,Object.values(r));}

export async function importFarmiq(db,f){
 const kinds=['paddocks','mobs','animals','treatments','weights','fertiliser'];
 for(const k of Object.keys(f))if(![...kinds,'farm','as-of','dry-run','json'].includes(k))throw Error(`Unknown import option --${k}`);
 if(!kinds.some(k=>f[k]))throw Error(`Give at least one file: ${kinds.map(k=>'--'+k+'=file.csv').join(' ')}`);
 const farms=await db.query('select * from farms where lower(name)=lower($1)',[f.farm||'']);if(farms.length!==1)throw Error('Name the farm exactly: --farm="Farm name"');const farm=farms[0];
 const asof=f['as-of']?date(f['as-of']):null;if(f.mobs&&!asof)throw Error('A mob list is a snapshot: add --as-of=YYYY-MM-DD, the date the report was run');
 const report={dry_run:!!f['dry-run'],imported:0,skipped:0,by_kind:{}};
 await db.exec('BEGIN');
 try{
  for(const kind of kinds){
   if(!f[kind])continue;
   const rows=parse(fs.readFileSync(f[kind],'utf8'),{bom:true,skip_empty_lines:true,trim:true,columns:h=>{const x=h.map(s=>s.trim());if(new Set(x.map(s=>s.toLowerCase())).size!==x.length)throw Error(`${kind}: duplicate column headers`);return x;}});
   if(!rows.length)throw Error(`${kind}: no rows`);report.by_kind[kind]=0;
   for(let i=0;i<rows.length;i++){
    const r=rows[i],hash=createHash('sha256').update(JSON.stringify([farm.id,kind,kind==='mobs'?asof:null,Object.entries(r).sort()])).digest('hex');
    if((await db.query('select 1 from import_rows where hash=$1',[hash])).length){report.skipped++;continue;}
    try{
     if(kind==='paddocks')await insert(db,'paddocks',{farm_id:farm.id,name:req(r,'paddock'),area_ha:num(req(r,'area'),'area',{min:0.001})});
     else if(kind==='mobs'){
      const p=await exact(db,'paddocks',req(r,'paddock'),farm.id);const species=req(r,'species').toLowerCase().replace(/^beef.*|^dairy.*/,'cattle');if(!SU[species])throw Error(`species "${species}": sheep, cattle or deer`);
      await insert(db,'mobs',{name:req(r,'name'),paddock_id:p.id,species,stock_class:get(r,'class'),opening_head:num(req(r,'head'),'head',{integer:true}),opening_date:asof,su_per_head:get(r,'su')?num(get(r,'su'),'SU',{min:0.01}):SU[species],history_verified:false});
     }else if(kind==='fertiliser'){
      const p=await exact(db,'paddocks',req(r,'paddock'),farm.id);
      await insert(db,'fertiliser',{paddock_id:p.id,applied_on:date(req(r,'date')),product:req(r,'product'),rate_kg_ha:num(req(r,'rate'),'rate',{min:0.001}),n_percent:num(get(r,'n')||'0','N %'),area_ha:get(r,'area')?num(get(r,'area'),'area',{min:0.001}):Number(p.area_ha),applicator:get(r,'operator'),source_ref:hash});
     }else{
      const m=await exact(db,'mobs',req(r,'name'),farm.id);
      if(kind==='treatments'){await insert(db,'treatments',{mob_id:m.id,product:req(r,'product'),batch:get(r,'batch')||'UNKNOWN',treated_on:date(req(r,'date')),head:num(req(r,'head'),'head',{min:1,integer:true}),dose_ml:num(req(r,'dose'),'dose',{min:0.001}),operator:get(r,'operator'),whp_days:get(r,'whp')?num(get(r,'whp'),'WHP',{integer:true}):null,acvm_number:get(r,'acvm'),source_ref:hash});await db.query('update mobs set history_verified=false where id=$1',[m.id]);}
      else if(kind==='weights')await insert(db,'weights',{mob_id:m.id,weighed_on:date(req(r,'date')),average_kg:num(req(r,'kg'),'weight',{min:0.001}),sample_head:num(req(r,'head'),'head',{min:1,integer:true})});
      else if(kind==='animals'){const born=get(r,'Birth Date')||get(r,'Date of Birth')||get(r,'DOB');await insert(db,'animals',{mob_id:m.id,name:req(r,'vid'),nait_eid:get(r,'eid')||null,birth_date:born?date(born):null,sex:get(r,'Sex'),nait_registered_on:get(r,'NAIT Registered')?date(get(r,'NAIT Registered')):null});}
     }
     await db.query('insert into import_rows(hash,kind,source_file,row_number) values($1,$2,$3,$4)',[hash,kind,String(f[kind]).split(/[\\/]/).pop(),i+2]);report.imported++;report.by_kind[kind]++;
    }catch(e){throw Error(`${kind} row ${i+2}: ${e.message}`);}
   }
  }
  const over=await db.query("select m.name from mobs m join animals a on a.mob_id=m.id and a.status='on-farm' join mob_summary s on s.id=m.id group by m.id,s.head having count(*)>s.head");
  if(over.length)throw Error('More tagged animals than head count in: '+over.map(x=>x.name).join(', '));
  await db.exec(f['dry-run']?'ROLLBACK':'COMMIT');return report;
 }catch(e){await db.exec('ROLLBACK');throw e;}
}
