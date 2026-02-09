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

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Create `.env`**
   Copy `.env.example` → `.env` and set at least:
   - `DATABASE_URL` (Postgres)
   - `JWT_SECRET`
   - `JWT_REFRESH_SECRET`

3. **Create schema + seed**
   ```bash
   npx prisma db push
   npx prisma db seed
   ```

4. **Run dev server**
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

## Tech Stack

- **Framework:** Nuxt 3 (Vue 3)
- **Database:** PostgreSQL
- **ORM:** Prisma
- **Validation:** Zod
- **UI:** Tailwind CSS (via Nuxt UI)
- **Calendar:** FullCalendar
