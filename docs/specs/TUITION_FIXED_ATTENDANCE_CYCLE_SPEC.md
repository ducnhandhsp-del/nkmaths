# Tuition Fixed Attendance Cycle Spec

Last updated: 2026-07-12
Status: Approved business decision for the next implementation phase

## 1. Purpose

This document defines the next tuition model for Lop Toan NK.

The tuition cycle is fixed by the ordered attendance count from the student's
`startDate`. A receipt confirms payment for a cycle; its `NgayThu` does not reset
attendance progress and does not move cycle boundaries.

This decision supersedes the receipt-date reset rules in
`TUITION_CYCLE_BUSINESS_DECISION_SPEC.md`,
`TUITION_CYCLE_PHASE_3_HISTORICAL_SNAPSHOT_SPEC.md`, and
`TUITION_CYCLE_RELEASE_HARDENING_SPEC.md` where those documents say that the
latest receipt starts a new cycle.

The current source code and production release still use the old receipt-date
reset model. This spec does not authorize changing production in Phase A.

## 2. Sources of truth

The three financial concepts remain independent:

```text
Attendance cycle boundary = ordered valid attendances from startDate
Cash revenue              = NgayThu
Receipt reconciliation    = ThangHP/NamHP
```

- `NgayThu` is used for revenue, cash flow, receipt history, and reports by date.
- `ThangHP/NamHP` remains compatibility and reconciliation metadata.
- Neither `NgayThu` nor `ThangHP/NamHP` may move a cycle boundary.

## 3. Fixed cycle boundaries

The class schedule determines the target using the existing finance rules:

```text
1 session/week -> target 4
2 sessions/week -> target 8
3 sessions/week -> target 12
```

For target 8, the fixed cycles are:

```text
Cycle 1: attendance 1-8
Cycle 2: attendance 9-16
Cycle 3: attendance 17-24
```

The cycle number for attendance position `n` is:

```text
floor((n - 1) / target) + 1
```

Before the first attendance, the student is in cycle 1 at progress `0/target`.

## 4. Valid attendance count

Keep the existing attendance rules:

- count only `Co mat`;
- count a unique `MaBuoi + MaHS` once;
- ignore attendance before `startDate`;
- ignore attendance after `endDate`;
- attendance in an extra or different class counts when it is a valid attendance
  for the student;
- `Vang` and `Co phep` do not increase progress.

Receipts are never used as attendance range boundaries.

## 5. Collection threshold and status

The collection threshold remains half of the target, rounded up:

```text
target 4  -> collect from 2/4
target 8  -> collect from 4/8
target 12 -> collect from 6/12
```

Each cycle has its own payment and status:

- `paid`: the cycle has an assigned valid receipt;
- `not_due`: unpaid and below its collection threshold;
- `due`: unpaid and at or above its threshold, up to the target;
- `overdue`: unpaid, complete, and the student has progressed into a later cycle;
- `needs_review`: data cannot be allocated safely;
- `no_schedule`: the target cannot be determined;
- `inactive`: no open collectible cycle remains after a reliable `endDate`.

An unpaid completed earlier cycle remains overdue even when the student is
currently progressing through a later cycle.

## 6. Receipt allocation without a schema change

Phase B will not add a Google Sheets column solely for cycle allocation.

Valid positive receipts for a student are ordered by:

1. `NgayThu` ascending;
2. creation/update timestamp when available;
3. stable source order as the final fallback.

Receipts are allocated sequentially:

```text
Receipt 1 -> cycle 1
Receipt 2 -> cycle 2
Receipt 3 -> cycle 3
```

Consequences:

- an early receipt pays the next unpaid cycle but does not end that cycle early;
- a late receipt pays the oldest unpaid cycle;
- two receipts in the same month can pay two consecutive cycles;
- `ThangHP/NamHP` does not select the cycle;
- editing or deleting an old receipt recalculates all inferred allocations for
  that student.

If same-day receipts cannot be ordered reliably, keep stable source order and
flag the account for reconciliation instead of silently inventing an order.

## 7. Multiple unpaid cycles

The system must support more than one unpaid cycle for a student.

```text
totalOutstandingAmount = sum(outstandingAmount of every due/overdue cycle)
```

For the current phase, each unpaid due/overdue cycle contributes one
`baseTuition` amount.

