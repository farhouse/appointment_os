# BarberOS - Release tracker

Last updated: 2026-09-29

## Active pending work

None. The planned stabilization and product blocks are complete.

## Completed blocks

- [x] Visual identity foundation: approved production direction, `PRODUCT.md`, `DESIGN.md`, light theme tokens, responsive private shell, and real-data operational dashboard.
- [x] Cash sessions and payments are scoped by `cashBoxId`; duplicate payment protection is covered by `npm run sanity`.
- [x] `User(CLIENT)` has a formal optional one-to-one relation with `Client` through `User.clientId`.
- [x] Worker appointments, date ranges, details, working hours, finances, and branch filtering are implemented.
- [x] Direct sales decrement stock and create cash movements in the selected open cash session.
- [x] Public availability supports worker aliases and respects appointments, working hours, and time blocks.
- [x] Time blocks validate branch access, worker assignment, interval order, and overlaps.
- [x] Client profile, password, quick rebooking, loyalty/redemptions, and up to three haircut photos are implemented.
- [x] Configurable landing, email settings, payment media, cashboxes, and News/Offers are implemented.
- [x] Backoffice CRUD screens use the shared Nuxt UI table pattern and both locales are synchronized.
- [x] Public landing HTML is sanitized on write and read.
- [x] Fake Excel import and notification endpoints were removed; the real email test endpoint remains.
- [x] Nuxt, Nuxt UI, i18n, and Vue Router were updated; production build and typecheck pass.
- [x] The complete Prisma migration chain recreates the current schema without drift.
- [x] Seed and cash/payment sanity checks pass on a clean migrated PostgreSQL database.

## Architecture decisions (not pending)

- The persistent role remains `BARBER` and appointment ownership remains `professionalId`.
- User-facing routes and copy use Worker. Renaming persisted enum values and columns has no product benefit for this release and would require a dedicated compatibility migration.
- `/private/worker` and `/private/backoffice` are the primary route families. Older barber/manager paths are compatibility aliases.

## Release gates

- `npm run typecheck`
- `npm run build`
- `npx prisma migrate deploy` on an empty database
- Prisma schema drift check
- `npm run seed`
- `npm run sanity`
