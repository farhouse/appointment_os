# Agent Context: Barber OS

Last updated: 2026-09-29

## Project Summary

Barber OS is an open-source Nuxt 4 MVP for managing a barber shop / worker-based appointment business. It combines a public booking/landing experience with authenticated backoffice, worker, and client areas.

The app is currently in the middle of a domain-language transition from `Barber` to `Worker`. User-facing copy and several routes/API aliases already use worker terminology, but the core Prisma role is still `BARBER` and many internal field/API names still use barber/professional language.

## Stack

- Nuxt `^4.5.2`, Vue `^3.5.27`, TypeScript.
- Nuxt UI `@nuxt/ui` for UI primitives.
- Nuxt i18n `@nuxtjs/i18n`, default locale `es-AR`, secondary locale `en`.
- Nuxt color mode installed, app defaults to light mode.
- Prisma `6.12.0` with PostgreSQL.
- Auth uses JWT, bcrypt, httpOnly auth cookie.
- Validation uses Zod.
- Calendar UI uses `vue-cal`.
- Date helpers use `date-fns`.

## Commands

- Install: `npm install`
- Dev server: `npm run dev`
- Build: `npm run build`
- Generate static output: `npm run generate`
- Preview built app: `npm run preview`
- Seed database: `npm run seed`
- Cash/payment sanity checks: `npm run sanity`
- Type checking: `npm run typecheck`
- Prisma dev sync from README: `npx prisma db push`
- Prisma seed from README: `npx prisma db seed`

There is no unit-test runner yet; typecheck, production build, migration drift validation, seed, and the cash/payment sanity suite are the release gates.

## Required Environment

Minimum `.env` keys:

- `DATABASE_URL`
- `JWT_SECRET`
- `JWT_REFRESH_SECRET` is optional and falls back to `JWT_SECRET`.

Email confirmation settings:

- `MAIL_PROVIDER=resend`
- `MAIL_FROM`
- `MAIL_REPLY_TO` optional
- `RESEND_API_KEY`
- `MAIL_DRY_RUN=true` can log email payloads instead of sending.

Local README recommends Node.js 24 and PostgreSQL 14+. Docker Compose uses Postgres 15 Alpine and Node 24 Alpine.

## Docker

`docker-compose.yml` defines:

- `postgres`: Postgres 15 on host port `5432`.
- `app-dev` under profile `dev`: installs dependencies, generates Prisma client, runs `prisma db push`, prepares Nuxt, then starts dev server on port `3000`.
- `app` under profile `prod`: builds from `Dockerfile`, runs `prisma migrate deploy`, then starts `.output/server/index.mjs`.

Useful commands:

- Dev: `docker-compose --profile dev up --build`
- Prod-like: `docker-compose --profile prod up --build`

## Important Project Files

- `nuxt.config.ts`: Nuxt modules, CSS, i18n config.
- `prisma/schema.prisma`: source of truth for data model.
- `prisma/seed.ts`: demo seed data.
- `server/middleware/auth.ts`: API auth middleware.
- `server/utils/auth.ts`: JWT/cookie helpers.
- `server/utils/permissions.ts`: server-side role helpers.
- `server/utils/http.ts`: request body/param/query validation helpers.
- `server/utils/errors.ts`: shared H3 error helpers.
- `server/utils/schemas.ts`: shared Zod schemas.
- `composables/useMe.ts`: frontend current-user state.
- `composables/useSelectedBranch.ts`: selected branch state/cookie.
- `layouts/private.vue`: authenticated app shell and role-aware navigation.
- `middleware/private.ts`: frontend auth guard for `/private/**`.
- `middleware/role.ts`: frontend role guard.
- `components/CrudTableShell.vue`, `composables/useCrudTable.ts`: reusable admin table patterns.
- `TRACKER.md`: current roadmap/status shortlist.
- `docs/ARCHITECTURE_PRIVATE.md`: private routing/RBAC architecture.
- `docs/REFactor_DECISIONS.md`: recent auth/API refactor rationale.
- `docs/refactor-cashboxes-paid.md`: cashbox/payment design and implementation notes.

## Domain Model

Core Prisma enums:

- `Role`: `OWNER`, `ADMIN`, `MANAGER`, `BARBER`, `CLIENT`
- `AppointmentStatus`: `PENDING`, `CONFIRMED`, `IN_PROGRESS`, `FINISHED`, `PAID`, `CANCELED`, `NO_SHOW`
- `PaymentMethod`: `CASH`, `CARD`, `TRANSFER`, `OTHER`
- `StockMovementType`: `IN`, `OUT`, `ADJUSTMENT`
- `CashMovementType`: `DEPOSIT`, `WITHDRAWAL`

