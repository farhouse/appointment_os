# Barber OS — Grok Audit Prioritized (Actionable for OpenCode)

Objetivo: quedarnos con un backlog **realista y ejecutable** (sin ruido), para correr en OpenCode con `github-copilot/grok-code-fast-1` por tareas chicas.

---

## Top 10 mejoras priorizadas

### 1) Prevent double payment on appointments
- **Severity:** High
- **Problema:** un appointment puede volver a `PAID` y duplicar movimientos.
- **Expected fix:** bloquear re-pago si ya está pagado, o manejar explícitamente idempotencia.
- **Files:** `server/api/appointments/[id]/status.patch.ts`
- **Acceptance:** no se crean movimientos duplicados para el mismo turno ya pagado.

### 2) Enforce overlap checks in create/move appointment
- **Severity:** High
- **Problema:** riesgo de doble reserva por profesional en franja horaria.
- **Expected fix:** validar solape en create + move.
- **Files:** `server/api/appointments/index.post.ts`, `server/api/appointments/[id]/move.patch.ts`
- **Acceptance:** intento de solape devuelve error claro y no persiste.

### 3) Make payment status transitions race-safe
- **Severity:** High
- **Problema:** updates concurrentes pueden romper consistencia.
- **Expected fix:** transacción robusta + guardas (estado previo) para evitar doble ejecución.
- **Files:** `server/api/appointments/[id]/status.patch.ts`
- **Acceptance:** dos requests simultáneos no generan estado/movimientos inconsistentes.

### 4) Replace hardcoded strings in private layout (i18n) ✅ DONE
- **Severity:** Medium
- **Problema:** textos como “Cargando sucursales…” / “Aplicando…” hardcodeados.
- **Expected fix:** mover a i18n keys en ES/EN.
- **Files:** `layouts/private.vue`, `i18n/locales/es-AR.json`, `i18n/locales/en.json`
- **Acceptance:** ningún texto UI hardcodeado en ese bloque.
- **Done commit:** `0a1e001`

### 5) Normalize role checks with requireRole ✅ DONE
- **Severity:** Medium
- **Problema:** mezcla de checks manuales y `requireRole`.
- **Expected fix:** unificar en `requireRole` en endpoints relevantes.
- **Files (normalized):** `server/api/barber/appointments.get.ts`, `server/api/barber/finances.get.ts`, `server/api/barber/clients/[id]/recent.get.ts`, `server/api/dashboard/summary.get.ts`, `server/api/appointments/[id]/status.patch.ts`, `server/api/client/appointments.get.ts`
- **Acceptance:** patrón homogéneo de autorización en APIs.
- **Done commit:** `0884ec5`

### 6) Clarify client endpoints behavior when client profile missing ✅ DONE
- **Severity:** Medium
- **Problema:** algunos endpoints devuelven vacío silencioso cuando falta `Client`.
- **Expected fix:** respuesta consistente (404/estado explícito) según regla de negocio.
- **Files:** `server/api/client/appointments.get.ts`, `server/api/client/redeem.post.ts` (y similares)
- **Acceptance:** comportamiento uniforme y predecible.

### 7) Reduce dev data-loss risk in docker profile ✅ DONE
- **Severity:** Medium (Dev-only)
- **Problema:** `db push --accept-data-loss` es riesgoso para entornos compartidos.
- **Expected fix:** flujo más seguro (migrate deploy en normal path, flag explícito para reset).
- **Files:** `docker-compose.yml`, docs dev setup
- **Acceptance:** levantar dev no implica potencial pérdida accidental por default.
- **Done commit:** TBD

### 8) Add visual conflict hint in calendar (optional UX hardening) ✅ DONE
- **Severity:** Medium
- **Problema:** usuario no ve conflicto hasta guardar.
- **Expected fix:** feedback visual si slot potencialmente conflictivo (sin reemplazar validación backend).
- **Files:** `pages/private/backoffice/calendar.vue`
- **Acceptance:** UX más clara en drag/move antes de persistir.

### 9) Keep settings email/whatsapp copy fully consistent ✅ DONE
- **Severity:** Low
- **Problema:** ajustes recientes pueden tener copy no uniforme.
- **Expected fix:** homogeneizar labels, ayuda y placeholders.
- **Files:** `pages/private/backoffice/settings/email.vue`, i18n locales
- **Acceptance:** nomenclatura consistente en español/inglés.
- **Done commit:** `91637b3`

### 10) Add small automated sanity checks for critical cash/payment paths ✅ DONE
- **Severity:** Medium
- **Problema:** mucha lógica crítica sin red mínima.
- **Expected fix:** tests básicos o script smoke para:
  - open cash session
  - mark appointment PAID
  - avoid duplicate payment
- **Files:** `scripts/sanity.ts`, `package.json`, `README.md`
- **Acceptance:** suite mínima detecta regresiones de caja/pagos.
- **Done commit:** (pending)

---

## Qué NO priorizar ahora
- Reescrituras grandes de arquitectura.
- Refactors estéticos sin impacto operativo.
- Cambios de modelo de datos no necesarios para los 10 puntos de arriba.

---

## Plan de ejecución recomendado (OpenCode)
1. Tareas 1 + 3 (pagos/idempotencia/race-safety)
2. Tarea 2 (overlap create/move)
3. Tarea 4 + 5 (i18n + permisos consistentes)
4. Tarea 6 (client endpoint behavior)
5. Tarea 7 (docker dev safety)
6. Tareas 8–10 según tiempo

Formato sugerido: **1 task por corrida** para minimizar regresiones.
