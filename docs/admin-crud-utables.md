# Admin CRUD (UTable) plan — Barber OS

Goal: For all Admin/Manager CRUD areas, use a consistent `UTable`-based UI (Nuxt UI) with:
- list + search + sort
- pagination
- create/edit in modal (or slide-over)
- delete with confirm
- optimistic refresh
- consistent empty/loading/error states

## Target pages (admin)
Implement on these existing routes (or create if missing):
- `/private/manager/stock`
- `/private/manager/products`
- `/private/manager/employees` (barbers/managers/admins)
- (optional later) `/private/manager/services`
- (optional later) `/private/manager/branches`

## UX conventions
### Table layout
- Top bar:
  - page title
  - primary button: **New**
  - search input (debounced)
  - optional filters (branch, active, role)
- Table:
  - `UTable` with columns definition
  - row actions dropdown: Edit / Delete
  - row click opens Edit
- Footer:
  - pagination controls

### Create/Edit
- Use `UModal` or `USlideover` (prefer modal first)
- Form uses `UForm` + zod schema (client-side)
- Submit disables buttons and shows loading
- On success: close modal, toast, refresh list

### Delete
- Confirm dialog
- On success: toast + refresh list

### States
- Loading skeleton for table
- Empty state with CTA to create
- Error state with retry

## Data / API constraints
Use existing API endpoints where available.
If an endpoint is missing for list/create/update/delete, add it (server/api) with:
- auth enforced via existing server middleware
- role guard: MANAGER/ADMIN/OWNER
- zod validation

## Table definitions (minimum)
### Products
Columns:
- name
- price
- active
- updatedAt
Actions: edit/delete

### Stock
Depends on current schema.
Columns (guess; adjust to actual Prisma):
- product
- branch
- quantity
- updatedAt
Actions: edit (quantity adjustment), delete (if supported)

### Employees
Columns:
- name
- email
- role
- active
- branches count
Actions: edit (role/active/branches), reset password, delete (optional)

## Implementation structure
- Create reusable composables:
  - `useCrudTable()` helper for query/search/pagination
- Create reusable components:
  - `CrudTable.vue` (optional) wrapper around `UTable`
  - `CrudModal.vue` (optional)

## Acceptance checklist
- [ ] Each page is fully usable without devtools
- [ ] Consistent UI across pages
- [ ] Validations prevent bad submits
- [ ] Role restrictions enforced server-side
- [ ] No regressions in existing manager pages
