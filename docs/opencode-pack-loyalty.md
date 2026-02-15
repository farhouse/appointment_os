# OpenCode pack — Loyalty points + product redemption (gpt-5.2-codex)

## Goal
Implement loyalty points support so clients can redeem products using points.

This pack should be implementable end-to-end: schema + API + admin UI for points cost + client UI to redeem.

## Part 1 — Prisma schema + migrations
### 1.1 Product points cost
Add a points redemption cost to products:
- Prisma: `Product.pointsCost Int @default(0)`
  - Semantics: `0` = not redeemable OR free redeem (pick one and document it in code; recommended: **0 = not redeemable**)
- Create migration.

### 1.2 (Optional but recommended) Sales / redemption record
We already have `Sale` + `SaleItem` and `LoyaltyLedger`.
For redemption, we need a record of what was redeemed.
Two safe options:
A) Model redemption as a `Sale` with `SaleItem` and zero `price`, and add a flag `Sale.kind` enum (SALE vs REDEMPTION).
B) Create a dedicated `Redemption` model.

Pick the simplest path that fits existing schema with minimal disruption.

## Part 2 — Admin UI: products CRUD should include pointsCost
File: `pages/private/manager/products.vue`
- Add `pointsCost` column.
- Add form field for points cost (integer >= 0).
- Update zod schema and payload.

Also ensure API supports it:
- `GET /api/products`
- `POST /api/products`
- `PATCH /api/products/:id`

## Part 3 — Client points API
Implement endpoints (auth required, client-only):
- `GET /api/client/points` → returns current points balance and recent ledger entries.
  - Balance = sum of `LoyaltyLedger.points` for the client.

## Part 4 — Product redemption API
Implement endpoint (auth required, client-only):
- `POST /api/client/redeem`

Request:
- `productId: string`
- `quantity: number` (default 1)

Behavior:
- Validate product exists and is redeemable (`pointsCost > 0`).
- Compute total cost = `pointsCost * quantity`.
- Compute client balance.
- If insufficient balance → 400.
- Create ledger entry with negative points:
  - `LoyaltyLedger { clientId, points: -totalCost, reason: 'REDEEM: <product name> x<qty>' }`
- Record redemption (see Part 1.2 choice).
- Return new balance.

Security:
- Must only affect the logged-in client.

## Part 5 — Client UI: Redeem products
Add a page in client private area:
- Route: `pages/private/client/redeem.vue` (and add navigation link for CLIENT)

UI:
- Show current balance.
- Show redeemable products list (products with `pointsCost > 0`).
- Each product shows name, sku, pointsCost, optional description.
- Action: Redeem (choose quantity).
- On success: toast + refresh balance.

Data:
- Use `/api/products` for list and filter client-side, OR create `GET /api/public/products?redeemable=true`.

## Part 6 — Awarding points (minimal)
Right now booking has `earnPoints` concept, but no points awarding logic.
Implement minimal award rule so points accumulate:
- When an appointment is marked `PAID`, create a positive `LoyaltyLedger` entry for the client.
- Simple rule: `points = floor(paidAmount / 1000)` or fixed (e.g. 10 points per service). Pick one and document.
- Ensure idempotency: do not award twice for same appointment.
  - Option: store `appointmentId` in reason and check existing ledger reason contains it.
  - Better: add `appointmentId` optional field to `LoyaltyLedger` (migration) and unique constraint.

If this is too big, implement the redemption first and leave awarding points as a TODO with a clear follow-up.

## i18n
Add needed keys to both locales (`en.json` and `es-AR.json`). Keep JSON valid.

## Commits
Commit in logical steps:
1) prisma migrations
2) api endpoints
3) admin products UI
4) client redeem UI

## Finish
Print final summary:
- commits
- how to test (admin create product with pointsCost; client redeem)
