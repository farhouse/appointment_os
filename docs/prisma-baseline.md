# Prisma baseline (existing non-empty DB)

Use this when `prisma migrate deploy` fails with:

- `P3005: The database schema is not empty`

## Why it happens

The DB already has tables/data, but `_prisma_migrations` does not have your migration history yet.

## One-time baseline steps (safe for existing DB)

From repo root:

```bash
npx prisma migrate resolve --applied 000_init
npx prisma migrate resolve --applied 20260215235833_loyalty_redemption_points
npx prisma migrate resolve --applied 20260226120000_cash_session_payment_sectors
npx prisma migrate resolve --applied 20260226123000_payment_method_config
```

Then verify:

```bash
npx prisma migrate status
npx prisma migrate deploy
```

Expected:
- status says DB is up to date
- deploy says no pending migrations

## Dev sync note

If local dev drift exists before baselining, run:

```bash
npx prisma db push
npx prisma generate
```

Then run the baseline commands above.
