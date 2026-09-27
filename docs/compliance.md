# NZ farm record checks

Sources checked 27 September 2026. Scope: sheep, beef and deer farm records kept for NAIT, meat processors, farm assurance audits, the freshwater farm plan, the nitrogen cap and health and safety. `/compliance` checks the evidence stored here. A finding means a record is missing or late in this database. It is not proof that an offence happened, and a clean result is not official clearance. Nothing here submits to NAIT, WorkSafe, a regional council or a processor.

Every rule below has a heading the checker cites (`docs/compliance.md#rule`). When a rule changes, update this file and the matching line of `compliance_findings` in the migration together, through `/customise`.

## NAIT-MOVEMENT

Cattle and deer moved between NAIT locations are recorded in NAIT within 48 hours. OSPRI's worked example: animals arriving on a Monday are recorded by 11.59pm Wednesday. The sending PICA records the sending movement and the receiving PICA records the receiving movement. Grazing, mating and sale moves all count.

The checker treats the event date as day zero and the last day as event date plus two. A purchase, transfer in, sale or transfer out of cattle or deer with no NAIT record date is `DUE` inside that window and `OVERDUE` after it. A record entered after the window is `RECORDED LATE`. Sheep are not NAIT animals and are never flagged. Exceptions (bobby calves under 30 days going direct to the processor, moves between properties on the same NAIT number, accredited saleyards) are the operator's call: record the reference with a note.

