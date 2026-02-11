# Refactor Decisions (barber-os)

This document explains what changed, why it changed, and what criteria were used to keep the work focused on correctness and maintainability while avoiding behavior changes.

## Scope and Priorities

Priority order (per request): server/api + auth + permissions (RBAC) first.

Non-goals:

- No new product features.
- Avoid API contract changes unless clearly a bug fix.

## What Changed

### 1) Centralized auth/JWT/cookie handling

Files:

- `server/utils/auth.ts`
- `server/middleware/auth.ts`
- `server/api/auth/login.post.ts`
- `server/api/auth/refresh.post.ts`
- `server/api/auth/logout.post.ts`
- `server/api/me.get.ts`

Changes:

- Introduced a single source of truth for:
  - cookie name (`auth_token`)
  - cookie options (httpOnly/sameSite/secure/path/maxAge)
  - JWT secret resolution (including misconfiguration errors)
  - token sign/verify logic and payload shape validation
- Middleware now uses the shared verifier and stores a typed user object in `event.context.user`.

Why:

- Reduced duplicated JWT secret getters and cookie configuration.
- Improved type safety: the middleware now guarantees the user shape via zod validation of JWT payload.

Evidence / criteria:

- Duplicated JWT secret/cookie logic existed across multiple handlers.
- Typechecking via `npx tsc -p .nuxt/tsconfig.server.json --noEmit` used as a correctness gate.

Notes on behavior:

- `POST /api/auth/refresh` previously issued an access token without role/email (payload only carried `userId`). That meant RBAC could be inconsistent depending on how `event.context.user` was used.
- Refactor treats this as a bug: refresh now fetches the user (role/email/active) from DB before issuing an access token.

### 2) Standardized request body parsing + zod validation

Files:

- `server/utils/http.ts`
- Many handlers in `server/api/**` now call `readBodyValidated(event, schema)`

Changes:

- Added `readBodyValidated()` helper which:
  - reads the request body
  - performs `schema.safeParse`
  - throws a standardized 400 `Validation Error` with `data = zod issues`
- Converted endpoints that hand-rolled the same safeParse + createError patterns.

Why:

- Reduced boilerplate and risk of inconsistent validation responses.
- Encouraged consistent zod usage patterns across handlers.

Evidence / criteria:

- Multiple endpoints repeated the same `readBody -> safeParse -> createError({ Validation Error })` structure.
- After each refactor batch, server TS compilation was re-checked.

### 3) Normalized required route/query parameter handling

Files:

- `server/utils/http.ts`
- Various `server/api/**` endpoints

Changes:

- Added helpers:
  - `requireParam(event, name)` for router params
  - `requireQueryString(event, name)` for required query params
- Updated endpoints to use the helpers, ensuring consistent 400 errors for missing required params.

Why:

- Prevented subtle differences in error handling and reduced duplication.

### 4) Normalized error helpers and status codes

Files:

- `server/utils/errors.ts`

Changes:

- Added helper functions for common error cases:
  - `badRequest(400)`, `validationError(400)`, `unauthorized(401)`, `forbidden(403)`, `notFound(404)`, `conflict(409)`, `serverMisconfigured(500)`
- Updated endpoints to use these helpers rather than ad-hoc `createError` blocks.

Why:

- Made status codes and messaging consistent.
- Reduced copy/paste and made handler intent clearer.

### 5) RBAC consistency + typing

Files:

- `server/utils/permissions.ts`
- `server/types/h3.d.ts`

Changes:

- `getAuthUser` and `requireRole` now accept `H3Event` and rely on typed `event.context.user`.
- Added module augmentation so `event.context.user` is typed.

Why:

- Reduced use of `any` and tightened assumptions about the authenticated user.
- Helps prevent accidental RBAC bypass due to missing/incorrect token payload.

## API Contract Notes

- No endpoints were added or removed.
- Validation error responses were standardized (still 400; message remains `Validation Error`; `data` remains zod issues).
- Refresh behavior change is treated as a bug fix: access tokens now contain role/email after refresh (previously only `userId`).

## Build/Test Evidence

- There is no `npm test` script in `package.json`; the required post-commit check was attempted after each commit and failed consistently with “Missing script: test”.
- Server typechecks were run repeatedly via `npx tsc -p .nuxt/tsconfig.server.json --noEmit` during the refactor to keep changes safe and reviewable.

## Commit Strategy

Changes were split into multiple small commits grouped by refactor theme:

- auth centralization
- body validation helper adoption
- param/query helper adoption
- handler cleanup / error normalization