Core models:

- `Branch`: locations, related to users, appointments, stock, sales, cashboxes/sessions, working hours, time blocks.
- `User`: authenticated account; role-based; branch assignments via `UserBranch`; `BARBER` users are appointment professionals/workers.
- `UserBranch`: many-to-many branch assignment for users.
- `Service`: appointment services, price, duration, loyalty point reward.
- `Client`: customer profile separate from authenticated `User`; public booking and loyalty are centered here.
- `Appointment`: booking with branch, client, optional professional, status, notes, confirmation token, payment attribution, notification toggles, services, sale, cash movements, loyalty ledger.
- `AppointmentService`: snapshot join for appointment service price/duration.
- `Product`, `BranchStock`, `StockMovement`, `StockMovementItem`: inventory.
- `Sale`, `SaleItem`: product/service sales, optionally associated with an appointment.
- `LoyaltyLedger`, `Redemption`: client points and product redemption.
- `CashBox`, `CashSession`, `CashMovement`: cash register/session/payment movement system.
- `PaymentMethodConfig`: configured payment mediums by `PaymentMethod`, including system defaults.
- `BranchWorkingHour`, `BarberWorkingHour`: availability defaults.
- `TimeBlock`: blocked calendar/booking time for a branch and optionally a professional.
- `LandingConfig`: configurable public landing HTML.

`User` with role `CLIENT` remains separate from `Client`, linked through the optional unique `User.clientId` relation. Client APIs use that relation, with legacy email backfill support where required.

## Auth And Authorization

Server is the source of truth for authorization.

Access flow:

- Login endpoint validates credentials with bcrypt.
- Access token payload includes `userId`, `role`, optional `email`.
- Access token is stored in the `auth_token` httpOnly cookie.
- Access token TTL is 1 hour.
- Refresh token TTL is 7 days and is returned by login/refresh, but the main browser session relies on the cookie.

Server middleware:

- `server/middleware/auth.ts` protects non-public `/api/**` routes.
- Public exact routes: `/api/auth/login`, `/api/auth/refresh`, `/api/auth/logout`.
- Public prefix: `/api/public/`.
- Middleware verifies token, reloads user from DB, rejects inactive users, and sets `event.context.user`.

Server helpers:

- `getAuthUser(event)` returns typed authenticated user or throws 401.
- `requireRole(event, roles)` enforces real server-side RBAC or throws 403.

Frontend guards are UX only:

- `middleware/private.ts` calls `/api/setup/status`, redirects to `/setup` if needed, then loads `/api/me`; unauthenticated users go to `/login?redirect=...`.
- `middleware/role.ts` checks `definePageMeta({ roles: [...] })`; unauthorized users go to `/private`.

## Role Routing

Authenticated UI lives under `/private/**`.

- `/private` redirects by role.
- `OWNER`, `ADMIN`, `MANAGER` -> `/private/backoffice`
- `BARBER` -> `/private/worker`
- `CLIENT` -> `/private/client`

Current private route families:

- `/private/backoffice/**`: main admin/manager area.
- `/private/manager/**`: older/alias manager pages still present.
- `/private/worker/**`: worker-facing alias routes.
- `/private/barber/**`: older barber routes still present.
- `/private/client/**`: client portal.
- `/private/profile`: profile/password editing.

All private pages should normally set:

```ts
definePageMeta({
  layout: 'private',
  middleware: ['private', 'role'],
  roles: ['...']
})
```

Exception: `/private` itself only needs `middleware: ['private']`.

## Branch Selection

`useSelectedBranch()` is the shared frontend source of truth for selected branch.

- State key: `selected-branch-id`
- Cookie key: `selectedBranchId`
- Fetches branch options from `/api/public/branches`
- Initializes once from cookie, otherwise from default branch.
- `layouts/private.vue` shows selector for most authenticated roles.
- Clients do not see the global selector.
- Managers only see it if assigned to more than one branch.

Pages and APIs that support branch filtering generally pass `branchId` as a query param.

## API Surface

Server routes live under `server/api`.

Major authenticated domains:

