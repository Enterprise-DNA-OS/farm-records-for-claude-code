<h1 align="center">Farm Records for Claude Code</h1>

<p align="center">
  <strong>The open-source NZ farm records system that is just a database and Claude Code.</strong>
</p>

<p align="center">
  Created by <a href="https://www.enterprisedna.co"><strong>Enterprise DNA</strong></a>. Free and open source. Works with Claude Code, Codex, OpenCode or Cursor.
</p>

<!-- three-doors -->
<table align="center">
  <tr>
    <td align="center"><strong>Do it yourself</strong><br/>Clone it, run it, own it. Free, MIT.<br/><a href="#quick-start">Quick start</a></td>
    <td align="center"><strong>We customise it</strong><br/>Your fields, your rules, your FarmIQ data brought across.<br/><a href="https://enterprisedna.co/omni/book/?offer=replace-software&utm_source=github&utm_medium=readme&utm_campaign=farmiq">Book a call</a></td>
    <td align="center"><strong>We run it for you</strong><br/>Installed, connected and operated inside Omni. Setup fee, then a retainer.<br/><a href="https://enterprisedna.co/omni/instead-of/farmiq?utm_source=github&utm_medium=readme&utm_campaign=farmiq">How it works</a></td>
  </tr>
</table>

<p align="center">
  <img src="https://img.shields.io/badge/Node-20+-339933?style=flat-square" alt="Node 20+" />
  <img src="https://img.shields.io/badge/PostgreSQL-any-336791?style=flat-square" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/PGlite-embedded-3ecf8e?style=flat-square" alt="PGlite" />
  <img src="https://img.shields.io/badge/License-MIT-yellow?style=flat-square" alt="MIT License" />
</p>

---

## What is this

Farm Records for Claude Code is the farm office record system for New Zealand sheep, beef and deer farms. It holds paddocks, mobs and tagged animals, stock changes on and off the farm, NAIT movements and tagging, animal health treatments and withholding, liveweights, mating and scanning, sale plans and ASD references, fertiliser and the synthetic nitrogen cap, the spray diary, the hazard and incident registers, freshwater farm plan actions, tasks and the farm diary. The demo farm, Kowhai Downs, is fictional.

