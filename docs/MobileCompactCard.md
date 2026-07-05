# MobileCompactCard Spec

## Goal

Mobile list cards should be scan-first, not mini tables. A card should show the minimum information needed to identify a record, understand its state, and perform the next action.

## Principles

- Keep each card around 88-120px when possible.
- Use the title/subtitle area for identity.
- Use one prominent right-side value or badge for the business state.
- Use short chips for secondary facts, not label/value rows.
- Preserve row click and inline actions.
- Move long details to existing detail modals.
- Do not change data shape, save logic, Google Apps Script fields, or business rules.

## API

```ts
type MobileCompactMeta = {
  key: string;
  label: React.ReactNode;
  tone?: 'primary' | 'success' | 'warning' | 'danger' | 'neutral' | 'info';
};

type MobileCompactCardProps = {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  value?: React.ReactNode;
  badge?: React.ReactNode;
  meta?: MobileCompactMeta[];
  actions?: React.ReactNode;
  onClick?: () => void;
  tone?: UiTone;
  muted?: boolean;
};
```

## Finance First Mapping

### Công nợ

Show:
- Title: student name.
- Subtitle: student id and class.
- Value: amount.
- Badge: tuition status.
- Meta chips: session progress, selected period.
- Actions: collect fee, reminder, receipt when applicable.

Hide from card:
- Duplicate class row.
- Placeholder due date when unavailable.
- Long status explanation.

### Phiếu thu

Show:
- Title: student name or receipt number.
- Subtitle: student id and class.
- Value: amount.
- Meta chips: date, tuition period, collector.
- Actions: edit/delete.

## Training Mapping

### Hoc sinh

Show:
- Title: student name.
- Subtitle: student id and primary class.
- Value: debt month state or active state.
- Badge: active/inactive student status.
- Meta chips: parent name, contact phone, academic level when present.
- Actions: Zalo parent, collect fee.

Hide from card:
- Repeated class row when class already appears in subtitle.
- Long academic notes.
- Any raw internal field names.

### Lop hoc

Show:
- Title: class code.
- Subtitle: teacher name or branch.
- Value: student count.
- Badge: class health status when not normal.
- Meta chips: schedule summary, tuition collection state, branch.
- Actions: record lesson when schedule exists.

Hide from card:
- Full 3-slot schedule when a compact schedule is enough.
- Duplicate class code.
- Long tuition explanation.

### Giao vien

Show:
- Title: teacher name.
- Subtitle: id or specialization.
- Value: active student count or month revenue.
- Badge: teacher status.
- Meta chips: class count, tuition state, attendance state.
- Actions: call teacher when phone exists.

Hide from card:
- Salary details.
- Full list of classes.
- Long notes.

## Operations Mapping

### Lich day

Show:
- Title: class and time.
- Subtitle: weekday and date.
- Value: schedule status.
- Badge: schedule status.
- Meta chips: teacher/facility when available.
- Actions: view logged lesson, record lesson, or locked hint.

### Buoi hoc

Show:
- Title: class and time.
- Subtitle: date.
- Value: attendance ratio.
- Badge: attendance completion status.
- Meta chips: compact lesson content and homework status.

Hide from card:
- Full lesson content.
- Full homework text when too long.

### Chuyen can

Show:
- Title: student name.
- Subtitle: id and class.
- Value: attendance rate.
- Badge: risk/warning state.
- Meta chips: absent count, streak, excused count.
- Actions: Zalo parent.

### Phiếu chi

Show:
- Title: description.
- Subtitle: document number.
- Value: amount.
- Meta chips: date, category, spender.
- Actions: edit/delete.