- Auth: `/api/auth/login`, `/api/auth/logout`, `/api/auth/refresh`
- Current user: `/api/me`, `/api/me/password`
- Setup: `/api/setup/status`, `/api/setup/init`
- Dashboard summary: `/api/dashboard/summary`
- Branches and branch working hours
- Employees, passwords, commissions, employee working hours
- Services
- Clients and client history
- Appointments: create, update, status, confirm, notes, move, associated sale
- Calendar events
- Cash sessions, cash movements, cashboxes
- Products, stock, stock movements
- Sales
- Loyalty and redemptions
- Settings: landing, email, email template/test, WhatsApp template, notifications, payment methods
- Time blocks
- Worker/barber appointment, finances, recent-client views

Public routes under `/api/public/**`:

- Branches, services, products
- Barbers/workers
- Availability
- Public client lookup/create
- Public user lookup/register
- Public appointment create/read/confirm/calendar ICS
- Public landing HTML

## API Conventions

- Use `defineEventHandler` from H3.
- Use `readBodyValidated(event, schema)` for body validation.
- Use `requireParam(event, name)` for required route params.
- Use `requireQueryString(event, name)` for required query strings.
- Use shared error helpers from `server/utils/errors.ts` rather than ad hoc `createError`.
- Enforce RBAC in each protected handler with `requireRole` or `getAuthUser`.
- Public API endpoints are public because of middleware prefix rules; validate carefully inside handlers.
- Prefer Prisma structured queries/transactions over ad hoc logic.

## UI Conventions

- Nuxt UI components are used throughout.
- Visible text should use i18n keys from `i18n/locales/es-AR.json` and `i18n/locales/en.json`.
- `layouts/private.vue` owns private navigation and language selector.
- Backoffice CRUD should follow the `UTable` pattern described in `docs/admin-crud-utables.md`:
  - title/search/create top bar
  - table with sort/search/pagination
  - modal or slide-over create/edit
  - delete confirmation
  - consistent empty/loading/error states
- `CrudTableShell.vue`, `CrudState.vue`, `useCrudTable.ts`, and `useBackofficeTableUi.ts` are reusable building blocks.

## Calendar And Booking

- Backoffice calendar page: `pages/private/backoffice/calendar.vue`.
- Calendar events API: `server/api/calendar/events.get.ts`.
- Event API returns both appointments and `TimeBlock` rows.
- For `BARBER` users, calendar events are restricted to their own `professionalId`.
- Backoffice day/week views use worker schedules/columns based on `/api/public/workers?branchId=...`.
- Appointments and blocks overlap a requested interval with:
  - `startTime < end`
  - `endTime > start`
- Public availability must also respect time blocks.

## Cash And Payment Rules

From `docs/refactor-cashboxes-paid.md` and current schema:

- Cashboxes belong to branches.
- `OWNER`/`ADMIN` can create/update/delete cashboxes.
- `MANAGER` can select a cashbox/payment medium when collecting payment but cannot manage cashboxes.
- Marking an appointment `PAID` records:
  - `paidAt`
  - `paidById`
  - `paidCashBoxId`
  - `paidPaymentMethod`
  - optional `paidPaymentMediumId`
  - `paidAmount`
- Payment creates a `CashMovement(DEPOSIT)` linked to the appointment.
- Payments and direct sales require an explicitly open session for the selected cashbox.
- `server/utils/paymentMethods.ts` ensures default active system payment method configs for `CASH`, `CARD`, `TRANSFER`, `OTHER`.

## Seed Data

`prisma/seed.ts` creates or updates:

- Branch: `Emi Barber Club`
- Admin: `admin@emi.local` / `1234`
- Manager: `manager@emi.local` / `1234`
- Barber/worker: `barber@emi.local` / `1234`
- Client user: `client@emi.local` / `1234`
- Service: `Corte Clásico`
- Client profile: `cliente@example.com`

README also mentions older Docker default credentials (`admin@barberos.com` / `admin123`, `barber@barberos.com` / `barber123`), but the current seed file uses the `*.emi.local` users above.

## Current Release State

The planned product and stabilization blocks are complete. `TRACKER.md` has no active pending work. The internal `BARBER` and `professionalId` names are an explicit compatibility decision, not an unfinished feature.

## Implementation Notes For Future Agents

- Keep changes small and aligned with existing patterns.
- Do not rename core `BARBER`/`professionalId` internals casually; that is a planned migration.
- If adding private pages, update role metadata and private navigation as needed.
- If adding API endpoints, remember server middleware protects all non-public `/api/**` routes automatically, but handler-level RBAC is still required.
- If adding visible UI text, update both locale JSON files.
- If changing appointment payment/cash behavior, run `npm run sanity` when a DB is available.
- If touching Prisma schema, consider existing migrations and Docker dev `prisma db push` behavior.
- Generated/build directories `.nuxt`, `.output`, and `node_modules` should not be treated as source.
