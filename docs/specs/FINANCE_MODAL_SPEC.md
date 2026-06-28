# Finance Modal Spec

## Scope

Apply to the daily-operation vouchers:

- Teaching session form (`DiaryModal`)
- Tuition receipt form (`PaymentFormModal`)
- Expense voucher form (`ExpenseFormModal`)
- Tuition receipt view (`InvoiceModal`)
- Expense voucher view (`ExpenseModal`)

## Principles

- Keep each modal task-specific. Do not combine receipt and expense in one tabbed modal.
- Keep default values as editable suggestions, not hard locks.
- Suggestions may auto-fill only while the user has not edited that field manually.
- Put primary fields in the first viewport. Move only optional notes/details into collapsed sections.
- Use compact modal width: 640-720px for forms, wider only for receipt/print views.
- Avoid duplicate headings already represented by the current tab or modal title.
- Preserve existing GAS/API field names and save handlers unless a separate data-contract task is opened.

## Form Behavior

### Teaching Session

- Class, date, and session time must always be visible and editable.
- Preselected values from schedule are defaults only.
- Selecting a class may suggest the first session time from that class schedule.
- Attendance stays in the main body because it is the core task.

### Tuition Receipt

- Separate modal from expenses.
- Required: student, amount, receipt date, tuition month/year.
- Receipt date must not force tuition month/year after the user edits either field.
- Class and collector may be inferred from student/class records, but remain editable.
- Payer is auto-filled from parent/student only until the user edits it.
- Changing the student should refresh suggested class, payer, and collector.

### Expense Voucher

- Separate modal from tuition receipts.
- Required: description, amount, date.
- Category and spender are editable text/list inputs, not locked to a fixed set.
- Selecting a category may suggest the most recent spender for that category.

### Receipt/Expense Views

- Keep printable views compact.
- Avoid oversized decorative headers.
- Show only the fields needed to verify and print the voucher.
