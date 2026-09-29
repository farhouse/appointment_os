# BarberOS

Nuxt 4 application for managing branches, workers, appointments, clients, inventory, sales, cash sessions, payments, loyalty, and public booking.

## Requirements

- Node.js 24
- PostgreSQL 14+

## Local setup

```bash
npm install
cp .env.example .env
npx prisma migrate deploy
npm run seed
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Seed users all use password `1234`:

- `admin@emi.local`
- `manager@emi.local`
- `barber@emi.local`
- `client@emi.local`

## Quality checks

```bash
npm run typecheck
npm run build
npm run sanity
```

`npm run sanity` requires a prepared database and validates opening independent cash sessions, assigning payment to the selected cashbox, and preventing duplicate appointment payments.

## Docker

Development with hot reload:

```bash
docker compose --profile dev up --build
```

Production-like environment:

```bash
docker compose --profile prod up --build
```

Production startup applies committed migrations before starting the Nuxt server. Development uses `prisma db push` to preserve the existing fast local workflow.

## Main product areas

- Public landing, booking, confirmation email, availability, and calendar export
- Backoffice calendar, branches, workers, services, clients, products, stock, direct sales, cash, and settings
- Worker agenda, appointment details, working hours, client context, and commission totals
- Client profile, appointment history, rebooking, loyalty/redemptions, and haircut photos
- Configurable payment media, email templates, landing content, and News/Offers

The UI calls workers "Worker" while the persisted Prisma role remains `BARBER` for compatibility. See [AGENTS.md](./AGENTS.md) and [agent-context.md](./agent-context.md) before changing domain identifiers.

## Email confirmation

Configure `MAIL_PROVIDER=resend`, `MAIL_FROM`, optional `MAIL_REPLY_TO`, and `RESEND_API_KEY`. Use `MAIL_DRY_RUN=true` for local validation without sending.

## Project status

[TRACKER.md](./TRACKER.md) contains the release gates and completed work. There are no known active release-blocking tasks in the current scope.
