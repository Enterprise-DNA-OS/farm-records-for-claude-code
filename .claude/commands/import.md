---
description: Bring the farm records across from FarmIQ reports saved as CSV.
---

Read docs/replace-farmiq.md first. Run `npm run farm -- import farmiq --farm="<farm>" --as-of=YYYY-MM-DD --paddocks=... --mobs=... --animals=... --treatments=... --weights=... --fertiliser=... --dry-run`.

Show what would import and any failing row. Only after the operator agrees, run it again without `--dry-run`. Then run /reconciliation and /compliance so the gaps are visible. Nothing sends.
