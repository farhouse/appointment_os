# BarberOS v1.1

Open-source barber shop management system (MVP).

## Features (v1.1)

- **Branches:** Manage multiple locations.
- **Employees:** Manage staff, roles (Admin, Manager, Barber), and branch assignments.
- **Services:** Configure services with duration and pricing.
- **Calendar:** Full-featured appointment scheduling (FullCalendar integration).
- **Appointments:** Booking flow with status tracking (Pending, Confirmed, etc.) and history.
- **Clients:** Client management and history.
- **API:** RESTful API with Zod validation.
- **Auth:** JWT-based authentication with RBAC.

## Getting Started (Local - Recommended for now)

1. **Prereqs**
   - Node.js 24
   - Postgres 14+ (local install, or run Postgres however you like)

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Create `.env`**
   Copy `.env.example` to `.env` and set at least:
   - `DATABASE_URL`
   - `JWT_SECRET`
   - `JWT_REFRESH_SECRET` (optional; defaults to `JWT_SECRET`)

4. **Create schema + seed**
   ```bash
   npx prisma db push
   npx prisma db seed
   ```

5. **Run dev server**
   ```bash
   npm run dev
   ```

Open http://localhost:3000

## Docker (optional)

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/yourusername/barber-os.git
    cd barber-os
    ```

2.  **Environment Setup:**
    Copy `.env.example` to `.env` (or create one) and configure:
    ```bash
    DATABASE_URL="postgresql://user:password@db:5432/barberos?schema=public"
    JWT_SECRET="your_super_secret_key"
    ```
    *Note: When running with Docker Compose, the `db` host is automatically resolvable.*

3.  **Run with Docker Compose:**
    ```bash
    docker-compose up --build
    ```
    This will start the Postgres database and the Nuxt application.

4.  **Seed Database (First Run):**
    Run the seed script to create initial data (Admin user, Branch, Service):
    ```bash
    docker-compose exec app npx prisma db push
    docker-compose exec app npx prisma db seed
    ```
    
    **Default Credentials:**
    - Admin: `admin@barberos.com` / `admin123`
    - Barber: `barber@barberos.com` / `barber123`

5.  **Access the App:**
    Open [http://localhost:3000](http://localhost:3000)

## Development Setup (Local)

1.  **Install Dependencies:**
    ```bash
    npm install
    ```

2.  **Database:**
    Ensure you have a PostgreSQL database running and update `DATABASE_URL` in `.env`.

3.  **Migrations & Seed:**
    ```bash
    npx prisma db push
    npx prisma db seed
    ```

4.  **Run Dev Server:**
    ```bash
    npm run dev
    ```

## API Documentation

The API is built with Nuxt Server Routes.
- **Auth:** `/api/auth/*`
- **Branches:** `/api/branches`
- **Employees:** `/api/employees`
- **Services:** `/api/services`
- **Clients:** `/api/clients`
- **Appointments:** `/api/appointments`
- **Calendar:** `/api/calendar/events`

## Smoke Test (curl)

Assumes the app is running on `http://localhost:3000`.

1) Login (captures `auth_token` cookie)

```bash
curl -i -c cookie.txt \
  -H 'content-type: application/json' \
  -d '{"email":"admin@barberos.com","password":"admin123"}' \
  http://localhost:3000/api/auth/login
```

2) Authenticated endpoint

```bash
curl -i -b cookie.txt http://localhost:3000/api/me
```

3) Public endpoints (no cookie)

```bash
curl -i 'http://localhost:3000/api/public/branches'
curl -i 'http://localhost:3000/api/public/services'
```

4) Calendar events (BARBER users only see their own when `professionalId` is omitted)

```bash
curl -i -b cookie.txt \
  'http://localhost:3000/api/calendar/events?start=2026-01-01T00:00:00.000Z&end=2026-01-08T00:00:00.000Z'
```

## Tech Stack

- **Framework:** Nuxt 3 (Vue 3)
- **Database:** PostgreSQL
- **ORM:** Prisma
- **Validation:** Zod
- **UI:** Tailwind CSS (via Nuxt UI)
- **Calendar:** FullCalendar
