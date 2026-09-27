---
description: Record a completed animal health treatment and take the product off the shelf.
---

Run `npm run farm -- treat "<mob>" --product="<product>" --head=<n> --dose=<ml per head> --operator=<name> [--cost=<$>]`.

The CLI refuses expired product, product without a withholding period or ACVM number, and a dose bigger than stock on hand. Report the new withholding clear date. Nothing sends.
