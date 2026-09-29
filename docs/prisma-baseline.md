# Prisma baseline (existing non-empty DB)

Use this when `prisma migrate deploy` fails with:

- `P3005: The database schema is not empty`

## Why it happens

The DB already has tables/data, but `_prisma_migrations` does not have your migration history yet.

## One-time baseline steps (safe for existing DB)

From repo root:

```bash
# Core schema
npx prisma migrate resolve --applied 000_init
npx prisma migrate resolve --applied 20260215235833_loyalty_redemption_points

# Cash & payments
npx prisma migrate resolve --applied 20260226120000_cash_session_payment_sectors
npx prisma migrate resolve --applied 20260226123000_payment_method_config
npx prisma migrate resolve --applied 20260227120000_payment_media_profiles
npx prisma migrate resolve --applied 20260227124000_payment_medium_links

# Employees & config
npx prisma migrate resolve --applied 20260312140500_user_commission_rate
npx prisma migrate resolve --applied 20260312143500_landing_config_html
npx prisma migrate resolve --applied 20260312200000_time_blocks

# Client & photos
npx prisma migrate resolve --applied 20260519120000_user_client_relation
npx prisma migrate resolve --applied 20260519123000_client_photos
npx prisma migrate resolve --applied 20260519124500_news_offers
npx prisma migrate resolve --applied 20260929120000_complete_schema_alignment
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
