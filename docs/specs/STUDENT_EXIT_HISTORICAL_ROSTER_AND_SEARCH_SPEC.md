# Student Exit Historical Roster And Search Spec

## Problem

The current `inactive`/`endDate` checks are used directly in both current
operational rosters and historical views. A student who has left can disappear
from a past lesson, a selected attendance month, or a teacher's monthly metrics
even though they were active on the relevant date.

The Students screen already has a keyword filter, but it is hidden on mobile
and its desktop controls are not constrained as one compact group with the
class and status filters.

## Goals

- Keep students who were active on a lesson date available in that lesson's
  attendance roster, even after they leave.
- Keep existing attendance entries visible while editing a historical lesson.
- Include students active in the selected month in Operations attendance and
  teacher monthly metrics.
- Keep inactive students out of current/future operational rosters.
- Present `Tìm`, `Lớp`, and `Trạng thái` as three compact controls without
  exceeding the previous desktop filter-group width.

## Non-goals

- No schema, GAS contract, payment, or class-transfer changes.
- No change to the current Students status filter semantics.
- No change to current-day dashboard alerts.

## Design

Add `isStudentActiveOnDate(student, date)` in `measures.ts`. Before `startDate`
the student is inactive; on or before a valid `endDate`, the student remains
historically active; after `endDate`, the student is inactive. An inactive
student without a valid end date remains inactive.

`DiaryModal` uses this date-aware helper for regular and extra students. Regular
entries already stored in `attendanceList` remain in the roster when editing.
`OperationsTab` and `TeachersTab` use the existing month-aware helper.

The existing `qS` filter becomes the first of a compact three-column group:
`Tìm`, `Lớp`, `Trạng thái`. Its desktop width stays 234px, the previous combined
width of the two selects and their gap; mobile uses three equal fluid columns.

## Acceptance criteria

1. A student with end date 10/07 appears when editing a lesson dated 05/07 and
   is absent from a new lesson dated 12/07.
2. Operations attendance for July includes a student who left during July.
3. Teacher monthly figures include a student active during the selected month.
4. Search, class, and status controls fit in one compact row on desktop and
   mobile without horizontal overflow.
5. Domain tests, TypeScript checking, and production build pass.
