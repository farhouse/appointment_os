# /private skeleton + role-based UI plan (barber-os)

## Context / Goal
We want a clean routing/UI structure where authenticated pages live under `/private/**`, and the UI is organized primarily by *role* (OWNER, ADMIN, MANAGER, BARBER, CLIENT). We also want to support future client login for loyalty points.

Key principles:
- Keep **layouts few** (chrome-based), avoid layout-per-role unless UI is truly different.
- Use **route middleware** for UX redirects/guards, but rely on **API RBAC** (`requireRole`) for real security.

## Roles
- OWNER: superuser (can do anything; treated like manager+)
- ADMIN: admin
- MANAGER: branch manager
- BARBER: professional
- CLIENT: end-customer (future: can log in to see points/appointments/book)

## Routing structure
- Public:
  - `/login` (auth layout)
  - `/public/*` (booking/public info) [existing backend uses `/api/public/*`]

- Private:
  - `/private` (role router: redirects based on current user role)
  - `/private/manager/*` (OWNER/ADMIN/MANAGER)
  - `/private/barber/*` (BARBER)
  - `/private/client/*` (CLIENT)

## Pages (placeholders created)
Manager:
- `/private/manager` (dashboard)
- `/private/manager/calendar`
- `/private/manager/cash`
- `/private/manager/products`
- `/private/manager/stock`
- `/private/manager/employees`
- `/private/manager/settings`

Barber:
- `/private/barber` (home)
- `/private/barber/today`
- `/private/barber/appointments`

Client:
- `/private/client` (home)
- `/private/client/book`
- `/private/client/appointments`

## Layouts
- `layouts/auth.vue`: minimal auth shell
- `layouts/private.vue`: shared authenticated chrome (sidebar/topbar later)

Sidebar should be **filtered by role** (already implemented).

## Frontend middleware
- `middleware/private.ts`: requires auth for `/private/**` by calling `/api/me`.
- `middleware/role.ts`: enforces `definePageMeta({ roles: [...] })` and redirects unauthorized users to `/private`.

Login behavior:
- After `/api/auth/login`, redirect to `?redirect=...` or `/private`.

## Backend/data considerations (for agent)
- Prisma enum `Role` now includes: OWNER, ADMIN, MANAGER, BARBER, CLIENT.
- `employeeSchema.role` updated to accept OWNER/CLIENT too.

Future (client login for loyalty):
- Prefer mapping CLIENT users as `User(role=CLIENT)` linked 1:1 to `Client` entity.
- Need decision on how to create/link that association and how `/api/me` returns it.

## What we want the agent to do next
1) Review the current implementation for correctness and consistency (Nuxt routing, middleware, and role filtering).
2) Ensure RBAC story is consistent end-to-end (JWT payload includes role, middleware sets `event.context.user`, UI redirects don’t conflict).
3) Propose the minimal model change to link `User(role=CLIENT)` to `Client` for loyalty without adding new product features yet.
4) Update docs (or add `docs/ARCHITECTURE_PRIVATE.md`) explaining the `/private` structure and role guards.
