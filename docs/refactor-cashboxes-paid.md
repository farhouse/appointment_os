# Refactor: CashBoxes + PAID attribution (Admin creates cashboxes; Manager selects on payment)

## Goal
Support multiple cash registers per branch (e.g., `Efectivo`, `MercadoPago`) and require selecting a cashbox when marking an appointment as `PAID`.

## Roles / Permissions
- **OWNER/ADMIN**:
  - CRUD `CashBox` for a `Branch`.
  - View everything.
- **MANAGER**:
  - Can mark appointments as `PAID` but must choose a `CashBox`.
  - Cannot create/modify cashboxes.
- **BARBER/CLIENT**:
  - No access to cashboxes management.

## Domain rules
- When an appointment is marked `PAID`, the default amount is **sum of AppointmentService.price**.
- Manager should be able to **override** the amount at payment time (discounts, tips, adjustments).

## Data model changes (Prisma)
### New model
- `CashBox`
  - `id: String @id @default(uuid())`
  - `branchId: String`
  - `name: String` (e.g. "Efectivo", "MercadoPago")
  - `active: Boolean @default(true)`
  - `createdAt`, `updatedAt`
  - relations: `branch`, `cashSessions[]`
  - indexes: `@@index([branchId])`
  - uniqueness: optionally `@@unique([branchId, name])`

### CashSession changes
- Add `cashBoxId: String`
- Replace unique constraint `(branchId, date)` with `(cashBoxId, date)`
- Ensure the existing endpoints still make sense.

### Appointment changes
- Keep: `paidAt`, `paidById`, `status=PAID`.
- Add:
  - `paidCashBoxId: String?`
  - `paidAmount: Decimal?` (store final amount paid)
  - relations to `CashBox`.

### CashMovement changes
- Cash movements should be associated with the session and optionally with an appointment:
  - Add `appointmentId: String?`
  - Or use existing `reference` field with appointmentId (but explicit FK is nicer).

## API changes
### CashBoxes
- `GET /api/cashboxes?branchId=...` (Manager+Admin) — list active cashboxes.
- `POST /api/cashboxes` (Admin only)
- `PATCH /api/cashboxes/:id` (Admin only)
- `DELETE /api/cashboxes/:id` (Admin only, or soft-disable)

### Mark appointment as PAID
Update `PATCH /api/appointments/:id/status`:
- If `status !== 'PAID'`: behave as today.
- If `status === 'PAID'`:
  - Require `cashBoxId`.
  - Allow optional `amount`.
  - If `amount` not provided: compute `sum(appointment.services.price)`.
  - Set on appointment: `status=PAID`, `paidAt=now`, `paidById=userId`, `paidCashBoxId=cashBoxId`, `paidAmount=amount`.
  - Ensure a `CashSession` exists for `(cashBoxId, date)` (date = local day boundary; OK to use UTC date for now).
  - Create a `CashMovement` of type `DEPOSIT` linked to the session and appointment.

## UI changes
### Manager calendar
- When paying an appointment:
  - show a modal with:
    - cashbox select (from /api/cashboxes)
    - amount (prefilled, editable)
    - confirm

### Admin settings area
- Add a simple page to manage cashboxes per branch.

## Notes
- This is a refactor; keep existing endpoints working where possible.
- Prefer `prisma db push` for dev environment (migrations later).

## Implementation status (2026-02-15)
### Shipped
- Prisma:
  - Added `CashBox` (unique per branch by name, `active` flag).
  - `CashSession` is now unique by `(cashBoxId, date)`.
  - `Appointment` stores `paidCashBoxId` + `paidAmount`.
  - `CashMovement` links to an `appointmentId`.
- API:
  - `GET /api/cashboxes?branchId=...` available to ADMIN/MANAGER.
  - `POST|PATCH|DELETE /api/cashboxes` restricted to OWNER/ADMIN.
  - `PATCH /api/appointments/:id/status`:
    - When `status=PAID`, requires `cashBoxId`.
    - If `amount` is omitted, computes sum of `appointment.services.price`.
    - Writes `paidCashBoxId` + `paidAmount` and creates a `CashMovement(DEPOSIT)` linked to the appointment.
    - Amount validation allows `0` (`min(0)`) for full discounts.
- UI:
  - Manager calendar: event click opens a detail modal; from there you can open the payment modal.
  - Payment modal requires choosing a cashbox and allows editing amount.
  - Admin/Owner settings: cashbox management strings moved to i18n.

### Known decisions
- Paying an appointment will **upsert** a `CashSession` for the current local day if none exists yet (openingBalance=0). If we later enforce “must open cash session explicitly”, we should change this to reject when missing.

## Acceptance
- Admin can create two cashboxes (Efectivo, MercadoPago) for a branch.
- Manager can mark a finished appointment as PAID selecting one of them.
- Barber finances count uses PAID appointments (already).
- Cash reports can distinguish by cashbox.
