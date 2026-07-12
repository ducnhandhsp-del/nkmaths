# Baseline Audit - 2026-07-12

Status: Pre-fixed-cycle implementation baseline

## Purpose

Record the local application state before implementing the fixed attendance
cycle model. This baseline preserves the already completed UI, tuition-cycle,
reporting, Parent Portal, and GAS work that is currently deployed or prepared.

## Git starting point

```text
Branch: main
Starting HEAD: 7c40c00 Refine mobile card content
```

Before this audit, the working tree contained:

```text
30 tracked files modified
7 untracked specification files
1188 tracked-line additions
722 tracked-line deletions
```

The line totals exclude the untracked specification files.

## Change groups in the baseline

### Tuition-cycle domain and tests

- `src/measures.ts`
- `src/rules.ts`
- `tests/domainRules.test.ts`
- tuition-cycle specifications under `docs/specs/`

This baseline still implements the receipt-date reset model. The newly approved
fixed-cycle model is documented separately and is not implemented here.

### Finance, reporting, and overview

- `src/FinanceTab.tsx`
- `src/ModalFinance.tsx`
- `src/OverviewTab.tsx`
- `src/ReportsTab.tsx`
- `src/useDomains.ts`

The baseline separates receipt-date revenue from current tuition-cycle status,
but current cycle progress still resets after the latest valid receipt.

### Training screens

- `src/StudentsTab.tsx`
- `src/ClassesTab.tsx`
- `src/TeachersTab.tsx`
- `src/LearningTab.tsx`

These screens consume the shared current-cycle helper and preserve their existing
actions and navigation behavior.

### Operations and mobile UI

- `src/App.tsx`
- `src/AppComponents.tsx`
- `src/OperationsTab.tsx`
- `src/ModalDiary.tsx`
- `src/ModalStudent.tsx`
- `src/ModalClass.tsx`
- `src/MaterialsTab.tsx`
- `src/SettingsTab.tsx`
- `src/uiSystem.tsx`
- `src/index.css`
- `src/helpers.ts`

This group includes compact mobile actions, KPI/card refinements, and related
UI consistency changes completed before the fixed-cycle decision.

### Parent Portal and GAS

- `src/ParentPortal.tsx`
- `apps-script/Code.gs`
- `docs/gas/LOP_TOAN_NK_GAS_2026_2027_FULL.gs`
- `docs/specs/PARENT_PORTAL_MVP_V1_1_SPEC.md`

The GAS source and release copy are synchronized in this baseline. The portal
contract exposes the minimal tuition target and collection threshold fields.

### Supporting specifications

- `EXTRA_ATTENDANCE_TEMP_TUITION_SPEC.md`
- `LESSON_RECORDING_CORE_TYPES_SPEC.md`
- `OVERVIEW_DAILY_OPERATIONS_SPEC.md`
- `MOBILE_QUICK_ACTIONS_COMPACT_KPI_SPEC.md`
- tuition-cycle phase and release specifications

## Known baseline behavior

- Revenue and receipt history use `NgayThu`.
- `ThangHP/NamHP` remains receipt metadata.
- Current tuition progress is shared across admin and Parent Portal.
- The latest positive receipt is still used as the current cycle start boundary.
- A valid receipt currently resets displayed progress to attendance after its
  `NgayThu`.

The final two points are intentional baseline facts, not the target behavior.
They will be replaced only in the fixed-cycle engine phase.

## Safety constraints for the next phase

- Do not change Google Sheets headers or GAS write contracts.
- Do not mix UI redesign with the fixed-cycle engine implementation.
- Preserve `NgayThu` revenue behavior.
- Preserve `ThangHP/NamHP` for compatibility and reconciliation.
- Implement and pass domain tests before migrating UI consumers.
- Do not deploy admin, GAS, or Parent Portal until old/new real-data comparison
  has been reviewed.

## Verification checklist

The baseline commit may be created only after these commands pass:

```text
npm.cmd run test:domain
npm.cmd run lint
npm.cmd run build
npm.cmd run build:portal
npm.cmd run gas:check
```

If the package scripts use a different GAS verification name, record and run the
available equivalent without changing application behavior.
