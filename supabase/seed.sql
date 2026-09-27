-- Fictional Hawke's Bay hill country farm. Product names, ACVM numbers and withholding periods are demonstration values, never label guidance.
-- Dates are relative to today so the demo always has something overdue, due and on hold. Safe to run twice.
insert into farms(id,name,nait_number,region,n_cap_kg_ha,ffp_status,ffp_due,nzfap_audit_due,nait_declared_on) values
('10000000-0000-0000-0000-000000000001','Kowhai Downs Demo','DEMO-NAIT-001','Hawke''s Bay',190,'draft',current_date-10,current_date+40,null) on conflict do nothing;

insert into paddocks(id,farm_id,name,area_ha,land_use,rest_days,cover_kg_dm,cover_measured,grazing_clear) values
('20000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000001','Top Face',120,'pastoral',40,1350,current_date-4,null),
('20000000-0000-0000-0000-000000000002','10000000-0000-0000-0000-000000000001','River Flats',35,'pastoral',30,1900,current_date-2,null),
('20000000-0000-0000-0000-000000000003','10000000-0000-0000-0000-000000000001','Back Terrace',50,'pastoral',35,2100,current_date-3,null),
('20000000-0000-0000-0000-000000000004','10000000-0000-0000-0000-000000000001','Deer Unit',40,'pastoral',30,1500,current_date-21,null),
('20000000-0000-0000-0000-000000000005','10000000-0000-0000-0000-000000000001','Woolshed',8,'pastoral',21,1700,current_date-1,current_date+4),
('20000000-0000-0000-0000-000000000006','10000000-0000-0000-0000-000000000001','Swede Block',12,'forage-crop',0,null,null,null),
('20000000-0000-0000-0000-000000000007','10000000-0000-0000-0000-000000000001','Bush Block',60,'non-pastoral',0,null,null,null) on conflict do nothing;

insert into mobs(id,paddock_id,name,species,stock_class,opening_head,opening_date,su_per_head,purchase_cost,history_verified) values
('30000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000001','Romney Ewes','sheep','MA ewes',1200,current_date-120,1.0,0,true),
('30000000-0000-0000-0000-000000000002','20000000-0000-0000-0000-000000000002','Angus R2 Steers','cattle','R2 steers',80,current_date-120,6.0,96000,true),
('30000000-0000-0000-0000-000000000003','20000000-0000-0000-0000-000000000004','Red Hinds','deer','MA hinds',150,current_date-120,1.9,0,true),
('30000000-0000-0000-0000-000000000004','20000000-0000-0000-0000-000000000006','Ewe Hoggets','sheep','Hoggets',400,current_date-120,0.8,0,false) on conflict do nothing;

insert into products(id,name,batch,expiry,stock_ml,whp_days,acvm_number) values
('40000000-0000-0000-0000-000000000001','Demo Pour-On','DEMO-A',current_date+200,20000,14,'DEMO-A0001'),
('40000000-0000-0000-0000-000000000002','Expired Demo Vaccine','DEMO-B',current_date-5,500,0,'DEMO-A0002') on conflict do nothing;

insert into treatments(id,mob_id,product_id,product,batch,treated_on,head,dose_ml,operator,whp_days,acvm_number,cost) values
('50000000-0000-0000-0000-000000000001','30000000-0000-0000-0000-000000000002','40000000-0000-0000-0000-000000000001','Demo Pour-On','DEMO-A',current_date-4,80,40,'Hemi',14,'DEMO-A0001',320),
('50000000-0000-0000-0000-000000000002','30000000-0000-0000-0000-000000000004',null,'Historic drench','UNKNOWN',current_date-40,400,6,'',null,'',180) on conflict do nothing;

insert into weights(id,mob_id,weighed_on,average_kg,sample_head) values
('60000000-0000-0000-0000-000000000001','30000000-0000-0000-0000-000000000002',current_date-60,420,80),
('60000000-0000-0000-0000-000000000002','30000000-0000-0000-0000-000000000002',current_date-10,465,80),
('60000000-0000-0000-0000-000000000003','30000000-0000-0000-0000-000000000001',current_date-45,68,60),
('60000000-0000-0000-0000-000000000004','30000000-0000-0000-0000-000000000003',current_date-12,98,40) on conflict do nothing;

insert into stock_events(id,mob_id,event_date,kind,delta,amount,reference,other_nait,asd_ref,nait_recorded_on) values
('70000000-0000-0000-0000-000000000001','30000000-0000-0000-0000-000000000001',current_date-20,'death',-3,0,'DEATH-001','','',null),
('70000000-0000-0000-0000-000000000002','30000000-0000-0000-0000-000000000001',current_date-15,'sale',-50,7500,'SALE-001','DEMO-NAIT-900','ASD-DEMO-1',null),
('70000000-0000-0000-0000-000000000003','30000000-0000-0000-0000-000000000002',current_date-20,'purchase',10,14000,'BUY-001','DEMO-NAIT-310','ASD-DEMO-0',current_date-16),
('70000000-0000-0000-0000-000000000004','30000000-0000-0000-0000-000000000003',current_date-1,'transfer-out',-20,0,'GRAZE-OUT-001','DEMO-NAIT-420','ASD-DEMO-3',null),
('70000000-0000-0000-0000-000000000005','30000000-0000-0000-0000-000000000002',current_date-30,'transfer-in',2,0,'GRAZE-IN-001','DEMO-NAIT-420','',current_date-29) on conflict do nothing;

insert into movements(id,mob_id,from_paddock,to_paddock,moved_on,head,note) values
('80000000-0000-0000-0000-000000000001','30000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000003','20000000-0000-0000-0000-000000000001',current_date-45,1197,'Ewes off Back Terrace onto Top Face') on conflict do nothing;

