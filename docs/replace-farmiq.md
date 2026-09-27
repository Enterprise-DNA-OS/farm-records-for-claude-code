# Moving off FarmIQ

A one-command import of the records FarmIQ lets you download. Plan an afternoon: most of it is checking, not copying.

## 1. Download what FarmIQ gives you

FarmIQ's report centre lets you run reports and download them. Download each report you have on your pack, open it in Excel and use **Save As, CSV (comma delimited)**:

| This system | What to look for in FarmIQ's reports | Pack that records it |
|---|---|---|
| `--paddocks` | Paddock list with effective area | Lite and up |
| `--mobs` | Stock list of mobs, run on one date | Performance+ and Pro |
| `--animals` | Individual animal list with EID | Pro |
| `--treatments` | Animal health treatment report | Essentials and up |
| `--weights` | Liveweights by mob | Performance+ and Pro |
| `--fertiliser` | Fertiliser application report | Essentials and up |

Report names and columns differ between packs and change over time, and this build was tested on sample files, not on a real FarmIQ account. Check what your account offers. If a report will not download, ask FarmIQ support for your data before you cancel.

## 2. Check the headers

Headers are matched without caring about case. Each field accepts these names (first match wins):

| Field | Accepted headers |
|---|---|
| Mob | Mob, Mob Name, Name, Group |
| Paddock | Paddock, Paddock Name, Location, Block |
| Area | Effective Area (ha), Area (ha), Area, Hectares, Effective Area |
| Species | Species, Stock Type, Animal Type (sheep, cattle or deer; "beef" and "dairy" read as cattle) |
| Number | Number, Head, Count, Stock Count, Number of Animals, Quantity |
| Date | Date, Event Date, Treatment Date, Weigh Date, Application Date (DD/MM/YYYY or YYYY-MM-DD) |
| Product | Product, Product Name, Treatment, Fertiliser, Fertiliser Product |
| Dose | Dose (ml), Dose, Dosage, Dose Rate |
| Withholding | Meat WHP (days), Meat WHP, WHP (days), WHP, Withholding Period |
| ACVM | ACVM, ACVM Number, ACVM No, Registration Number |
| Weight | Average Weight (kg), Average Weight, Liveweight (kg), Weight (kg), Avg Weight |
| EID | EID, NAIT Tag, RFID, Electronic ID |
| Tag | VID, Visual ID, Tag, Management Tag |
| Rate | Rate (kg/ha), Rate, Application Rate |
| N | N (%), N %, Nitrogen %, N Content |

If a column has another name, rename it in Excel, or ask Claude Code to add the alias in `scripts/lib/import.mjs`. Sample files are in `fixtures/farmiq/`.

## 3. Test run, then the real run

```bash
npm run farm -- add farm --name="Your Farm" --nait=<NAIT number> --region="<region>"
npm run farm -- import farmiq --farm="Your Farm" --as-of=2026-09-27 \
  --paddocks=paddocks.csv --mobs=mobs.csv --animals=animals.csv \
  --treatments=treatments.csv --weights=weights.csv --fertiliser=fertiliser.csv --dry-run
```

The dry run reports what would come across, file by file, and stops on the first bad row with the file and row number. Nothing is written. Fix the file, run it again, then drop `--dry-run`. Running the same files twice skips rows already imported.

`--as-of` is the date the mob list was run: it becomes each mob's opening head. Stock changes after that date are entered with `/stock-event` or `/sale-check`.

## 4. What does not come across

- The farm map, paddock shapes and map layers.
- Stock movement history, NAIT movement history and past sales. The mob list is a snapshot; keep FarmIQ's reports as the record of what came before.
- Spray records, hazards, incidents, farm plan actions and the diary. Enter the open ones by hand; keep the rest as files.
- Kill sheets, wool, velvet, milk, soil tests, feed budgets, weather and timesheets.
- Every imported mob starts with its treatment history marked unverified. `/sale-check` blocks those mobs until someone checks the treatment records and runs `verify-history`. Treatments with no withholding period or ACVM number stay an unknown hold until they are filled in from the label.

## 5. Check the numbers, run both, then cancel

Run `/reconciliation` and compare head per mob with FarmIQ's stock reconciliation on the same date. Run `/nitrogen` and compare with FarmIQ's nutrient report. Run `/compliance` to see the gaps the import left. Keep recording in both for a week or two until they agree. FarmIQ runs month to month, so cancel once you trust the new records, and keep the downloaded files.

Enterprise DNA does this mapping and the checking for you, and brings across the history the free importer does not: https://enterprisedna.co/omni/instead-of/farmiq
