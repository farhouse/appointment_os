# Coding Agent Tasks (Barber OS)

Date: 2026-02-12
Owner: Iván

This doc is a task spec for the coding agent. Keep changes small, incremental, and with clear acceptance criteria.

---

## 0) Context / Current Behavior
- App boots and shows a landing page: **“Welcome to Barber OS”**.
- Auth exists (login page + private area with role-based sections).
- Multi-branch concept exists in Prisma (`Branch`) but UI/filters are not consistently branch-aware.
- Internationalization (i18n) is **not implemented** yet.

---

## 1) Implement i18n across UI (Nuxt)

### Goal
Add i18n support and replace hardcoded UI text with translation keys.

### Approach
- Use the official Nuxt i18n module (`@nuxtjs/i18n`).
- Provide at least 2 locales:
  - `es-AR` (default)
  - `en`

### Tasks
1. Install and configure `@nuxtjs/i18n`.
2. Create translation files (recommended):
   - `locales/es-AR.json`
   - `locales/en.json`
3. Add a minimal language switcher (can be in a header/navbar area).
4. Replace **all** visible hardcoded strings in these areas with `$t('...')`:
   - `app.vue`
   - Landing page (index)
   - `pages/login.vue`
   - `layouts/auth.vue`, `layouts/private.vue`
   - Navigation items under `/private/**` pages (barber/client/manager)
   - Empty states / CTA buttons (book, appointments, etc.)

### Acceptance criteria
- No visible hardcoded English/Spanish strings remain in the main UI flow (landing → login → private pages).
- Switching locale updates UI immediately.
- Default locale is `es-AR`.

---

## 2) Landing page improvements: add Login entry point

### Goal
On the first page (public landing/index), show an obvious **Login** action.

### Tasks
- Add a primary CTA button “Iniciar sesión / Login” that routes to `/login`.
- If user is already authenticated, show a CTA “Ir al panel / Go to dashboard” routing to `/private`.

### Acceptance criteria
- From landing, user can always navigate to login.
- If already logged in, landing offers a direct path to the private area.

---

## 3) Branch (Sucursal) selection / filtering strategy

### Problem
If barbers/managers exist across multiple branches, appointment lists/calendars can mix branches. We need a branch selection or filter so views are branch-aware.

### Proposed UX (pick one, or implement both if easy)

#### Option A — Global branch selector (recommended)
- Add a **Branch selector** (Sucursal) in the private layout header (visible on all `/private/**` pages).
- Selected branch is stored client-side (cookie or localStorage) and is used as a default filter.

#### Option B — Per-page filter
- On appointment/calendar pages, add a branch filter dropdown. Default = “All branches”.

### Data behavior
- Default filter behavior:
  - Managers: can choose “All” or a specific branch.
  - Barbers: default to their primary branch (if defined) but can switch (depending on permissions).
  - Clients: default to booking within a chosen branch.

### Implementation tasks
1. Define a single source of truth for selected branch:
   - Composable: `useSelectedBranch()`.
   - Persist selection in cookie (preferred for SSR) or localStorage.
2. Add a small API endpoint to list branches (if not already present), e.g. `GET /api/branches`.
3. Update API reads for appointments/calendar to accept optional `branchId`:
   - Query param: `?branchId=...` (or `branchId=all`).
   - Ensure server-side filtering is applied (don’t just filter client-side).
4. Update relevant pages to pass the filter:
   - Barber: `pages/private/barber/appointments.vue`, `today.vue`
   - Manager: `pages/private/manager/calendar.vue`
   - Client booking: `pages/private/client/book.vue` (force selecting branch before booking)

### Acceptance criteria
- Appointments/calendar views can be filtered by branch.
- The selected branch persists across navigation.
- “All branches” is possible for manager (at minimum).

---

## 4) Known issues (reported)

### 4.1 Manager Calendar renders blank + 500 on repeated clicks
- Page: `pages/private/manager/calendar.vue`
- Symptom: calendar area appears **white/blank**, events not visible.
- After multiple clicks, API returns:
  - `500 Internal Server Error`
  - Error message: `Class constructor DayTimeColsView cannot be invoked without 'new'`

**Hypothesis:** FullCalendar + Vue build/bundler mismatch (CJS/ESM interop) or duplicated FullCalendar versions.

**Tasks to investigate/fix:**
1. Verify `@fullcalendar/*` versions are aligned (same minor/patch).
2. Check import style in `calendar.vue` (Vue3 wrapper + plugins).
3. Ensure the calendar is instantiated per docs (no calling view constructors as functions).
4. If the error is server-side (Nitro SSR), ensure FullCalendar is client-only (wrap in `<ClientOnly>` or disable SSR for that component).

**Acceptance criteria:**
- Manager calendar page renders correctly (not blank) and does not throw 500.
- Repeated interactions (clicks/drag) do not crash server.

---

## 5) Notes / Non-goals
- Do not redesign UI; keep changes minimal.
- Avoid large refactors; prefer additive changes and small PR-sized diffs.

---

## 6) Suggested incremental plan
1. Add i18n scaffolding + translate landing/login/layout nav labels.
2. Add landing page login CTA.
3. Add branch selector composable + branch list API.
4. Wire branch filter into manager calendar and barber appointment endpoints.