Source: [OSPRI, Recording animal movements](https://www.ospri.co.nz/farmers-and-livestock-owners/moving-animals/recording-animal-movements).

## NAIT-TAGGING

Cattle and deer are tagged with a NAIT-approved RFID tag and registered before they are 180 days old, or before their first move off farm, whichever comes first. Registration in NAIT follows within 7 days of tagging.

The checker flags an on-farm cattle or deer animal with no EID or no registration date once it is past 180 days of age, and any with no birth date. It cannot see a planned first movement, so `/sale-check` and your own review cover animals leaving before 180 days.

Source: [OSPRI, Registering animals in NAIT](https://www.ospri.co.nz/farmers-and-livestock-owners/tagging-and-registering-animals/registering-animals-in-nait).

## NAIT-DECLARATION

A farm with cattle or deer tells OSPRI each year by 31 July how many other cloven-hoofed animals (sheep, pigs, goats, alpacas and so on) it has. The checker flags a farm carrying cattle or deer once 31 July of the current season has passed with no declaration recorded since 1 June. The 1 June window is this farm's review policy, not a statutory date.

Source: [OSPRI, Tracing your animals](https://www.ospri.co.nz/farmers-and-livestock-owners/tracing-farm-animals/tracing-your-animals-introduction).

## ACVM-TREATMENT

A treatment record carries the product, batch, ACVM registration number, date, number treated, dose, operator and meat withholding period. The checker flags any record missing batch, operator, ACVM number or withholding period. `treat` refuses expired product, product without a withholding period or ACVM number, and a dose larger than the stock on hand.

Farm policy: the treatment day is day zero, and stock clear on the day after the last withholding day. Treating part of a mob holds the whole mob. An unknown withholding period holds the mob until someone records it from the label. The demo products and their withholding periods are fictional: always read the actual label or your vet's direction.

Source: [MPI, Animal status declarations](https://www.mpi.govt.nz/animals/slaughtering-requirements/animal-status-declarations) (the ASD asks whether any animal is within the withholding period of any treatment).

## TREATMENT-HISTORY

An imported mob cannot prove that every treatment came across. Imported mobs stay unverified until a named person records the evidence they checked with `verify-history`. Verification does not invent a missing withholding period. This is a record-keeping policy that supports the ASD declaration, not an extra legal requirement.

Source: [MPI, Animal status declarations](https://www.mpi.govt.nz/animals/slaughtering-requirements/animal-status-declarations).

## ASD

Animals sent for processing, to a saleyard or to another property travel with an Animal Status Declaration completed by the PICA, a mandated form under the Animal Products Act 1999. The checker flags a recorded sale with no ASD reference, and `/sale-check` blocks a sale plan until one is recorded. The reference is what someone wrote down here, not a check of the form itself.

Source: [MPI, Animal status declarations](https://www.mpi.govt.nz/animals/slaughtering-requirements/animal-status-declarations).

## N-CAP

The Resource Management (National Environmental Standards for Freshwater) Regulations 2020 limit synthetic nitrogen fertiliser on pastoral land to 190 kg N per hectare per year, on each hectare that is not in annual forage crop and as an average across the pastoral land. Use from 1 July to 30 June is reported to the regional council by 31 July.

The checker totals synthetic N for the current season per paddock (rate x N percent x area spread, divided by paddock area). Pastoral paddocks over the cap are findings, and those at 80% or more show on `/attention` as near the cap. Forage crop and non-pastoral blocks are listed but not capped per hectare. The cap is stored per farm in `farms.n_cap_kg_ha`: the government has consulted on removing it, so confirm the current rule with your regional council. Set it to null only on that advice.

Source: [NES-F Regulations 2020, subpart 4](https://www.legislation.govt.nz/regulation/public/2020/0174/latest/LMS364253.html).

## SPRAY-RECORD

Agrichemical application records hold the product, rate, target, operator, wind and the grazing withholding period. The checker flags a spray record missing rate, operator, wind or grazing withholding. `spray` refuses a record without them and puts the paddock on a grazing hold until the withholding ends. `move` refuses a paddock on hold.

Source: NZS 8409:2021 Management of agrichemicals (record keeping), [Standards New Zealand](https://www.standards.govt.nz/shop/nzs-84092021).

## HSWA-HAZARD

The Health and Safety at Work Act 2015 requires a farm business to identify and manage risks so far as is reasonably practicable. The checker flags a hazard whose controls have not been reviewed in 12 months. The 12-month review is this farm's policy, not a statutory period.

Source: [Health and Safety at Work Act 2015](https://www.legislation.govt.nz/act/public/2015/0070/latest/DLM5976660.html), sections 30 and 36.

## HSWA-EVENT

A notifiable event (a death, a notifiable injury or illness, or a notifiable incident) is notified to WorkSafe as soon as possible, and a record of it is kept for at least 5 years. The checker flags a notifiable incident with no WorkSafe notification reference. Whether an event is notifiable is the operator's judgement: mark it with `--notifiable`.

Source: [Health and Safety at Work Act 2015](https://www.legislation.govt.nz/act/public/2015/0070/latest/DLM5976660.html), sections 56 and 57; [WorkSafe, Notify WorkSafe](https://www.worksafe.govt.nz/notify-worksafe/).

## FFP

Freshwater farm plans under Part 9A of the Resource Management Act apply to farms over the regional thresholds, with certification and audit dates set by the regional council's rollout. The checker flags a farm plan still in draft past the due date the operator recorded, and any open farm plan action past its due date. Actions close only with evidence. Dates come from your council's notice: this system does not calculate them.

Source: [Ministry for the Environment, Freshwater farm plans](https://environment.govt.nz/acts-and-regulations/freshwater-implementation-guidance/freshwater-farm-plans/).

## FARM-INVENTORY

An animal health product past its expiry with stock on hand is flagged. Disposal, storage and authorised use stay the operator's responsibility.

Source: [MPI, Animal status declarations](https://www.mpi.govt.nz/animals/slaughtering-requirements/animal-status-declarations) (treatments recorded on the ASD must be valid).

## Other farm policies

`/attention` also flags liveweights older than 30 days, pasture covers older than 14 days on pastoral paddocks, tasks past due and the latest muster count that disagrees with the book. The rest period is each paddock's own `rest_days`. `REST MET` says only that the rest period has passed since the last recorded move out. The recorded cash margin excludes stock valuation, labour, fertiliser and overheads. Nothing is deleted automatically.
