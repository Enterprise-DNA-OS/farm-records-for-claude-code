---
description: Record a birth, purchase, transfer in or out, death or adjustment.
---

Run `npm run farm -- stock-event "<mob>" --kind=<birth|purchase|transfer-in|death|transfer-out|adjustment> --delta=<+/-head> --reference=<ref> [--nait=<other NAIT location>] [--asd=<ASD ref>] [--amount=<$>]`.

Cattle and deer moving on or off need `--nait`. Sales go through /sale-check and `release-sale`. After a cattle or deer move, remind the operator it must be in NAIT within 48 hours. Nothing sends.
