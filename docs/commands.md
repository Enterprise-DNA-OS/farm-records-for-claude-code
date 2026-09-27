# CLI reference

`npm run farm -- <command> [name] --field=value [--json]`. Names match exactly first, then as a unique part of the name or id. Dates are YYYY-MM-DD and default to today. `--json` works on every command.

## Reads

`attention`, `farms`, `mobs`, `animals`, `paddocks`, `grazing`, `reconciliation`, `movements`, `treatments`, `withholding`, `inventory`, `performance`, `costs`, `mating`, `sales`, `sale-check`, `nait`, `tagging`, `nitrogen`, `fertiliser`, `spray-diary`, `hazards`, `incidents`, `farm-plan`, `tasks`, `diary`, `compliance`, `mob <mob>`, `weekly-review`, `help`.

## Writes

| Command | Fields |
|---|---|
| `add farm` | `--name` `[--nait]` `[--region]` `[--ffp-due]` |
| `add paddock` | `--name` `--area` `[--use=pastoral|forage-crop|non-pastoral]` `[--rest=30]` `[--farm]` |
| `add mob` | `--paddock` `--name` `--species=sheep|cattle|deer` `--head` `--su` `[--class]` `[--cost]` `[--date]` |
| `add product` | `--name` `--batch` `--expiry` `--stock` (ml) `--whp` (meat days) `--acvm` |
| `add animal` | `--mob` `--name` `--born` `[--eid]` `[--sex]` |
| `add hazard` | `--name` `--controls` `--owner` `[--location]` `[--farm]` |
| `add action` | `--name` `--due` `[--risk]` `[--farm]` |
| `move <mob>` | `--to` `[--note]` `[--date]` |
| `treat <mob>` | `--product` `--head` `--dose` (ml per head) `--operator` `[--cost]` `[--date]` |
| `weigh <mob>` | `--head` (sampled) `--kg` (average) `[--date]` |
| `stocktake <mob>` | `--head` (counted) `--note` |
| `stock-event <mob>` | `--kind=birth|purchase|transfer-in|death|transfer-out|adjustment` `--delta` `--reference` `[--nait]` `[--asd]` `[--amount]` `[--date]` |
| `nait-recorded <reference>` | `[--date]` |
| `tag <animal>` | `--eid` `[--date]` |
| `declare-nait` | `[--farm]` `[--date]` |
| `mate <mob>` | `--sire` `--start` `--end` `--scan-due` `--head` |
| `scan <mating id>` | `--scanned` |
| `plan-sale <mob>` | `--name` `--date` `--head` `--destination` `[--nait]` `[--asd]` `[--amount]` |
| `release-sale <plan>` | `--reviewed-by` |
| `fertilise <paddock>` | `--product` `--rate` (kg/ha) `--n` (N %) `[--area]` `[--by]` `[--cost]` `[--date]` |
| `spray <paddock>` | `--product` `--rate` `--operator` `--wind` `--whp` (grazing days) `[--target]` `[--cost]` `[--date]` |
| `cover <paddock>` | `--kg` (kg DM/ha) `[--date]` |
| `hazard-review <hazard>` | `[--controls]` |
| `incident` | `--name` `--what` `--by` `[--notifiable]` `[--date]` |
| `worksafe-notified <incident>` | `--reference` |
| `action-done <action>` | `--evidence` |
| `verify-history <mob>` | `--evidence` `--by` |
| `task-add` | `--name` `--due` `--owner` `[--farm]` |
| `task-done <task or id>` | |
| `log <mob>` | `--note` `--by` |

## Import, export, drafts

- `import farmiq --farm="<farm>" [--as-of=YYYY-MM-DD] [--paddocks=] [--mobs=] [--animals=] [--treatments=] [--weights=] [--fertiliser=] [--dry-run]`: see docs/replace-farmiq.md.
- `export [--file=path]`: every table to one JSON file.
- `draft-sale <plan>`, `draft-treatment <mob>`, `draft-audit`: HTML to drafts/. Never sent.
