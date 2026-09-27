# Farm Records for Claude Code: operating instructions

This file is the brain. Claude Code reads it at the start of every session. It says who this is for, how work gets done, and the one right way to do each recurring job.

## Who this is for

- **Business:** [YOUR FARM] (the demo is Kowhai Downs, a fictional Hawke's Bay sheep, beef and deer farm)
- **Operator:** [YOUR NAME], [owner, manager or farm office]
- **What matters most:** stock that can legally go on the truck, NAIT on time, and an audit pack with no surprises

Fill this in once. A worker with context knows. A worker without it guesses.

## How to work

1. **Take a brief, not a script.** The operator describes the outcome. You run the right command and present the answer.
2. **Read before you write.** Before drafting anything about a record, read its full history first.
3. **Plain language.** Short sentences. No filler. Numbers in tables.
4. **Silent success, loud problems.** No play-by-play. Say what broke and what you did about it.
5. **Stop at the line.** Anything that sends, deletes, or faces a customer waits for a yes in this session.

## Routing table: one right way for each recurring job

| When the operator asks for... | Use this |
|---|---|
| What needs doing today | `/attention` |
| Monday review | `/weekly-review` |
| Mobs, head, stock units | `/mobs` |
| One mob in detail | `/mob` |
| Tag register | `/animals` |
| Stock reconciliation | `/reconciliation` |
| A birth, purchase, transfer or death | `/stock-event` |
| NAIT movements due or overdue | `/nait` |
| Mark a movement done in NAIT | `/nait-recorded` |
| Calves or fawns to tag | `/tagging` |
| Paddocks | `/paddocks` |
| What to graze next | `/grazing` |
| A pasture cover reading | `/cover` |
| Shift a mob | `/move` |
| Where mobs have been | `/movements` |
| Treatments given | `/treatments` |
| Record a treatment | `/treat` |
| Who is inside withholding | `/withholding` |
| Animal health products on the shelf | `/inventory` |
| Liveweights and gain | `/performance` |
| Record a weigh | `/weigh` |
| Mating and scanning | `/mating` |
| Stock on and off the farm | `/sales` |
| Can this stock go on the truck | `/sale-check` |
| The ASD worksheet | `/draft-sale` |
| Nitrogen cap | `/nitrogen` |
| Fertiliser applied | `/fertiliser` |
| Spray records | `/spray-diary` |
| Hazards | `/hazards` |
| Incidents and WorkSafe | `/incidents` |
| Freshwater farm plan | `/farm-plan` |
| Audit round | `/compliance` |
| Audit pack for the assessor | `/draft-audit` |
| A mob's treatment record | `/draft-treatment` |
| The farm book | `/farms` |
| Work list | `/tasks` |
| Farm diary | `/diary` |
| Write a note | `/log` |
| Add a record | `/add` |
| Cash per mob | `/costs` |
| Bring FarmIQ data across | `/import` |
| Back up everything | `/export` |
| Change a field, rule or name | `/customise` |
| A new read-only page | `/new-view` |

If an ask fits nothing here, run the CLI directly (`npm run farm -- help`) and then propose a new command for it.

## Hard rules

- Never send email or messages from here. Draft to `drafts/`, a person sends.
- Never delete records without an explicit yes in this session. Prefer marking closed or archived.
- Never invent a record. If a name is ambiguous, list the candidates and ask.
- The database is the source of truth. If the answer is not in it, say so.

## Farm rules

- NAIT, ASD, WorkSafe and the regional council are official channels. This system records references and dates; it never submits to them, and a reference here is not proof the official record exists.
- Never invent an ACVM number, a withholding period, a NAIT number or an ASD reference. Ask for the label or the form.
- Never weaken a withholding hold, a spray hold or a sale check without the operator's explicit instruction and the evidence, and record who said so in the diary.
- Unknown is not clear. Treating part of a mob holds the whole mob.
- The nitrogen cap is stored per farm. Change it only on the regional council's advice.
- Cite docs/compliance.md for every finding. A finding is a missing or late record, not an offence.

## Where things live

- `scripts/` the CLI. `scripts/lib/db.mjs` picks `DATABASE_URL` (Postgres, Supabase) or the embedded database in `.data/`.
- `supabase/migrations/` the schema, plain SQL. `npm run migrate` applies it.
- `.claude/commands/` the slash commands. Add one every time the same ask comes twice.
- `docs/` the thesis and the guide for moving off FarmIQ.

Built by Enterprise DNA. Installed and run for you as part of Omni: https://enterprisedna.co/omni/instead-of/farmiq
