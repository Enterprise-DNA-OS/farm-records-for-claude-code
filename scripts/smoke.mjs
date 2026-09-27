// npm test: a disposable embedded database, the demo farm, every CLI command, and the rules that protect the records.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'farm-records-smoke-'));
process.env.DATABASE_URL='';process.env.DATA_DIR=path.join(tmp,'db');
const {getDb,REPO_ROOT}=await import('./lib/db.mjs');
const {migrate}=await import('./migrate.mjs');
const {execute,READS,COMMANDS}=await import('./farm.mjs');
let db,checks=0;const covered=new Set();
async function run(cmd,...args){covered.add(cmd);checks++;return execute(db,[cmd,...args.map(String)]);}
async function rejects(cmd,args,pattern){covered.add(cmd);checks++;await assert.rejects(()=>execute(db,[cmd,...args.map(String)]),pattern);}
const count=async(t)=>Number((await db.query(`select count(*) n from ${t}`))[0].n);
const cli=(args,status=0)=>{const r=spawnSync(process.execPath,['scripts/farm.mjs',...args],{cwd:REPO_ROOT,env:process.env,encoding:'utf8'});assert.equal(r.status,status,r.stderr);checks++;return r;};
const find=(rows,k,v)=>rows.find(x=>x[k]===v);
try{
 db=await getDb();assert.equal((await migrate(db)).ran.length,1);assert.equal((await migrate(db)).ran.length,0);
 const seed=fs.readFileSync(path.join(REPO_ROOT,'supabase/seed.sql'),'utf8');await db.exec(seed);await db.exec(seed);assert.equal(await count('mobs'),4);
 const today=(await db.query('select current_date::text d'))[0].d;
 const date=(n)=>new Date(Date.parse(today)+n*86400000).toISOString().slice(0,10);

 // Every read has something to say on the demo farm.
 for(const cmd of Object.keys(READS)){const rows=await run(cmd);assert.ok(rows.length,`${cmd} has demo records`);}
 assert.equal(find(await run('mobs'),'name','Romney Ewes').head,1147);
 assert.equal(Number(find(await run('performance'),'mob','Angus R2 Steers').daily_gain_kg),0.9);
 assert.equal(find(await run('grazing'),'paddock','Back Terrace').decision,'REST MET');
 assert.equal(find(await run('grazing'),'paddock','Woolshed').decision,'SPRAY HOLD');
 assert.ok(!find(await run('grazing'),'paddock','Bush Block'),'non-pastoral blocks are not grazed');
 const sc=await run('sale-check');assert.equal(find(sc,'name','October steers').decision,'WHP HOLD');assert.equal(find(sc,'name','Cull ewes').decision,'ASD MISSING');
 const n=await run('nitrogen');assert.equal(find(n,'paddock','River Flats').decision,'OVER CAP');assert.equal(Number(find(n,'paddock','River Flats').n_kg_ha),202.4);
 assert.equal(find(n,'paddock','Back Terrace').decision,'NEAR CAP');assert.equal(find(n,'paddock','Swede Block').decision,'NOT CAPPED');
 const nait=await run('nait');assert.equal(find(nait,'reference','GRAZE-OUT-001').status,'DUE');assert.equal(find(nait,'reference','BUY-001').status,'RECORDED LATE');assert.equal(find(nait,'reference','GRAZE-IN-001').status,'RECORDED');
 assert.ok(!find(nait,'reference','SALE-001'),'sheep are not NAIT animals');
 assert.equal(find(await run('tagging'),'animal','Fawn 07').status,'OVERDUE');
 const rules=new Set((await run('compliance')).map(x=>x.rule));
 for(const r of ['NAIT-MOVEMENT','NAIT-TAGGING','NAIT-DECLARATION','ACVM-TREATMENT','TREATMENT-HISTORY','N-CAP','SPRAY-RECORD','HSWA-HAZARD','HSWA-EVENT','FFP','FARM-INVENTORY'])assert.ok(rules.has(r),`demo shows ${r}`);
 const md=fs.readFileSync(path.join(REPO_ROOT,'docs/compliance.md'),'utf8');for(const r of rules)assert.match(md,new RegExp(`^## ${r}$`,'m'),`${r} is documented with its source`);
 assert.equal((await run('mob','romney')).mob.name,'Romney Ewes');assert.equal((await run('mob','30000000-0000-0000-0000-000000000002')).mob.head,92);
 await rejects('mob',['e'],/Ambiguous/);await rejects('mob',['nonexistent'],/No match/);
 const wk=await run('weekly-review');assert.equal(wk.grazing.length,6);assert.equal(wk.nait.length,1);assert.ok((await run('help')).commands.includes('release-sale'));

 // Sales: the checks run before a sale can reduce the head count.
 await rejects('release-sale',['October steers','--reviewed-by=Hemi'],/Release blocked: WHP HOLD/);
 await rejects('stock-event',['Romney Ewes','--kind=sale','--delta=-1','--reference=X'],/plan-sale/);
 await run('plan-sale','Romney Ewes','--name=Works ewes',`--date=${today}`,'--head=20','--destination=Demo Processor','--asd=ASD-DEMO-9','--amount=3000');
 const sale=await run('release-sale','Works ewes','--reviewed-by=Aroha');assert.equal(sale.delta,-20);assert.equal(find(await run('mobs'),'name','Romney Ewes').head,1127);
 await rejects('release-sale',['Works ewes','--reviewed-by=Aroha'],/RELEASED/);
 await run('plan-sale','Red Hinds','--name=Hinds tomorrow',`--date=${date(1)}`,'--head=5','--destination=Demo Venison','--asd=ASD-D');
 assert.equal(find(await run('sale-check'),'name','Hinds tomorrow').decision,'NAIT DESTINATION MISSING');
 await rejects('release-sale',['Hinds tomorrow','--reviewed-by=Aroha'],/NAIT DESTINATION MISSING/);

 // Withholding boundary: treatment day is day zero, clear the day after the last withholding day.
 const held=find(await run('withholding'),'mob','Angus R2 Steers');assert.equal(held.whp_clear,date(11));
 for(const [d,decision] of [[10,'WHP HOLD'],[11,'READY FOR REVIEW']]){await run('plan-sale','Angus R2 Steers',`--name=Boundary ${d}`,`--date=${date(d)}`,'--head=1','--destination=Demo','--nait=DEMO-NAIT-900','--asd=ASD-B');assert.equal(find(await run('sale-check'),'name',`Boundary ${d}`).decision,decision);}

 // Grazing and spray holds.
 await rejects('move',['Angus R2 Steers','--to=Woolshed'],/Spray hold/);
 await rejects('move',['Angus R2 Steers','--to=Bush Block'],/not for grazing/);
 await rejects('move',['Angus R2 Steers','--to=Terrace','--date='+date(1)],/future/);
 assert.equal((await run('move','Angus R2 Steers','--to=Back Terrace','--note=rotation')).head,92);
 await run('spray','Top Face','--product=Demo Thistle Spray','--rate=2 L/ha','--operator=Hemi','--wind=SW 5 km/h','--whp=7');
 assert.equal(find(await run('grazing'),'paddock','Top Face').decision,'SPRAY HOLD');
 await rejects('spray',['Top Face','--product=X','--rate=1','--operator=Hemi','--whp=0'],/--wind/);
 await run('cover','Deer Unit','--kg=1600');assert.ok(!(await run('attention')).some(x=>x.kind==='pasture'&&x.record==='Deer Unit'));

 // Animal health: stock deducted with the treatment, or nothing is written.
 const stock=Number((await db.query("select stock_ml from products where name='Demo Pour-On'"))[0].stock_ml);
 await rejects('treat',['Red Hinds','--product=Demo Pour-On','--head=130','--dose=1000','--operator=Hemi'],/Not enough product/);
 assert.equal(Number((await db.query("select stock_ml from products where name='Demo Pour-On'"))[0].stock_ml),stock);
 await rejects('treat',['Red Hinds','--product=Expired Demo Vaccine','--head=10','--dose=1','--operator=Hemi'],/expired/);
 await rejects('treat',['Red Hinds','--product=Demo Pour-On','--head=999','--dose=1','--operator=Hemi'],/exceeds/);
 await run('treat','Red Hinds','--product=Demo Pour-On','--head=130','--dose=10','--operator=Hemi','--cost=150');
 assert.equal(Number((await db.query("select stock_ml from products where name='Demo Pour-On'"))[0].stock_ml),stock-1300);

 // NAIT: movements need the other location, and recording one clears it.
 await rejects('stock-event',['Angus R2 Steers','--kind=purchase','--delta=5','--reference=BUY-002'],/--nait/);
 await run('stock-event','Angus R2 Steers','--kind=purchase','--delta=5','--reference=BUY-002','--nait=DEMO-NAIT-311','--asd=ASD-X','--amount=7000');
 await run('stock-event','Romney Ewes','--kind=birth','--delta=3','--reference=LAMB-1');
 await rejects('stock-event',['Romney Ewes','--kind=death','--delta=-99999','--reference=BAD'],/Invalid count/);
 await rejects('stock-event',['Romney Ewes','--kind=birth','--delta=1','--reference=OLD',`--date=${date(-30)}`],/before the latest/);
 await rejects('nait-recorded',['NOPE'],/exactly one/);
 await run('nait-recorded','GRAZE-OUT-001');assert.equal(find(await run('nait'),'reference','GRAZE-OUT-001').status,'RECORDED');
 await run('tag','Fawn 07','--eid=DEMO-EID-307');assert.ok(!(await run('compliance')).some(x=>x.rule==='NAIT-TAGGING'));
 await run('declare-nait');assert.ok(!(await run('compliance')).some(x=>x.rule==='NAIT-DECLARATION'));

 // Nitrogen: every application counts toward the season's per-hectare total.
 await run('fertilise','Top Face','--product=Urea','--rate=100','--n=46','--by=Demo');assert.equal(Number(find(await run('nitrogen'),'paddock','Top Face').n_kg_ha),64);
 await rejects('fertilise',['Top Face','--product=Urea','--rate=100','--n=146'],/0 to 100/);
 await rejects('fertilise',['Woolshed','--product=Urea','--rate=100','--n=46','--area=9'],/larger than the paddock/);

 // Health and safety, farm plan, work.
 await run('hazard-review','Quad bikes','--controls=Helmets, crush protection, no passengers');assert.ok(!(await run('compliance')).some(x=>x.rule==='HSWA-HAZARD'));
 await run('incident','--name=Fall from loading ramp','--what=Worker broke wrist at the loading ramp','--by=Aroha','--notifiable');
 await run('worksafe-notified','Quad rollover','--reference=DEMO-WS-1');assert.equal((await run('compliance')).filter(x=>x.rule==='HSWA-EVENT').length,1);
 await run('add','hazard','--name=Deer yards','--location=Deer Unit','--controls=Two people in the yards during the roar','--owner=Hemi');
 await run('add','action','--name=Plant the Top Face gully','--risk=Erosion',`--due=${date(200)}`);
 await rejects('action-done',['Fence the stream'],/--evidence/);await run('action-done','Fence the stream','--evidence=Contractor invoice DEMO-17');
 const task=await run('task-add','--name=Service quad',`--due=${today}`,'--owner=Hemi');await run('task-done',task.id);
 await run('log','Romney Ewes','--note=Found the three in the gully','--by=Aroha');
 await run('stocktake','Romney Ewes','--head=1130','--note=All found');assert.ok(!(await run('attention')).some(x=>x.kind==='stocktake'));
 await rejects('stocktake',['Romney Ewes','--head=1','--note=old',`--date=${date(-1)}`],/dated today/);
 await run('weigh','Romney Ewes','--head=60','--kg=70');await rejects('weigh',['Romney Ewes','--head=2','--kg=70','--date=2026-02-30'],/real YYYY-MM-DD/);
 const mating=await run('mate','Ewe Hoggets','--sire=Ram lambs',`--start=${date(-60)}`,`--end=${date(-25)}`,`--scan-due=${today}`,'--head=380');
 await run('scan',mating.id.slice(0,8),'--scanned=300');await rejects('scan',['zzzz','--scanned=1'],/one mating id/);
 await run('verify-history','Ewe Hoggets','--evidence=Checked vet invoices','--by=Aroha');assert.equal((await run('mob','Ewe Hoggets')).mob.unknown_hold,true,'review does not invent a withholding period');
 await run('add','farm','--name=Test Station','--nait=TEST-1','--region=Otago');
 await run('add','paddock','--farm=Test Station','--name=Test Flat','--area=10');
 await run('add','mob','--paddock=Test Flat','--name=Test Cattle','--species=cattle','--head=20','--su=6');
 await run('add','product','--name=Test Drench','--batch=T1',`--expiry=${date(60)}`,'--stock=100','--whp=0','--acvm=TEST-A1');
 await run('add','animal','--mob=Test Cattle','--name=Tag T1',`--born=${date(-30)}`,'--sex=female');
 await rejects('move',['Test Cattle','--to=River Flats'],/another farm/);
 await rejects('add',['mob','--paddock=Test Flat','--name=Goats','--species=goat','--head=1','--su=1'],/check constraint/);

 // Drafts land in drafts/ and never send.
 for(const [cmd,args] of [['draft-sale',['Cull ewes']],['draft-treatment',['Angus R2 Steers']],['draft-audit',['--farm=Kowhai Downs Demo']]]){const d=await run(cmd,...args);const html=fs.readFileSync(d.file,'utf8');assert.match(html,/DRAFT/);assert.match(html,/Kowhai Downs/);fs.unlinkSync(d.file);}

 // Import: dry run writes nothing, a replay is skipped, a bad row rolls back every file.
 const files={
  paddocks:'Paddock,Effective Area (ha)\nImport Flat,22\n',
  mobs:'Mob,Paddock,Species,Stock Class,Number\nImport Hoggets,Import Flat,Sheep,Hoggets,150\n',
  animals:'Mob,VID,EID,Birth Date,Sex\nImport Hoggets,IH-1,,01/08/2025,female\n',
  treatments:`Mob,Product,Batch,Date,Number,Dose (ml),Meat WHP (days),ACVM Number,Operator\nImport Hoggets,Demo drench,B7,${date(-5)},150,5,21,DEMO-A9,Aroha\n`,
  weights:`Mob,Date,Average Weight (kg),Number\nImport Hoggets,${today},41,150\n`,
  fertiliser:`Paddock,Date,Product,Rate (kg/ha),N (%)\nImport Flat,${today},Urea,50,46\n`,
 };
 const flags=['farmiq','--farm=Test Station',`--as-of=${today}`];for(const [k,v] of Object.entries(files)){const file=path.join(tmp,k+'.csv');fs.writeFileSync(file,v);flags.push(`--${k}=${file}`);}
 assert.equal((await run('import',...flags,'--dry-run')).imported,6);assert.equal(await count('import_rows'),0);
 assert.equal((await run('import',...flags)).imported,6);assert.equal((await run('import',...flags)).skipped,6);
 const im=(await run('mob','Import Hoggets')).mob;assert.equal(im.history_verified,false);assert.equal(im.head,150);assert.equal(Number(im.su_per_head),1);
 const bad=path.join(tmp,'bad.csv');fs.writeFileSync(bad,'Paddock,Area\nRollback Flat,10\nBroken Flat,ten\n');
 await rejects('import',['farmiq','--farm=Test Station',`--paddocks=${bad}`],/row 3/);assert.equal((await db.query("select * from paddocks where name='Rollback Flat'")).length,0);
 await rejects('import',['farmiq','--farm=Test Station',`--mobs=${bad}`],/as-of/);
 const fx=['farmiq','--farm=Test Station',`--as-of=${today}`,'--dry-run',...['paddocks','mobs','animals','treatments','weights','fertiliser'].map(k=>`--${k}=${path.join(REPO_ROOT,'fixtures/farmiq',k+'.csv')}`)];assert.equal((await run('import',...fx)).imported,8,'the shipped sample files import');await rejects('import',['agriwebb'],/import farmiq/);

 const exported=await run('export',`--file=${path.join(tmp,'backup.json')}`);const backup=JSON.parse(fs.readFileSync(exported.file));assert.equal(Object.keys(backup.tables).length,20);assert.ok(backup.tables.fertiliser.length>=10);
 await db.close();db=null;

 // Branded documents and views render from the same database.
 const rendered=[];for(const script of ['view.mjs','docs.mjs']){const r=spawnSync(process.execPath,[`scripts/${script}`],{cwd:REPO_ROOT,env:process.env,encoding:'utf8'});assert.equal(r.status,0,r.stderr);for(const line of r.stdout.split('\n')){const m=/^(?:view|doc): (.+)$/.exec(line);if(m)rendered.push(path.join(REPO_ROOT,m[1]));}}
 assert.ok(rendered.length>=8,`rendered ${rendered.length}`);for(const file of rendered){assert.match(fs.readFileSync(file,'utf8'),/Kowhai Downs Demo/);fs.unlinkSync(file);}
 const json=JSON.parse(cli(['mobs','--json']).stdout);assert.ok(json.length>=6);
 assert.match(cli(['sale-check']).stdout,/WHP HOLD/);assert.doesNotMatch(cli(['diary']).stdout,/GMT/);
 assert.match(cli(['mob','e'],1).stderr,/Ambiguous/);assert.match(cli(['nope'],1).stderr,/Unknown command/);
 assert.deepEqual(COMMANDS.filter(c=>!covered.has(c)),[]);
 const slash=fs.readdirSync(path.join(REPO_ROOT,'.claude/commands')).filter(f=>f.endsWith('.md')&&f!=='README.md');
 console.log(`PASS: ${checks} checks; ${COMMANDS.length} CLI commands and ${slash.length} slash commands; NAIT windows, withholding boundary, nitrogen cap, rollback, CSV replay, documents and views verified.`);
}finally{if(db)await db.close();fs.rmSync(tmp,{recursive:true,force:true});}
