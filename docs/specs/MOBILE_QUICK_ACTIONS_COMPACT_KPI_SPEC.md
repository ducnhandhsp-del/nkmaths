# Mobile Quick Actions + Compact KPI Spec

## Goal

Improve mobile daily-operation speed without changing data contracts or business logic.

## Scope

- Add one global mobile quick-action `+` button above the bottom nav.
- The quick-action menu opens existing flows only:
  - `Ghi buổi học`
  - `Thêm học sinh`
  - `Phiếu thu`
  - `Phiếu chi`
- Compact KPI cards on mobile so lists and working data stay closer to the top.
- Keep desktop layout and actions unchanged.

## Non-Goals

- Do not add new navigation items.
- Do not change Google Apps Script fields, sheet headers, API payloads, or save logic.
- Do not change filters, row/card click behavior, pagination, or modal data shape.
- Do not introduce a new UI system or dependency.

## Behavior

- The global mobile `+` is visible on mobile across the main app screens.
- Tapping a quick action reuses existing App handlers and opens the same existing modal.
- Existing screen-level mobile add buttons are hidden on mobile to avoid duplicated entry points.
- Desktop toolbar buttons remain visible and unchanged.

## Compact KPI Rules

- Mobile KPI cards use a smaller icon, tighter padding, lower minimum height, and no decorative extra space.
- KPI labels remain readable and can wrap to two lines.
- Subtext stays hidden on mobile when the component already hides it.
- Data-heavy screens should prioritize the table/list/card content after KPIs.

## Acceptance Checks

- Mobile shows a single global `+` quick-action button above bottom nav.
- Quick actions open the existing modals for lesson log, student, payment, and expense.
- Mobile KPI cards are visibly shorter and denser.
- Desktop layout is unchanged.
- `npm.cmd run lint` passes.
- `npm.cmd run build` passes.
