# MobileActionFab Spec

## Goal

On mobile, primary create/export actions should live in one small floating action button above the bottom navigation. Desktop toolbars keep their existing actions.

## Behavior

- Render only on mobile breakpoints through CSS.
- Main button is a 52px round button at bottom-right, above bottom nav and safe-area inset.
- Tapping opens a compact vertical action menu above the button.
- Tapping an action runs the existing handler, then closes the menu.
- Tapping the backdrop or pressing `Escape` closes the menu.
- Component must not change data shape, API payloads, modal behavior, or business rules.

## API

```ts
type MobileActionFabAction = {
  key: string;
  label: string;
  icon?: React.ReactNode;
  tone?: 'primary' | 'success' | 'warning' | 'danger' | 'neutral' | 'zalo';
  onClick: () => void;
};
```

`MobileActionFab` accepts:

- `actions`: ordered list of actions.
- `label`: accessible label for the main button.

## Screen Mapping

- Overview: `Điểm danh`, `Thu học phí`, `Thêm học sinh`, `Nhắc phí Zalo`.
- Training students: `Thêm học sinh`.
- Training classes: `Thêm lớp`.
- Training teachers: `Thêm giáo viên` inside `TeachersTab`.
- Operations: `Ghi buổi học`.
- Finance debt/ledger: `Thêm phiếu thu`.
- Finance expense: `Thêm phiếu chi`.
- Reports: `Xuất CSV`, `In kỳ hiện tại` inside `ReportsTab`.

## Layout Rules

- Existing toolbar actions use `.ltn-page-toolbar-actions`.
- On mobile, toolbar actions are hidden to avoid duplicated action buttons.
- Inline row/card actions stay visible because they operate on a specific record.