Example with target 8, 20 valid attendances, and one receipt:

- cycle 1: paid;
- cycle 2: overdue and unpaid;
- cycle 3: progress 4/8, due and unpaid;
- total outstanding: `2 * baseTuition`.

The UI must expose both the oldest unpaid cycle and the total number/value of
collectible cycles.

## 8. Adjusted, excess, and partial payments

Keep the current MVP rule:

- one positive receipt pays exactly one cycle;
- a receipt below or above `baseTuition` still pays one cycle;
- show the actual amount and mark it as adjusted;
- do not automatically create a remaining balance;
- do not carry excess money into another cycle;
- one large receipt does not automatically pay multiple cycles.

Multi-cycle receipts, refunds, credits, and preserved balances require a later
schema and workflow decision.

## 9. Enrollment changes and uncertain targets

The current data does not provide a reliable historical target snapshot for each
student cycle.

Until a dedicated enrollment-history model exists:

- use the current class target only when the student's historical target is not
  contradicted by available data;
- class transfers or target changes that could alter old cycle boundaries must
  return `needs_review`;
- do not rewrite historical attendance or receipts automatically;
- do not change the Google Sheets schema in the fixed-cycle engine phase.

## 10. Historical snapshots

For `asOfTs` calculations:

- include only valid attendances on or before the cutoff;
- include only receipts on or before the cutoff;
- always rebuild fixed cycles from `startDate`;
- allocate the eligible receipts sequentially to those cycles;
- a future receipt cannot change an earlier snapshot.

`NgayThu` remains the receipt eligibility date for a historical snapshot, but it
never becomes a cycle boundary.

## 11. Admin and parent portal consistency

Admin and Parent Portal must use the same cycle-account result.

Both must agree on:

- current cycle number and progress;
- paid cycle count;
- oldest unpaid cycle;
- number of due/overdue cycles;
- total outstanding amount;
- most recent receipt date and actual amount.

GAS must return only the minimum public data necessary. This spec does not
authorize exposing additional private or administrative fields.

## 12. Required implementation output

The next engine phase must provide an account-level result containing:

- ordered cycle items;
- current cycle;
- paid cycle count;
- due and overdue cycles;
- oldest unpaid collectible cycle;
- total outstanding amount;
- review reasons when allocation is uncertain.

The existing single-cycle helper may remain temporarily as a compatibility
adapter, but it must no longer use the latest receipt as `cycleStartTs`.

## 13. Acceptance cases

### A. On-time payment

At 8/8, the first receipt pays cycle 1. Attendance 9 starts cycle 2 at 1/8.

### B. Early payment

A receipt at 3/8 pays cycle 1. Attendance 4-8 remains in cycle 1. Attendance 9
starts cycle 2. The receipt date does not reset progress to 0.

### C. Late payment

At 12 attendances with no receipt, cycle 1 is overdue and cycle 2 is 4/8 due.
The first receipt pays cycle 1; cycle 2 remains 4/8 due.

### D. Two receipts in one month

Two valid receipts allocate to cycles 1 and 2 even when both have the same
`ThangHP/NamHP`. They are not duplicates merely because they share a month.

### E. Multiple unpaid cycles

At 20 attendances with one receipt, cycles 2 and 3 are collectible and total
outstanding equals two standard tuition amounts.

### F. Historical snapshot

A receipt after the cutoff does not pay a cycle in the earlier snapshot. Fixed
cycle boundaries remain based on attendance order from `startDate`.

### G. Student leaving mid-cycle

Attendance after `endDate` is ignored. An incomplete unpaid final cycle is
`needs_review`; it does not automatically become a full debt or prorated debt.

## 14. Phase boundaries

Phase A, this document:

- approves the fixed-cycle decision;
- records the current baseline;
- does not change source behavior or production.

Phase B:

- implements the account engine and domain tests;
- does not deploy production.

Later phases:

- migrate admin screens, GAS, and Parent Portal;
- compare old/new results with real data;
- deploy all dependent surfaces together.

## 15. Non-goals

- No Google Sheets schema change in the engine phase.
- No automatic prorating.
- No automatic refund or credit balance.
- No automatic multi-cycle allocation from receipt amount.
- No tuition amount per class/student unless separately approved.
- No production deployment in Phase A.
