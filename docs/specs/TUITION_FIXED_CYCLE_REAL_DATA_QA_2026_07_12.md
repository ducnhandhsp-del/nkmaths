# Fixed Tuition Cycle - Real Data QA 2026-07-12

Status: Passed before production deployment

## Scope

Compared the current production receipt-date reset model with the local fixed
attendance-cycle implementation using the same live Google Sheets/GAS data.

No receipt was saved, no Google Sheets row was changed, and no GAS contract or
schema was modified during QA.

## Aggregate comparison

After both applications finished their live-data refresh:

| Metric | Current production | Fixed-cycle local | Difference |
|---|---:|---:|---:|
| Active students | 79 | 79 | 0 |
| Receipts in July by `NgayThu` | 20 | 20 | 0 |
| July revenue by `NgayThu` | 11,000,000 | 11,000,000 | 0 |
| Students needing collection | 50 | 49 | -1 |
| Total outstanding | 30,000,000 | 29,400,000 | -600,000 |
| Students needing review | 3 | 3 | 0 |
| Overdue students | 0 | 0 | 0 |

Revenue and receipt counts are unchanged, confirming that the fixed-cycle engine
does not alter `NgayThu` cash-flow reporting.

## Explained difference - HS077

Student HS077 has:

- target: 8 attendances;
- current fixed progress: cycle 1 at 4/8;
- one receipt dated 02/07/2026 for 600,000;
- receipt reconciliation period: T6/2026.

Current production result:

```text
4/8 after the latest receipt -> Cần thu -> 600,000 outstanding
```

Fixed-cycle result:

```text
Cycle 1 remains attendance 1-8
The existing receipt pays cycle 1
Current progress remains cycle 1 at 4/8
Status: Đã thu
Outstanding: 0
```

This single intended correction explains the aggregate change from 50 to 49
students and from 30,000,000 to 29,400,000 outstanding.

## Admin QA

### Debt table

- Fixed-cycle columns render correctly.
- HS053 displays `CK1 - 10/12`, one collectible cycle, and 600,000 outstanding.
- HS077 displays `CK1 - 4/8`, paid, and no collectible cycle.
- Filters, row click, receipt action, and Zalo action remain available.

### Finance detail

HS077 detail correctly shows:

- paid;
- cycle 1 at 4/8;
- attendance range 1-8;
- zero collectible cycles;
- latest receipt 02/07/2026 for 600,000;
- receipt history allocated to cycle 1 while preserving T6/2026 metadata.

### Payment form

Opened from HS053 without saving:

- student: HS053;
- reconciliation period: T7/2026;
- amount: 600,000;
- student name, payer, class, and collector populated correctly.

The form continues to create one standard-tuition receipt, not a single receipt
for the account's total multi-cycle debt.

## Parent Portal QA

Live lookup for HS053 succeeded on the local portal and matched admin:

- status: Cần thu;
- current cycle: cycle 1 at 10/12;
- collection threshold: 6/12;
- collectible cycles: 1;
- outstanding: 600,000;
- attendance: 10 present, 0 absent, 0 excused, 100%.

The public contract remains unchanged and exposes no additional administrative
or personal fields.

## Release decision

The observed old/new difference is explained by the approved fixed-cycle rule.
No unexplained aggregate difference was found in this dataset.

Admin and Parent Portal may be deployed together after release checks and commit.
GAS source does not require a new deployment because the public contract and
server-side data shape are unchanged.
