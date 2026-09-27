---
description: Shift a whole mob to another paddock on the same farm.
---

Run `npm run farm -- move "<mob>" --to="<paddock>" [--date=YYYY-MM-DD] [--note=...]`.

The CLI refuses a paddock on a spray hold, a non-grazing block, another farm and future dates. Report the refusal as it is. Moves to another property are `stock-event transfer-out` plus a NAIT record. Nothing sends.
