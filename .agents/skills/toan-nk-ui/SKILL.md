---
name: toan-nk-ui
description: Lop Toan NK internal UI rules for focused, business-first redesign work in the class center management app.
---

# Lop Toan NK UI Skill

Use this skill when changing UI in the Lop Toan NK internal management app.

## Product Context

This is an internal operations app for a math center. The UI should optimize daily work: checking data, finding records, recording class sessions, tracking tuition, and reviewing teachers/classes. It is not a marketing site.

## Core Rules

- Preserve existing data, filters, actions, modal behavior, and row/card click behavior unless the task explicitly asks otherwise.
- Do not change Google Apps Script fields, API contracts, sheet headers, or business logic during UI-only tasks.
- Reuse existing components from `uiSystem.tsx`, `dsComponents.tsx`, and existing local patterns before creating new primitives.
- Keep desktop data-heavy screens table-first. The DataTable should be the main focus, not decorative KPI blocks.
- On mobile, replace dense tables with clean cards that keep the same row actions and click behavior.
- KPI cards must be compact and decision-oriented. Do not repeat the same information already visible in filters or table headers.
- Filters must be clear, compact, and close to the data they control. Avoid bulky filter panels.
- Avoid generic AI-looking UI: no gradient decoration, no hero section, no oversized cards, no random icons, no decorative visual noise.
- Use restrained typography, stable spacing, predictable alignment, and consistent radius.
- For internal SaaS/admin screens, prefer density, scanability, and low friction over visual novelty.

## Học Sinh Screen Rules

- Desktop: student table is primary. Keep columns scannable and actions easy to reach.
- Mobile: use student cards with name, id, class, parent phone, status, and row actions.
- Keep existing student filters and add/edit/delete behavior.
- Do not modify student schema, GAS fields, payment/debt logic, or modal data shape.
- Any visual cleanup should reduce repeated blocks and improve scanning.

## Workflow

1. Audit the current screen first and list concrete UI problems.
2. Identify existing components that can be reused.
3. Make narrowly scoped UI edits.
4. Run `npm.cmd run lint`.
5. Run `npm.cmd run build`.
6. Report changed files, test results, and remaining risks.
