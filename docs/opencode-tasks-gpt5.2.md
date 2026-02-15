# OpenCode task pack (gpt-5.2-codex) — Remaining work

Use this as the single prompt/source-of-truth for OpenCode.

## Goal
Finish the remaining private-area pages that are still placeholders ("Próximamente") and ensure the Admin/Manager CRUD pages are fully usable.

## Current state (placeholders)
Search key: `pages.private.placeholder`

### CLIENT
- `pages/private/client/appointments.vue` (placeholder)
  - Needs: list upcoming/past appointments for logged-in client.

### BARBER
- `pages/private/barber/appointments.vue` (placeholder)
  - Needs: list appointments for logged-in barber with basic filters.

### MANAGER/ADMIN
- `pages/private/manager/products.vue` (placeholder)
- `pages/private/manager/stock.vue` (placeholder)
- `pages/private/manager/employees.vue` (placeholder)
  - These 3 should become UTable CRUD pages.

- `pages/private/manager/cash.vue` (placeholder)
  - Needs: manager cashbox/sessions UI depending on existing API.

## Part A — Admin/Manager CRUD (UTable)
Implement per `docs/admin-crud-utables.md`.

### A1 Products
- Replace placeholder with `UTable` list.
- Columns: name, price, active, updatedAt.
- Actions: create/edit/delete.
- Use server endpoints (create list/update/delete). If missing, add them in `server/api/**`.

### A2 Employees
- Replace placeholder with `UTable` list.
- Columns: name, email, role, active, branches.
- Actions: create/edit, set password (or reset), deactivate/reactivate.
- Reuse existing endpoints where possible (`server/api/employees/*`).
- Ensure role enforcement OWNER/ADMIN.

### A3 Stock
- Replace placeholder with `UTable` list.
- Provide a workflow for stock movements/adjustments.
- There is an existing endpoint: `server/api/stock/movements.post.ts`.
- If there is no list endpoint, add `/api/stock` list endpoint with filtering by branch.

### A4 Implementation conventions
- Use `UButton`, `UInput`, `UModal`/`USlideover`, `UTable` from Nuxt UI.
- Loading/empty/error states.
- zod validation in API routes.
- Enforce auth server-side (existing server middleware).
- Enforce roles in each endpoint and page meta:
  - products/employees: OWNER/ADMIN
  - stock/cash: OWNER/ADMIN/MANAGER

## Part B — Client appointments page
File: `pages/private/client/appointments.vue`

### UX
- Title: existing i18n key `pages.private.clientAppointments`.
- Show 2 tabs or sections: Upcoming / Past.
- Each item shows: date/time, branch, services, professional, status.

### Data
- Prefer a dedicated endpoint: `/api/client/appointments` (GET).
- Must return only appointments for the logged-in client.
- If such endpoint doesn’t exist, implement it.

### Optional actions
- If appointment is in the future and not canceled: allow cancel/reschedule.
  - If no endpoint exists, skip actions for now and only list.

## Part C — Barber appointments page
File: `pages/private/barber/appointments.vue`

### UX
- Provide list view with filters: date range (week/month), status.
- Reuse patterns from existing barber today page if helpful.

### Data
- Prefer endpoint: `/api/barber/appointments` (GET).
- Must return only appointments for logged-in barber.
- If missing, implement.

## Part D — Manager cash page
File: `pages/private/manager/cash.vue`

### First: inspect existing server APIs
Look for endpoints in `server/api/cash/**` and `server/api/cashboxes/**` and `server/api/cash/sessions/**`.

### Implement minimal usable UI
- Show available cashboxes
- Show current open session (if any) and ability to open/close
- Show movements list

If APIs are incomplete, implement the missing endpoints minimally and safely.

## Quality bar
- No placeholders left in the files listed above.
- Pages load without console errors.
- CRUD operations work end-to-end.
- Role restrictions enforced server-side.
- Commit changes in logical commits:
  1) docs/composables/components
  2) server/api endpoints
  3) each page UI

## Finish
When completely finished, run:
`clawdbot gateway wake --text "Done: Remaining private pages implemented (CRUD + client/barber appointments + manager cash)" --mode now`