insert into fertiliser(id,paddock_id,applied_on,product,rate_kg_ha,n_percent,area_ha,applicator,cost) values
('90000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000002',(select least(current_date,starts+5) from season),'Urea',110,46,35,'Demo Spreading',2300),
('90000000-0000-0000-0000-000000000002','20000000-0000-0000-0000-000000000002',(select least(current_date,starts+30) from season),'Urea',110,46,35,'Demo Spreading',2300),
('90000000-0000-0000-0000-000000000003','20000000-0000-0000-0000-000000000002',(select least(current_date,starts+55) from season),'Urea',110,46,35,'Demo Spreading',2300),
('90000000-0000-0000-0000-000000000004','20000000-0000-0000-0000-000000000002',(select least(current_date,starts+80) from season),'Urea',110,46,35,'Demo Spreading',2300),
('90000000-0000-0000-0000-000000000005','20000000-0000-0000-0000-000000000003',(select least(current_date,starts+20) from season),'Urea',180,46,50,'Demo Spreading',4800),
('90000000-0000-0000-0000-000000000006','20000000-0000-0000-0000-000000000003',(select least(current_date,starts+60) from season),'Urea',180,46,50,'Demo Spreading',4800),
('90000000-0000-0000-0000-000000000007','20000000-0000-0000-0000-000000000006',(select least(current_date,starts+10) from season),'Urea',250,46,12,'Demo Spreading',1500),
('90000000-0000-0000-0000-000000000008','20000000-0000-0000-0000-000000000001',(select least(current_date,starts+15) from season),'DAP',100,18,120,'Demo Topdressing',14000) on conflict do nothing;

insert into sprays(id,paddock_id,applied_on,product,rate,target,operator,wind,grazing_whp_days,cost) values
('91000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000005',current_date-3,'Demo Thistle Spray','2 L/ha','Californian thistle','Hemi','',7,160),
('91000000-0000-0000-0000-000000000002','20000000-0000-0000-0000-000000000006',current_date-90,'Demo Pre-emergent','1.5 L/ha','Weeds before swedes','Aroha','NE 8 km/h',0,240) on conflict do nothing;

insert into matings(id,mob_id,sire,joined_on,ended_on,females,scan_due) values
('a0000000-0000-0000-0000-000000000001','30000000-0000-0000-0000-000000000001','Romney rams, team A',current_date-100,current_date-65,1150,current_date-3) on conflict do nothing;

insert into sale_plans(id,mob_id,name,sale_date,head,destination,destination_nait,asd_ref,amount) values
('b0000000-0000-0000-0000-000000000001','30000000-0000-0000-0000-000000000002','October steers',current_date+5,30,'Demo Processor','DEMO-NAIT-900','ASD-DEMO-2',0),
('b0000000-0000-0000-0000-000000000002','30000000-0000-0000-0000-000000000001','Cull ewes',current_date+2,60,'Demo Processor','','',0) on conflict do nothing;

insert into hazards(id,farm_id,name,location,controls,owner,reviewed_on) values
('c1000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000001','Quad bikes on steep faces','Top Face','Helmets, crush protection, no passengers, induction before first ride','Aroha',current_date-400),
('c1000000-0000-0000-0000-000000000002','10000000-0000-0000-0000-000000000001','Chemical store','Woolshed','Locked store, spill kit, SDS folder, GROWSAFE-trained users only','Hemi',current_date-30) on conflict do nothing;

insert into incidents(id,farm_id,name,occurred_on,description,notifiable,worksafe_ref,reported_by) values
('c2000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000001','Quad rollover Top Face',current_date-5,'Rider thrown on side slope, admitted to hospital overnight','true','','Aroha'),
('c2000000-0000-0000-0000-000000000002','10000000-0000-0000-0000-000000000001','Dog bite at yards',current_date-12,'Minor bite to hand, first aid on site','false','','Hemi') on conflict do nothing;

insert into ffp_actions(id,farm_id,name,risk,due,status) values
('c3000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000001','Fence the stream through River Flats','Stock access to waterways',current_date-20,'open'),
('c3000000-0000-0000-0000-000000000002','10000000-0000-0000-0000-000000000001','Leave a 5 m ungrazed strip below Swede Block','Winter grazing sediment loss',current_date+60,'open') on conflict do nothing;

insert into farm_tasks(id,farm_id,name,due,owner) values
('c0000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000001','Check Deer Unit trough',current_date-2,'Hemi') on conflict do nothing;

insert into counts(id,mob_id,counted_on,observed,expected,note) values
('d0000000-0000-0000-0000-000000000001','30000000-0000-0000-0000-000000000001',current_date-1,1144,1147,'Three short at the shearing muster') on conflict do nothing;

insert into animals(id,mob_id,name,nait_eid,birth_date,sex,nait_registered_on) values
('e0000000-0000-0000-0000-000000000001','30000000-0000-0000-0000-000000000002','Steer 001','DEMO-EID-001',current_date-600,'male',current_date-560),
('e0000000-0000-0000-0000-000000000002','30000000-0000-0000-0000-000000000003','Hind 207','DEMO-EID-207',current_date-900,'female',current_date-860),
('e0000000-0000-0000-0000-000000000003','30000000-0000-0000-0000-000000000003','Fawn 07',null,current_date-190,'female',null) on conflict do nothing;

insert into diary(id,farm_id,mob_id,paddock_id,body,author) values
('f0000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000001','30000000-0000-0000-0000-000000000001',null,'Shearing muster three short. Check the Top Face gullies.','Aroha') on conflict do nothing;
