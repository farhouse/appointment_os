# /private Routing + Role Guard Architecture

This repo uses a simple convention for authenticated UI routes:

- All authenticated pages live under `/private/**`.
- The UI is organized by role, but we avoid role-specific layouts unless the chrome is truly different.

## Route structure

- `/login`
  - Public login page.
  - Accepts `?redirect=/some/path` to return to the originally requested page.

- `/private`
  - Role router.
  - Redirects to the role-appropriate home:
    - OWNER/ADMIN/MANAGER -> `/private/manager`
    - BARBER -> `/private/barber`
    - CLIENT -> `/private/client`

- `/private/manager/**`
  - Allowed roles: OWNER, ADMIN, MANAGER

- `/private/barber/**`
  - Allowed roles: BARBER

- `/private/client/**`
  - Allowed roles: CLIENT

## Frontend guard layers (Nuxt)

There are two Nuxt route middlewares:

- `middleware/private.ts`
  - Ensures the user is authenticated.
  - Loads the current user by calling `GET /api/me`.
  - If unauthenticated, redirects to `/login?redirect=...`.

- `middleware/role.ts`
  - Enforces page role access using `definePageMeta({ roles: [...] })`.
  - If the current user's role is not allowed, it redirects to `/private` (which re-routes by role).

All pages under `/private/**` should include `middleware: ['private', 'role']` plus `roles: [...]`, except `/private` itself which only needs `middleware: ['private']`.

## Shared `me` state

The UI stores the authenticated user in a single Nuxt state key:

- `composables/useMe.ts`
  - `useMeState()` provides `useState('me')` with a typed shape.
  - `loadMe()` fetches `/api/me` once and caches the result in state.

This prevents subtle bugs where multiple components/middleware fetch `/api/me` and interpret responses inconsistently.

## Security note (real RBAC)

Frontend middleware and redirects are for UX only.
Real authorization happens on the server:

- `server/middleware/auth.ts` verifies the access token for non-public `/api/**` routes and attaches `event.context.user`.
- `server/utils/permissions.ts` provides `getAuthUser()` and `requireRole()` used in API handlers.

## Future-proofing for client login + loyalty

Client login should remain a normal `User` with `role=CLIENT`.
For loyalty/appointments, the recommended approach is to add an explicit 1:1 link from `User` (CLIENT) to `Client`.

Minimal shape recommendation (not implemented here):

- Add `User.clientId` (nullable, unique) referencing `Client.id`.
- Extend `GET /api/me` to include `clientId` when present.

This keeps auth (`User`) separate from customer profile (`Client`) while allowing fast lookups and clean RBAC.
