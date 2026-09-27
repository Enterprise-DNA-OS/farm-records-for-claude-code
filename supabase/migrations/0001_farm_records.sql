-- NZ sheep, beef and deer farm records. No extensions required: PostgreSQL 13+ and embedded PGlite run the same schema.
create function touch_updated_at() returns trigger language plpgsql as $$
begin new.updated_at=now(); return new; end $$;

create table farms (id uuid primary key default gen_random_uuid(), name text not null unique, nait_number text not null default '', region text not null default '',
 n_cap_kg_ha numeric default 190 check(n_cap_kg_ha>0), ffp_status text not null default 'draft' check(ffp_status in ('not-required','draft','certified')), ffp_due date,
 nzfap_audit_due date, nait_declared_on date, created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create trigger farms_updated before update on farms for each row execute function touch_updated_at();

create table paddocks (id uuid primary key default gen_random_uuid(), farm_id uuid not null references farms, name text not null, area_ha numeric not null check(area_ha>0),
 land_use text not null default 'pastoral' check(land_use in ('pastoral','forage-crop','non-pastoral')), rest_days integer not null default 30 check(rest_days>=0),
 cover_kg_dm numeric check(cover_kg_dm>=0), cover_measured date, grazing_clear date, unique(farm_id,name),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create trigger paddocks_updated before update on paddocks for each row execute function touch_updated_at();

create table mobs (id uuid primary key default gen_random_uuid(), paddock_id uuid not null references paddocks, name text not null unique,
 species text not null check(species in ('sheep','cattle','deer')), stock_class text not null default '', opening_head integer not null check(opening_head>=0),
 opening_date date not null, su_per_head numeric not null check(su_per_head>0), purchase_cost numeric not null default 0 check(purchase_cost>=0),
 history_verified boolean not null default false, created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create trigger mobs_updated before update on mobs for each row execute function touch_updated_at();

create table animals (id uuid primary key default gen_random_uuid(), mob_id uuid not null references mobs, name text not null unique, nait_eid text unique,
 birth_date date, sex text not null default '', nait_registered_on date, status text not null default 'on-farm' check(status in ('on-farm','sold','dead')),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create trigger animals_updated before update on animals for each row execute function touch_updated_at();

-- Every change to a mob's head count. Movements off or onto the property carry the other NAIT location and the ASD.
create table stock_events (id uuid primary key default gen_random_uuid(), mob_id uuid not null references mobs, event_date date not null,
 kind text not null check(kind in ('birth','purchase','transfer-in','death','sale','transfer-out','adjustment')), delta integer not null,
 amount numeric not null default 0 check(amount>=0), reference text not null, other_nait text not null default '', asd_ref text not null default '',
 nait_recorded_on date, unique(mob_id,reference),
 check((kind in ('birth','purchase','transfer-in') and delta>0) or (kind in ('death','sale','transfer-out') and delta<0) or (kind='adjustment' and delta<>0)),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create trigger stock_events_updated before update on stock_events for each row execute function touch_updated_at();

create table movements (id uuid primary key default gen_random_uuid(), mob_id uuid not null references mobs, from_paddock uuid not null references paddocks,
 to_paddock uuid not null references paddocks, moved_on date not null, head integer not null check(head>0), note text not null default '', check(from_paddock<>to_paddock),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create trigger movements_updated before update on movements for each row execute function touch_updated_at();

create table counts (id uuid primary key default gen_random_uuid(), mob_id uuid not null references mobs, counted_on date not null, observed integer not null check(observed>=0),
 expected integer not null check(expected>=0), note text not null default '', created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create trigger counts_updated before update on counts for each row execute function touch_updated_at();

create table products (id uuid primary key default gen_random_uuid(), name text not null unique, batch text not null, expiry date not null, stock_ml numeric not null check(stock_ml>=0),
 whp_days integer check(whp_days>=0), acvm_number text not null default '', created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create trigger products_updated before update on products for each row execute function touch_updated_at();

create table treatments (id uuid primary key default gen_random_uuid(), mob_id uuid not null references mobs, product_id uuid references products, product text not null,
 batch text not null, treated_on date not null, head integer not null check(head>0), dose_ml numeric not null check(dose_ml>0), operator text not null,
 whp_days integer check(whp_days>=0), acvm_number text not null default '', cost numeric not null default 0 check(cost>=0), source_ref text unique,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create trigger treatments_updated before update on treatments for each row execute function touch_updated_at();

create table weights (id uuid primary key default gen_random_uuid(), mob_id uuid not null references mobs, weighed_on date not null, average_kg numeric not null check(average_kg>0),
 sample_head integer not null check(sample_head>0), unique(mob_id,weighed_on), created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create trigger weights_updated before update on weights for each row execute function touch_updated_at();

create table matings (id uuid primary key default gen_random_uuid(), mob_id uuid not null references mobs, sire text not null, joined_on date not null, ended_on date not null,
 females integer not null check(females>0), scanned_in_lamb integer check(scanned_in_lamb>=0), scan_due date not null, check(ended_on>=joined_on), check(scanned_in_lamb<=females*3),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create trigger matings_updated before update on matings for each row execute function touch_updated_at();

create table sale_plans (id uuid primary key default gen_random_uuid(), mob_id uuid not null references mobs, name text not null unique, sale_date date not null,
 head integer not null check(head>0), destination text not null, destination_nait text not null default '', asd_ref text not null default '',
 status text not null default 'planned' check(status in ('planned','released')), amount numeric not null default 0 check(amount>=0),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create trigger sale_plans_updated before update on sale_plans for each row execute function touch_updated_at();

create table fertiliser (id uuid primary key default gen_random_uuid(), paddock_id uuid not null references paddocks, applied_on date not null, product text not null,
 rate_kg_ha numeric not null check(rate_kg_ha>0), n_percent numeric not null default 0 check(n_percent>=0 and n_percent<=100), area_ha numeric not null check(area_ha>0),
 applicator text not null default '', cost numeric not null default 0 check(cost>=0), source_ref text unique,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create trigger fertiliser_updated before update on fertiliser for each row execute function touch_updated_at();

create table sprays (id uuid primary key default gen_random_uuid(), paddock_id uuid not null references paddocks, applied_on date not null, product text not null,
 rate text not null default '', target text not null default '', operator text not null default '', wind text not null default '', grazing_whp_days integer check(grazing_whp_days>=0),
 cost numeric not null default 0 check(cost>=0), created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create trigger sprays_updated before update on sprays for each row execute function touch_updated_at();

create table hazards (id uuid primary key default gen_random_uuid(), farm_id uuid not null references farms, name text not null, location text not null default '',
 controls text not null default '', owner text not null default '', reviewed_on date, unique(farm_id,name),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create trigger hazards_updated before update on hazards for each row execute function touch_updated_at();

create table incidents (id uuid primary key default gen_random_uuid(), farm_id uuid not null references farms, name text not null unique, occurred_on date not null,
 description text not null, notifiable boolean not null default false, worksafe_ref text not null default '', reported_by text not null,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create trigger incidents_updated before update on incidents for each row execute function touch_updated_at();

create table ffp_actions (id uuid primary key default gen_random_uuid(), farm_id uuid not null references farms, name text not null, risk text not null default '',
 due date not null, status text not null default 'open' check(status in ('open','done')), evidence text not null default '', unique(farm_id,name),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create trigger ffp_actions_updated before update on ffp_actions for each row execute function touch_updated_at();

create table farm_tasks (id uuid primary key default gen_random_uuid(), farm_id uuid not null references farms, name text not null, due date not null, owner text not null,
 status text not null default 'open' check(status in ('open','done')), created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create trigger farm_tasks_updated before update on farm_tasks for each row execute function touch_updated_at();

-- The farm diary. A note can sit on a mob, a paddock or just the farm.
create table diary (id uuid primary key default gen_random_uuid(), farm_id uuid not null references farms, mob_id uuid references mobs, paddock_id uuid references paddocks,
 body text not null, author text not null, created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create trigger diary_updated before update on diary for each row execute function touch_updated_at();

create table import_rows (hash text primary key, kind text not null, source_file text not null, row_number integer not null, created_at timestamptz not null default now());

create index treatments_mob_date on treatments(mob_id,treated_on);
create index events_mob_date on stock_events(mob_id,event_date);
create index fertiliser_paddock_date on fertiliser(paddock_id,applied_on);

-- The season runs 1 July to 30 June, the same year the N cap and the NAIT declaration use.
create view season as select make_date(extract(year from current_date - interval '6 months')::int,7,1) starts,
 make_date(extract(year from current_date - interval '6 months')::int+1,6,30) ends;

create view mob_summary as
select m.id,m.name,m.species,m.stock_class,p.name paddock,f.name farm,f.id farm_id,m.opening_head,
 m.opening_head+coalesce((select sum(e.delta) from stock_events e where e.mob_id=m.id),0)::integer head,
 m.su_per_head,m.history_verified,m.species in ('cattle','deer') nait_species,
 (select max(weighed_on) from weights w where w.mob_id=m.id) last_weighed,
 (select max(treated_on+whp_days+1) from treatments t where t.mob_id=m.id) whp_clear,
 exists(select 1 from treatments t where t.mob_id=m.id and (whp_days is null or acvm_number='')) unknown_hold
from mobs m join paddocks p on p.id=m.paddock_id join farms f on f.id=p.farm_id;

create view grazing_board as
select p.id,p.name paddock,f.name farm,p.area_ha,p.land_use,
 coalesce(sum(s.head),0)::integer head,round(coalesce(sum(s.head*s.su_per_head),0)/p.area_ha,1) su_per_ha,
 p.cover_kg_dm,p.cover_measured,current_date-p.cover_measured cover_age_days,
 (select max(moved_on) from movements v where v.from_paddock=p.id) last_exit,
 current_date-(select max(moved_on) from movements v where v.from_paddock=p.id) rest_so_far,
 p.rest_days,p.grazing_clear,
 case when p.grazing_clear>=current_date then 'SPRAY HOLD' when coalesce(sum(s.head),0)>0 then 'OCCUPIED'
 when (select max(moved_on) from movements v where v.from_paddock=p.id) is null then 'REST UNKNOWN'
 when current_date-(select max(moved_on) from movements v where v.from_paddock=p.id)<p.rest_days then 'REST SHORT' else 'REST MET' end decision
from paddocks p join farms f on f.id=p.farm_id left join mobs m on m.paddock_id=p.id left join mob_summary s on s.id=m.id
where p.land_use<>'non-pastoral' group by p.id,f.name;

create view treatment_register as
select t.id,m.name mob,m.species,t.product,t.batch,t.acvm_number,t.treated_on,t.head,t.dose_ml,t.operator,t.whp_days,t.treated_on+t.whp_days+1 whp_clear,t.cost
from treatments t join mobs m on m.id=t.mob_id;

-- NAIT: a movement between NAIT locations is recorded within 48 hours. The event date is day zero, so the last day is event_date+2.
create view nait_movements as
select e.id,m.name mob,m.species,e.kind,e.event_date,abs(e.delta) head,e.reference,e.other_nait,e.event_date+2 due,e.nait_recorded_on,
 case when e.nait_recorded_on is not null and e.nait_recorded_on<=e.event_date+2 then 'RECORDED'
 when e.nait_recorded_on is not null then 'RECORDED LATE'
 when current_date>e.event_date+2 then 'OVERDUE' else 'DUE' end status
from stock_events e join mobs m on m.id=e.mob_id
where m.species in ('cattle','deer') and e.kind in ('purchase','transfer-in','sale','transfer-out');

-- NAIT: cattle and deer are tagged and registered before 180 days of age or before the first move off farm.
create view nait_tagging as
select a.id,a.name animal,m.name mob,m.species,a.birth_date,a.nait_eid,a.nait_registered_on,a.birth_date+180 due,
 case when a.nait_eid is not null and a.nait_registered_on is not null then 'REGISTERED'
 when a.birth_date is null then 'BIRTH DATE MISSING'
 when current_date>a.birth_date+180 then 'OVERDUE' else 'DUE' end status
from animals a join mobs m on m.id=a.mob_id where m.species in ('cattle','deer') and a.status='on-farm';

create view sale_readiness as
select sp.id,sp.name,ms.name mob,ms.species,sp.sale_date,sp.head,sp.destination,ms.whp_clear,
 case when sp.status='released' then 'RELEASED' when sp.head>ms.head then 'INSUFFICIENT HEAD'
 when not ms.history_verified then 'HISTORY UNVERIFIED' when ms.unknown_hold then 'HOLD UNKNOWN'
 when sp.sale_date<ms.whp_clear then 'WHP HOLD' when sp.asd_ref='' then 'ASD MISSING'
 when ms.nait_species and sp.destination_nait='' then 'NAIT DESTINATION MISSING' else 'READY FOR REVIEW' end decision
from sale_plans sp join mob_summary ms on ms.id=sp.mob_id;

-- Synthetic nitrogen applied this season, per hectare of each paddock.
create view nitrogen_board as
select p.id,f.name farm,p.name paddock,p.land_use,p.area_ha,f.n_cap_kg_ha cap_kg_ha,
 round(coalesce(sum(x.rate_kg_ha*x.n_percent/100*x.area_ha),0)/p.area_ha,1) n_kg_ha,
 case when p.land_use<>'pastoral' or f.n_cap_kg_ha is null then 'NOT CAPPED'
 when coalesce(sum(x.rate_kg_ha*x.n_percent/100*x.area_ha),0)/p.area_ha>f.n_cap_kg_ha then 'OVER CAP'
 when coalesce(sum(x.rate_kg_ha*x.n_percent/100*x.area_ha),0)/p.area_ha>=0.8*f.n_cap_kg_ha then 'NEAR CAP' else 'UNDER CAP' end decision
from paddocks p join farms f on f.id=p.farm_id cross join season s
left join fertiliser x on x.paddock_id=p.id and x.applied_on between s.starts and s.ends
group by p.id,f.name,f.n_cap_kg_ha;

create view performance_board as
select m.name mob,s.head,w.weighed_on,w.average_kg,w.sample_head,
 round((w.average_kg-prev.average_kg)/nullif(w.weighed_on-prev.weighed_on,0),3) daily_gain_kg,
 current_date-w.weighed_on days_since_weigh
from mobs m join mob_summary s on s.id=m.id
left join lateral(select * from weights where mob_id=m.id order by weighed_on desc limit 1) w on true
left join lateral(select * from weights where mob_id=m.id and weighed_on<w.weighed_on order by weighed_on desc limit 1) prev on true;

create view cost_board as
select m.name mob,s.head,m.purchase_cost+coalesce((select sum(amount) from stock_events where mob_id=m.id and kind='purchase'),0) purchases,
 coalesce((select sum(cost) from treatments where mob_id=m.id),0) animal_health,
 coalesce((select sum(amount) from stock_events where mob_id=m.id and kind='sale'),0) sales
from mobs m join mob_summary s on s.id=m.id;

create view compliance_findings as
select 'NAIT-MOVEMENT' rule,mob||' '||reference record,'Movement '||lower(status)||': due '||due issue,'docs/compliance.md#nait-movement' source from nait_movements where status in ('OVERDUE','RECORDED LATE')
union all select 'NAIT-TAGGING',animal,'Not tagged and registered: '||lower(status),'docs/compliance.md#nait-tagging' from nait_tagging where status in ('OVERDUE','BIRTH DATE MISSING')
union all select 'NAIT-DECLARATION',f.name,'Annual declaration of other cloven-hoofed animals not recorded for the latest 31 July','docs/compliance.md#nait-declaration'
 from farms f cross join season s where exists(select 1 from mob_summary ms where ms.farm_id=f.id and ms.nait_species and ms.head>0)
 and current_date>make_date(extract(year from s.starts)::int,7,31) and (f.nait_declared_on is null or f.nait_declared_on<s.starts-31)
union all select 'ACVM-TREATMENT',m.name,'Treatment batch, operator, ACVM number or withholding period missing','docs/compliance.md#acvm-treatment' from treatments t join mobs m on m.id=t.mob_id where t.whp_days is null or t.acvm_number='' or t.operator='' or t.batch in ('','UNKNOWN')
union all select 'TREATMENT-HISTORY',name,'Imported treatment history needs review','docs/compliance.md#treatment-history' from mobs where not history_verified
union all select 'ASD',m.name||' '||e.reference,'Sale recorded without an ASD reference','docs/compliance.md#asd' from stock_events e join mobs m on m.id=e.mob_id where e.kind='sale' and e.asd_ref=''
union all select 'N-CAP',paddock,'Synthetic nitrogen '||n_kg_ha||' kg N/ha this season, over the '||cap_kg_ha||' kg cap','docs/compliance.md#n-cap' from nitrogen_board where decision='OVER CAP'
union all select 'SPRAY-RECORD',p.name||' '||s.applied_on,'Spray record missing rate, operator, wind or grazing withholding','docs/compliance.md#spray-record' from sprays s join paddocks p on p.id=s.paddock_id where s.rate='' or s.operator='' or s.wind='' or s.grazing_whp_days is null
union all select 'HSWA-HAZARD',name,'Hazard controls not reviewed in the last 12 months','docs/compliance.md#hswa-hazard' from hazards where reviewed_on is null or reviewed_on<current_date-365
union all select 'HSWA-EVENT',name,'Notifiable event without a WorkSafe notification reference','docs/compliance.md#hswa-event' from incidents where notifiable and worksafe_ref=''
union all select 'FFP',f.name,'Freshwater farm plan not certified and past its due date','docs/compliance.md#ffp' from farms f where f.ffp_status='draft' and f.ffp_due<current_date
union all select 'FFP',a.name,'Farm plan action overdue since '||a.due,'docs/compliance.md#ffp' from ffp_actions a where a.status='open' and a.due<current_date
union all select 'FARM-INVENTORY',name,'Animal health product expired with stock on hand','docs/compliance.md#farm-inventory' from products where expiry<current_date and stock_ml>0;

create view attention_board as
select 1 priority,'nait' kind,mob||' '||reference record,'Record in NAIT by '||due issue from nait_movements where status='DUE'
union all select 1,'sale',name,decision from sale_readiness where decision not in ('READY FOR REVIEW','RELEASED')
union all select 2,'compliance',record,issue from compliance_findings
union all select 3,'nitrogen',paddock,'Near the cap: '||n_kg_ha||' of '||cap_kg_ha||' kg N/ha' from nitrogen_board where decision='NEAR CAP'
union all select 3,'task',name,'Overdue: '||owner from farm_tasks where due<current_date and status='open'
union all select 3,'weigh',mob,'Liveweight missing or older than 30 days' from performance_board where head>0 and (days_since_weigh>30 or weighed_on is null)
union all select 3,'stocktake',m.name,'Counted '||c.observed||', book says '||c.expected from counts c join mobs m on m.id=c.mob_id
 where c.observed<>c.expected and c.id=(select id from counts where mob_id=m.id order by counted_on desc,created_at desc limit 1)
union all select 4,'pasture',paddock,'Cover missing or older than 14 days' from grazing_board where land_use='pastoral' and (cover_age_days>14 or cover_measured is null);
