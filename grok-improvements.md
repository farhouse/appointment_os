# Barber OS Consistency Audit Report

## Status Update (2026-02-28)

### ✅ Addressed
- Missing overlap validation in appointment creation/move.
  - Commits: `510bc67`
- Inconsistent role enforcement (normalized with `requireRole` in targeted endpoints).
  - Commits: `0884ec5`
- Multiple payment allowance for same appointment (duplicate payment hardening).
  - Commits: `e00ed8a`, `148b732`
- Race-safety hardening in appointment payment transitions.
  - Commits: `148b732`
- Hardcoded i18n strings in private layout.
  - Commits: `0a1e001`
- Client endpoint behavior when profile is missing (normalized).
  - Commits: (covered in Task #6 run)
- Dev data-loss risk in docker compose flow.
  - Commits: `5c74f31`
- Calendar conflict UX hint added.
  - Commits: `5113f9d`

### ⚠️ Still pending / needs explicit verification
- Placeholder secrets in docker-compose (if any remain hardcoded in current file).
- “Inconsistent branch selection handling in booking flows” (low severity UX consistency item from audit).


## 1. UX Consistency (Backoffice/Client Booking Flows)

### Finding: Hardcoded Localized Text in Layout
- **Severity**: Medium
- **Why it matters**: Violates i18n principles, causing inconsistent user experience across locales and maintenance issues.
- **Suggested fix**: Replace hardcoded "Cargando sucursales…" and "Aplicando…" with i18n keys in `layouts/private.vue` (lines 162-163).
- **Affected files**: `/Users/farhouse/Projects/barber-os/layouts/private.vue`

### Finding: Inconsistent Branch Selection Handling in Booking Flows
- **Severity**: Low
- **Why it matters**: Client booking flows differ slightly (public vs private), potentially confusing users on branch selection.
- **Suggested fix**: Standardize branch selection logic across `pages/book/index.vue` and `pages/private/client/book.vue`, ensuring consistent UX for initial branch population.
- **Affected files**: `/Users/farhouse/Projects/barber-os/pages/book/index.vue`, `/Users/farhouse/Projects/barber-os/pages/private/client/book.vue`

## 2. API/Data-Model Consistency (Endpoints vs Prisma Fields/Relations)

### Finding: Schema Validation Matches Prisma Models
- **Severity**: Low (Positive)
- **Why it matters**: Ensures data integrity and prevents invalid API requests.
- **Suggested fix**: No action needed; schemas in `server/utils/schemas.ts` align with Prisma schema fields and relations.
- **Affected files**: `/Users/farhouse/Projects/barber-os/server/utils/schemas.ts`, `/Users/farhouse/Projects/barber-os/prisma/schema.prisma`

### Finding: Missing Overlap Validation in Appointment Creation
- **Severity**: High
- **Why it matters**: Allows double-bookings, leading to scheduling conflicts and operational errors.
- **Suggested fix**: Add overlap check in `server/api/appointments/index.post.ts` using Prisma query to verify no conflicting appointments for the professional and time range.
- **Affected files**: `/Users/farhouse/Projects/barber-os/server/api/appointments/index.post.ts`

## 3. Role/Permission Consistency (OWNER/ADMIN/MANAGER/BARBER/CLIENT)

### Finding: Inconsistent Role Enforcement Across Endpoints
- **Severity**: Medium
- **Why it matters**: Inconsistent access control can lead to unauthorized actions or unexpected denials, eroding trust in permissions.
- **Suggested fix**: Standardize on `requireRole` utility in all endpoints; replace manual role checks (e.g., `if (u.role !== 'BARBER')`) with `requireRole(event, ['BARBER'])` for consistency.
- **Affected files**: `/Users/farhouse/Projects/barber-os/server/api/barber/appointments.get.ts`, `/Users/farhouse/Projects/barber-os/server/api/barber/finances.get.ts`, `/Users/farhouse/Projects/barber-os/server/api/appointments/[id]/status.patch.ts`

### Finding: Client Endpoints Lack Uniform Role Checks
- **Severity**: Medium
- **Why it matters**: Some client APIs use `requireRole(['CLIENT'])`, others rely on implicit checks, risking unauthorized access for non-client users.
- **Suggested fix**: Apply `requireRole(['CLIENT'])` consistently in client endpoints like `/server/api/client/appointments.get.ts` and `/server/api/client/redeem.post.ts`.
- **Affected files**: `/Users/farhouse/Projects/barber-os/server/api/client/appointments.get.ts`, `/Users/farhouse/Projects/barber-os/server/api/client/redeem.post.ts`

## 4. Cash + Calendar + Booking Integration Edge Cases

### Finding: Multiple Payment Allowance for Same Appointment
- **Severity**: High
- **Why it matters**: Permits duplicate payments, causing financial discrepancies and incorrect cash movement records.
- **Suggested fix**: Add check in `server/api/appointments/[id]/status.patch.ts` to prevent updating to 'PAID' if already paid; handle re-payment scenarios explicitly.
- **Affected files**: `/Users/farhouse/Projects/barber-os/server/api/appointments/[id]/status.patch.ts`

### Finding: Calendar Displays Overlapping Events Without Prevention
- **Severity**: Medium
- **Why it matters**: UI shows potential conflicts without backend enforcement, leading to user confusion and operational issues.
- **Suggested fix**: Enhance `server/api/calendar/events.get.ts` to flag or filter overlapping events, and integrate overlap prevention in appointment move endpoint.
- **Affected files**: `/Users/farhouse/Projects/barber-os/server/api/calendar/events.get.ts`, `/Users/farhouse/Projects/barber-os/server/api/appointments/[id]/move.patch.ts`

## 5. i18n/Copy Consistency (Hardcoded Strings vs Localized Keys)

### Finding: Hardcoded Spanish Strings in Layout
- **Severity**: Medium
- **Why it matters**: Bypasses i18n system, causing locale-specific issues and translation maintenance overhead.
- **Suggested fix**: Add keys to `i18n/locales/en.json` and `i18n/locales/es-AR.json` for "Loading branches…" and "Applying…", update `layouts/private.vue` to use `$t()`.
- **Affected files**: `/Users/farhouse/Projects/barber-os/layouts/private.vue`, `/Users/farhouse/Projects/barber-os/i18n/locales/en.json`, `/Users/farhouse/Projects/barber-os/i18n/locales/es-AR.json`

## 6. Reliability Risks (Null Handling, Race Conditions, Container/Dev Pitfalls)

### Finding: Insufficient Null Handling in Client Appointment Retrieval
- **Severity**: Medium
- **Why it matters**: Assumes client existence based on email, potentially returning empty arrays silently instead of proper error handling.
- **Suggested fix**: Improve error handling in `server/api/client/appointments.get.ts` to distinguish between no client found and no appointments.
- **Affected files**: `/Users/farhouse/Projects/barber-os/server/api/client/appointments.get.ts`

### Finding: Race Conditions in Appointment Status Updates
- **Severity**: High
- **Why it matters**: Concurrent updates to appointment status (e.g., payment) without locking can cause data corruption or duplicate operations.
- **Suggested fix**: Use database-level locking or unique constraints in transactions within `server/api/appointments/[id]/status.patch.ts`.
- **Affected files**: `/Users/farhouse/Projects/barber-os/server/api/appointments/[id]/status.patch.ts`

### Finding: Development Database Reset Risk in Docker Compose
- **Severity**: Critical
- **Why it matters**: `db push --accept-data-loss` in dev setup can inadvertently wipe production-like data during development.
- **Suggested fix**: Replace with safer migration strategy or add confirmation prompts; separate dev/prod database configurations.
- **Affected files**: `/Users/farhouse/Projects/barber-os/docker-compose.yml`

### Finding: Placeholder Secrets in Docker Compose
- **Severity**: High
- **Why it matters**: Exposes default JWT secrets, risking security breaches in deployed environments.
- **Suggested fix**: Use environment variables or secrets management; remove hardcoded values.
- **Affected files**: `/Users/farhouse/Projects/barber-os/docker-compose.yml`

## Top 5 Next Actions

1. **Implement Appointment Overlap Prevention**: Add backend validation in appointment creation and move endpoints to prevent scheduling conflicts.
2. **Standardize Role Checks**: Audit and replace all manual role checks with `requireRole` utility for consistent access control.
3. **Fix Multiple Payment Vulnerability**: Add safeguards in appointment payment logic to prevent duplicate cash movements.
4. **Localize Hardcoded Strings**: Integrate remaining hardcoded texts into i18n system for full localization support.
5. **Secure Development Environment**: Mitigate data loss risks in Docker dev setup and enforce proper secret handling.