# Finance Mobile Debt Status Spec

## Goal

Mobile debt cards must show the same tuition-period status as the desktop debt table for the selected month.

## Scope

- Screen: Tai chinh / Hoc phi / Cong no.
- Device: mobile debt card view.
- No schema, GAS, Google Sheet, or debt calculation changes.

## Acceptance Criteria

- The mobile debt badge uses `getDebtPeriodStatus(row)`, same as desktop.
- The mobile amount tone follows the selected-period status.
- Mobile actions follow the selected-period status:
  - paid period with receipt: show `Bien lai`.
  - overdue period with phone: show `Nhac phi`.
  - unpaid/overdue period: allow `Thu phi`.
- Desktop table behavior remains unchanged.
