# Scoped Save And GAS Write Performance Spec

## Problem

The admin app currently uses one global `saving` flag for every write. While a
Google Apps Script request is pending, unrelated forms also receive
`isSaving=true`, so the operator cannot continue with another business task.
Writes can legitimately take several seconds because GAS serializes idempotent
writes with a script lock and may wait up to 30 seconds for that lock.

## Goals

- Prevent duplicate submission of the same business operation.
- Allow independent domains (for example a lesson and a payment) to save without
  disabling every save button in the app.
- Keep background reload blocked until all concurrent writes have settled.
- Preserve optimistic updates, request IDs, timeout reconciliation, API fields,
  and Google Sheets schema.
- Reduce recurring idempotency housekeeping work on the GAS write path.

## Non-goals

- No changes to domain fields, Google Sheets headers, or navigation.
- No fire-and-forget financial writes.
- No shorter timeout that could encourage duplicate submissions after an
  ambiguous network timeout.

## Design

### Frontend save scopes

`useDomains` tracks active save scopes instead of a single lock. Supported
scopes are `student`, `class`, `payment`, `expense`, `lesson`, `teacher`,
`material`, and `delete`.

- A second write in the same scope is ignored while the first is pending.
- Different scopes may run concurrently.
- `saving` remains available as an aggregate compatibility flag.
- `isSaving(scope)` is used by each modal or screen so only the relevant save
  control is disabled.
- A pending-write counter owns `isSavingRef`; it becomes false only when the last
  active write settles.

### Reload coordination

Normal successful writes continue to use optimistic UI and request a background
reload. Auto reload remains blocked while at least one write is active. Existing
load queuing in `useAppData` performs the refresh after the final write.

### GAS idempotency maintenance

Idempotency keys remain protected by `ScriptLock`. Expired-key cleanup is
throttled to at most once per hour instead of scanning all script properties on
every successful write. Request replay behavior and the seven-day key TTL remain
unchanged.

## Acceptance criteria

1. Double-clicking Save in one form creates at most one request.
2. Saving a lesson does not disable the payment, expense, student, or class form.
3. A modal shows loading only for its own domain.
4. Auto reload does not run while any write is active.
5. Timeout reconciliation still reloads server data before releasing the scope.
6. Domain tests, TypeScript checking, and production build pass.

## Rollout and risk

GAS still serializes writes, so concurrent requests may queue on the server; the
change improves operator continuity, not raw Sheets throughput. Idempotent
request IDs protect retries. Monitor GAS execution duration and lock failures
after deployment before considering narrower server lock scope.