FarmIQ charges per farm per month, excluding GST: NZ$42 for Lite, NZ$84 for Essentials, NZ$190 for Performance+ and NZ$249 for Pro, effective 1 July 2026, with 25% off a second and third farm. That is NZ$1,008 a year on Essentials and NZ$2,988 a year on Pro for one farm. Source: [FarmIQ packs and pricing](https://www.farmiq.co.nz/packs/). See [docs/research.md](docs/research.md) for what was checked and when.

The free version has no licence fee. Your agent subscription, hosting and time are separate. It does not replace FarmIQ's phone app, farm map, offline capture, kill-sheet feeds or links to other farm systems: [the scope is written down](docs/why-no-front-end.md). Anything on that list is what Enterprise DNA builds into your own version.

## Quick start

```bash
git clone https://github.com/Enterprise-DNA-OS/farm-records-for-claude-code.git
cd farm-records-for-claude-code
npm install
npm run demo
npm test
npm run view
npm run docs
```

Node 20 or newer. No database server, account or key needed: an embedded Postgres runs inside Node. The demo loads Kowhai Downs with four mobs across seven blocks, a NAIT movement still inside its 48 hours, an untagged fawn past 180 days, a steer mob on a withholding hold, a paddock over the nitrogen cap, a spray hold, a notifiable quad rollover with no WorkSafe reference and an overdue farm plan action. Open the folder in Claude Code and run `/attention` first, then `/nait`, `/sale-check` and `/nitrogen`. Codex, OpenCode and Cursor use the same command files through AGENTS.md.

For a real farm, use a fresh `DATA_DIR` or your own `DATABASE_URL` (copy `.env.example` to `.env`), run `npm run migrate`, add the farm with `/add` and import your FarmIQ reports with `/import`. Never load the demo seed into a real farm's database. Set the machine and database timezone to Pacific/Auckland so the 48-hour NAIT window counts NZ days.

## The commands

| Command | The job |
|---|---|
| `/attention` | The morning list, NAIT first |
| `/weekly-review` | Monday farm review, drafted to drafts/ |
| `/mobs` | The stock book |
| `/mob` | One mob before a decision |
| `/animals` | The tag register |
| `/reconciliation` | Stock reconciliation, opening to closing |
| `/stock-event` | Births, purchases, transfers, deaths |
| `/nait` | The NAIT round: 48-hour movement window |
| `/nait-recorded` | Mark a movement recorded in NAIT |
| `/tagging` | Cattle and deer to tag before 180 days |
| `/paddocks` | The paddock list |
| `/grazing` | The grazing round |
| `/cover` | Record a pasture cover |
| `/move` | Shift a mob |
| `/movements` | The paddock movement book |
| `/treatments` | The animal health book |
| `/treat` | Record a treatment, take it off the shelf |
| `/withholding` | Who is inside a meat withholding period |
| `/inventory` | The animal health shelf |
| `/performance` | Liveweights and daily gain |
| `/weigh` | Record a weigh |
| `/mating` | Mating and scanning |
| `/sales` | Stock on and off, with ASD and NAIT references |
| `/sale-check` | Before the truck is booked |
| `/draft-sale` | ASD preparation worksheet |
| `/nitrogen` | Synthetic N per hectare against the cap |
| `/fertiliser` | The fertiliser book |
| `/spray-diary` | The spray diary |
| `/hazards` | The hazard register |
| `/incidents` | The incident register and WorkSafe notifications |
| `/farm-plan` | Freshwater farm plan actions |
| `/compliance` | The audit round, every finding cited |
| `/draft-audit` | Farm assurance and farm plan working pack |
| `/draft-treatment` | A mob's treatment record |
| `/farms` | The farm book |
| `/tasks` | The work list |
| `/diary` | The farm diary |
| `/log` | Write a diary note |
| `/add` | Add a missing record |
| `/costs` | Recorded cash per mob |
| `/import` | Bring your FarmIQ records across |
| `/export` | Back up everything to one file |
| `/customise` | Make it fit your farm |
| `/new-view` | Add a read-only view |

The CLI behind them has 59 commands, including every write. See [docs/commands.md](docs/commands.md). Human tables by default, `--json` on every command. A unique part of a name or id works; an ambiguous one stops with a list.

## Rules that protect the records

- A sale plan will not release with stock inside a withholding period, an unknown withholding period, unverified treatment history, too few head, no ASD reference or, for cattle and deer, no destination NAIT number. Release only happens on the planned day and records who reviewed it.
- Cattle and deer moving on or off the farm need the other NAIT location. Each move shows as due for 48 hours and overdue after that until someone records the NAIT date.
- A treatment takes the product off the shelf in the same step. Expired product, a missing ACVM number or withholding period, or too little stock stops it.
- A spray record needs rate, operator and wind, and puts the paddock on a grazing hold. `move` refuses a paddock on hold.
- A muster count records what was counted. It never rewrites the book.
- An import checks every row, rolls back the whole batch on one bad row, and skips rows it has already brought in.

Unknown is not clear. Treating part of a mob holds the whole mob, and stock clear on the day after the last withholding day. Always check the product label and your vet. [docs/compliance.md](docs/compliance.md) has every rule, its source, and which checks are farm policy rather than law.

## Ten questions to ask your farm records

Each is answered by a command today, on your own data.

1. Which cattle and deer movements still need recording in NAIT, and by when? `nait`
2. Which calves or fawns are past 180 days with no NAIT tag or registration? `tagging`
3. Which sale plans are blocked, and is it the withholding period, the ASD or the NAIT destination? `sale-check`
4. Which paddocks are over or near the 190 kg synthetic nitrogen cap this season? `nitrogen`
5. Which paddocks are empty, past their rest period and carrying a recent cover? `grazing`
6. Where does the last muster disagree with the stock book? `attention`
7. Which treatments are missing a batch, ACVM number, operator or withholding period? `compliance`
8. Which notifiable incidents have no WorkSafe reference yet? `incidents`
9. Which freshwater farm plan actions are overdue, and what evidence closed the rest? `farm-plan`
10. What did each mob gain per day between its last two weighs, and how old is that weigh? `performance`

## Documents and views in your brand

Put your farm name, logo and colours in `brand.json`. `npm run docs` renders an animal health treatment record per mob, an ASD preparation worksheet per sale plan and a farm assurance and farm plan working pack, as HTML in docs-out/ ready to print. They are working records, not the ASD, a NAIT record or an audit certificate.

`npm run view` renders four read-only pages into views/: this week, the grazing round, nitrogen this season and the stock book. `/new-view` adds another from a plain description. There is no web server and no editing screen.

## Your first hour: ten things to ask for

1. Put our farm, NAIT number and region in the farm book.
2. Replace the demo paddocks with ours, with effective areas and land use.
3. Import our FarmIQ paddocks, mobs and treatment history, then show the gaps.
4. Use our stock classes and stock unit factors.
5. Set our rest period for each block.
6. Add our animal health products with their ACVM numbers and withholding periods from the labels.
7. Put our logo and colours on the audit pack.
8. Add our freshwater farm plan actions and due dates from the council.
9. Add a milk withholding period if we run dairy cows.
10. Draft Monday's list from NAIT, sale plans and the grazing round.

`/customise` writes a new migration, applies it, updates the commands and tests the change.

## Instead of FarmIQ

[docs/replace-farmiq.md](docs/replace-farmiq.md) covers which FarmIQ reports to download, how to save them as CSV, the accepted headers, what does not come across and how to check the numbers. Run it as a dry run first, then for real. Keep your FarmIQ files and run both side by side until the stock reconciliation agrees.

## Tests and architecture

`npm test` uses a throwaway embedded database. It runs all 59 CLI commands and checks the NAIT 48-hour and 180-day windows, the withholding boundary day, the nitrogen total per hectare, blocked sale release, treatment stock rollback, spray holds, CSV dry run and replay, a bad row rolling back the whole import, name matching, the drafts, the documents and the views. It was run on Linux for this release; the CI workflow runs it on Linux and Windows on every push.

```
farm-records-for-claude-code/
  CLAUDE.md                 how the farm wants this run (routing table and house rules)
  AGENTS.md                 the same, for Codex, OpenCode, Cursor and Gemini CLI
  .claude/commands/         one slash command per farm job
  scripts/farm.mjs          the CLI every command drives
  scripts/lib/import.mjs    import farmiq
  scripts/lib/db.mjs        DATABASE_URL (Postgres, Supabase) or embedded PGlite
  supabase/migrations/      the schema and the views, plain SQL
  supabase/seed.sql         the Kowhai Downs demo farm
  docs/compliance.md        every rule the checker applies, with its source
  views.json, documents.json, brand.json
```

## Want it installed and run for you?

Enterprise DNA builds your own version around how your farm runs, brings your FarmIQ records across, adds the phone capture or map your team needs, and runs it for you as part of **Omni**. One setup fee, then a monthly retainer.

- Book a call: [enterprisedna.co/omni/book](https://enterprisedna.co/omni/book/?offer=replace-software&utm_source=github&utm_medium=readme&utm_campaign=farmiq)
- Read more: [enterprisedna.co/omni/instead-of/farmiq](https://enterprisedna.co/omni/instead-of/farmiq?utm_source=github&utm_medium=readme&utm_campaign=farmiq)

## License

MIT. Copyright (c) 2026 Enterprise DNA. FarmIQ is a trademark of its owner. This project is not affiliated with or endorsed by FarmIQ Systems.
