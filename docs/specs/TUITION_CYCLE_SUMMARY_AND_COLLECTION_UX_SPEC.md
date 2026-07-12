# Tuition Cycle Summary And Collection UX Spec

Last updated: 2026-07-12
Status: Approved for implementation

## 1. Purpose

Complete the fixed attendance-cycle release by making multi-cycle debt totals
semantically correct and making the receipt workflow explicit to operators and
parents.

This phase does not change the fixed-cycle allocation engine, Google Sheets
headers, GAS contracts, or receipt allocation schema.

## 2. Cycle-level financial totals

All totals must be derived from individual cycle items, not only from the
account-level status.

```text
dueAmount = sum(outstandingAmount of due cycles)
overdueAmount = sum(outstandingAmount of overdue cycles)
totalOutstandingAmount = dueAmount + overdueAmount
```

Counts follow the same rule:

```text
dueCycleCount
overdueCycleCount
collectibleCycleCount = dueCycleCount + overdueCycleCount
```

A student may simultaneously contribute to both due and overdue totals.

Example:

```text
Cycle 2: overdue, 600,000
Cycle 3: due, 600,000

Due: 600,000
Overdue: 600,000
Total: 1,200,000
Students requiring action: 1
Collectible cycles: 2
```

## 3. Shared semantic helper

`measures.ts` must expose one pure helper that summarizes one or more
`TuitionAccountState` records.

The result must contain:

- due and overdue amounts;
- total outstanding amount;
- due, overdue, and total collectible cycle counts;
- unique student counts for due, overdue, and any collectible debt;
- review count including both `needs_review` and non-empty `reviewReasons`.

Finance and Reports must use this helper instead of repeating inline formulas.

## 4. Finance KPI semantics

Finance must distinguish units clearly:

- `Đã thu trong tháng`: amount and receipt count by `NgayThu`;
- `Tổng cần thu`: all due plus overdue cycle amounts;
- `Đến hạn`: due cycles only;
- `Quá hạn`: overdue cycles only;
- `Cần đối soát`: unique student accounts requiring manual review.

KPI subtitles must state whether a value counts students, cycles, or receipts.

Debt filters for `due` and `overdue` must inspect cycle collections. A student
with one overdue and one due cycle must appear in both focused views without
duplicating the student in the unfiltered table.

## 5. Reports semantics

Reports and CSV export must expose:

- total outstanding;
- due amount and due cycle count;
- overdue amount and overdue cycle count;
- unique students requiring collection;
- review accounts.

Revenue remains grouped by `NgayThu` and is not affected by cycle status.

## 6. Receipt form context

When a student is selected, the form must show a compact, read-only context:

```text
Thanh toán chu kỳ 2
Phạm vi buổi 9-16
Tiến độ hiện tại 4/8
```

The intended inferred cycle is the next unpaid cycle in sequential receipt
allocation. It is informational only and is not written as a new GAS/Sheets
field in this phase.

The default amount remains one `baseTuition`, even when total account debt spans
multiple cycles.

## 7. Review consistency

Classes, Teachers, Finance, Reports, and Students must treat an account as
requiring review when:

```text
status === needs_review || reviewReasons.length > 0
```

Same-day ambiguous receipt order must therefore be visible in every operational
summary that exposes a review count.

## 8. Adjusted receipts

A positive receipt whose amount differs from `baseTuition` still pays exactly
one cycle under the current MVP rule.

Admin detail/history and Parent Portal must label it as:

```text
Số tiền điều chỉnh
```

They must show the actual receipt amount and must not calculate an automatic
remaining balance or credit.

## 9. UI constraints

- Keep desktop tables as the main Finance surface.
- Keep mobile cards and all existing actions.
- Keep filters adjacent to data.
- Do not add a large explanatory panel.
- Use compact context rows, badges, or KPI subtitles.
- Do not change row click, modal close, receipt save, Zalo, or export behavior.

## 10. Acceptance criteria

1. One account with one overdue and one due cycle contributes one standard fee
   to each category and two fees to total outstanding.
2. Finance filters include that account in both focused cycle-status views.
3. Reports and Finance show identical due, overdue, and total amounts.
4. The receipt form explicitly identifies the inferred cycle and still defaults
   to one standard fee.
5. Same-day ambiguous receipts increment review counts in Classes and Teachers.
6. A 300,000 receipt against a 600,000 standard fee displays the actual amount
   and `Số tiền điều chỉnh` in admin and portal.
7. Domain tests, TypeScript, admin build, portal build, and GAS bundle check pass.

## 11. Non-goals

- No `CycleIndex` column.
- No historical class-target migration.
- No pre-enrollment deposit policy change.
- No automatic partial balance, credit, refund, or multi-cycle receipt.
- No admin-token change.
