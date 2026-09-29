# BarberOS — Agent Guide

Nuxt 4 / Vue 3 / Prisma 6 + PostgreSQL barber shop management app. JWT auth (httpOnly cookie), Zod validation, vue-cal, date-fns, @nuxt/ui, i18n (default `es-AR`).

## Commands

| Command | Purpose |
|---|---|
| `npm run dev` | Dev server (port 3000) |
| `npm run build` | Production build |
| `npm run seed` | `ts-node prisma/seed.ts` |
| `npm run sanity` | Cash/payment smoke tests (requires DB) |
| `npx prisma db push` | Apply schema to dev DB |
| `npx prisma db seed` | Seed demo data |
| `npx prisma migrate deploy` | Prod migration |
| `docker-compose --profile dev up --build` | Docker dev |
| `docker-compose --profile prod up --build` | Docker prod |

No test script, no linter, no typecheck script.

`postinstall` auto-runs `nuxt prepare` — no need to call it manually.

## Auth

- Server middleware (`server/middleware/auth.ts`) protects all `/api/**` except exact paths `/api/auth/login|refresh|logout` and prefix `/api/public/`.
- Access token in `auth_token` httpOnly cookie (1h TTL), refresh token 7d.
- Middleware re-checks `user.active` from DB on every request — no stale tokens.
- Handlers use `getAuthUser(event)`, `requireRole(event, roles[])`, `requireParam`, `requireQueryString`, `readBodyValidated` — all from `server/utils/`.
- Error helpers in `server/utils/errors.ts` (prefer over ad hoc `createError`).

## Architecture

- **API**: Nuxt 4 file-based — `server/api/foo/bar.get.ts` → `GET /api/foo/bar`, same for `.post.ts`, `.patch.ts`, `.delete.ts`.
- **Public UI**: `pages/` (index.vue = landing, login.vue, setup.vue, book/).
- **Private UI**: `pages/private/` with three role families:
  - `routes` (OWNER/ADMIN/MANAGER): `/private/backoffice/*`
  - Worker (BARBER): `/private/worker/*`
  - Client (CLIENT): `/private/client/*`
- `pages/private/barber/*` and `pages/private/manager/*` are legacy aliases — route through worker/backoffice for new work.
- **Branch selection**: `useSelectedBranch()` composable (cookie-backed). Used by most backoffice APIs via `branchId` query param.
- **Private page template**:
  ```ts
  definePageMeta({ layout: 'private', middleware: ['private', 'role'], roles: ['ADMIN'] })
  ```

## Domain

- Core model is **BARBER** (Prisma enum and DB). A UI/alias rename → Worker is partially done: copy, i18n, route aliases exist, but `professionalId`, `BARBER` role value, and DB column names are unchanged. **Do not rename core model fields/values** without a planned migration.
- `AppointmentStatus`: PENDING → CONFIRMED → IN_PROGRESS → FINISHED → PAID. Also CANCELED, NO_SHOW.
- `Role`: OWNER, ADMIN, MANAGER, BARBER, CLIENT.
- `User` ≠ `Client`. They are separate models; `User.clientId` is optional and not fully wired.

## Cash & Payments

- Cash drawers are `CashBox` per branch. Payment processing requires an open `CashSession` for the selected cashbox.
- `npm run sanity` checks: open session → mark appointment PAID → reject duplicate payment. Run after any cash/payment change.

## CRUD UI Pattern

Backoffice CRUD follows a shared pattern documented in `docs/admin-crud-utables.md`:
- `CrudTableShell.vue` + `CrudState.vue` + `useCrudTable.ts` + `useBackofficeTableUi.ts` are reusable.
- Title/search/create bar → sortable table → modal/slide-over form → delete confirmation.

## i18n

- `i18n/locales/es-AR.json` (default) and `en.json`. Add new keys to both.
- `@nuxtjs/i18n` with `strategy: 'no_prefix'`, locale detection via cookie.

## Docker

- Dev (`--profile dev`): mounts source, `npm ci`, `prisma db push` (no `--accept-data-loss`), `nuxt prepare`, `npm run dev`.
- Prod (`--profile prod`): Dockerfile multi-stage build, `prisma migrate deploy`, `node .output/server/index.mjs`.
- Prisma engine forced to `binary` in Docker (`PRISMA_CLIENT_ENGINE_TYPE: binary`).
- Schema in `prisma/schema.prisma` targets both `native` and `linux-musl` for macOS + Docker compat.

## Setup

- Copy `.env.example` → `.env`, set `DATABASE_URL` and `JWT_SECRET`.
- Local: `npx prisma db push && npx prisma db seed && npm run dev`.
- Seed users: `admin@emi.local` / `manager@emi.local` / `barber@emi.local` / `client@emi.local` — all password `1234`.
- Requires Node.js 24 + PostgreSQL 14+.

## Generated / Non-source dirs

`.nuxt/`, `.output/`, `node_modules/` — treat as build artifacts, not source.

## Key sources

- `prisma/schema.prisma` — data model truth.
- `server/middleware/auth.ts` — API auth guard.
- `server/utils/` — helpers, error classes, auth, validation, permissions.
- `layouts/private.vue` — sidebar nav, branch selector, language switcher.
- `composables/useMe.ts` — frontend auth state; `composables/useSelectedBranch.ts` — branch state.
- `docs/admin-crud-utables.md` — CRUD conventions.
- `docs/refactor-cashboxes-paid.md` — cash/payment design.
