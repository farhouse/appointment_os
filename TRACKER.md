# Barber OS — Tracker (shortlist)

> Estado rápido y accionable. Solo pendientes activos.
> Leyenda: `todo | doing | blocked | done`

## NEXT (prioridad alta)
- [x] (done) **Landing configurable desde Settings (MVP)**
  - Resultado: Settings ahora incluye sección Landing con editor HTML + preview y persistencia en DB (`LandingConfig`).
  - Home pública consume `/api/public/landing` y renderiza HTML configurado con fallback a landing anterior si está vacío.
  - Files: `pages/private/backoffice/settings/landing.vue`, `server/api/settings/landing.*`, `server/api/public/landing.get.ts`, `pages/index.vue`, `prisma/schema.prisma`.

- [ ] (doing) **Generalización de dominio: Barber → Worker**
  - ✅ Fase 1 (copy/UI/i18n): aplicado en textos visibles (labels, headings, booking copy, empleados, landing).
  - ✅ Fase 2 (alias API): nuevo endpoint `/api/public/workers` compatible con `/api/public/barbers`.
  - 🟡 Fase 3 (parcial): alias de rutas privadas `/private/worker/*` y alias de API `/api/worker/*` hacia flujos existentes de barber.
  - ⏭️ Fase 3 (pendiente): renombre interno progresivo de modelo/campos (`BARBER` role, `professionalId`, etc.) con migración controlada.

- [x] (done) **Client profile editable + cambio de password**
  - Resultado: `/private/profile` ahora permite editar nombre/email/teléfono y cambiar contraseña con validaciones básicas.
  - Files: `pages/private/profile.vue`, `server/api/me.patch.ts`, `server/api/me/password.post.ts`.

- [ ] (todo) **Cliente: fotos de cortes (máx 3)**
  - Upload + preview + delete + storage local docker + metadata en DB.

## MANAGER / CALENDAR / CASH (pendientes)
- [x] (done) **Calendar resources separators**
  - Resultado: zebra suave por columna/resource + divisores visuales en calendario de backoffice.
  - Files: `pages/private/backoffice/calendar.vue`.

- [ ] (todo) **Caja: revisar flujo abrir→cerrar→cobrar**
  - Definir regla cuando caja está cerrada y llega cobro.

- [ ] (todo) **Módulo de Venta (venta directa fuera del turno)**
  - Requiere sucursal + caja abierta + descuento de stock + movimiento de caja.

- [x] (done) **Bloqueo de franjas horarias por falta de staff**
  - Alcance cerrado: bloqueo directo desde calendario (sin flujo de aprobación).
  - Roles: WORKER + MANAGER + ADMIN.
  - Tipos: día completo o franja horaria (ej. comida/descanso), con motivo opcional.
  - Debe impactar en agenda interna y booking público (no ofrecer slots bloqueados).
  - Resultado: Modelo TimeBlock, CRUD API, integración en calendarios (backoffice + worker) y disponibilidad pública.
  - Files: `prisma/schema.prisma`, `server/api/time-blocks/*`, `server/api/calendar/events.get.ts`, `server/api/public/availability/index.get.ts`, `components/AppointmentCreateModal.vue`, `pages/private/backoffice/calendar.vue`, `pages/private/worker/today.vue`.

## BARBER APP (pendientes)
- [x] (done) **Barber finances** (totales + comisión fija por barbero)
  - Resultado: panel muestra turnos pagados, total de servicios y comisión estimada (según `User.commissionRate`) con desglose semanal.
  - Files: `server/api/barber/finances.get.ts`, `pages/private/barber/finances.vue`.
- [ ] (todo) **Barber appointments**: filtros UI + modal + rango diario
- [ ] (todo) **Barber working hours**: cerrar visualización en calendar + QA E2E

## LATER
- [ ] (todo) News/Offers CMS
- [ ] (todo) Rebook rápido
- [ ] (todo) Dev env cleanup (`docker-compose.yml` version obsolete)

---

## Últimos hitos cerrados (resumen)
- Venta asociada a turno (upsell) con items y cobro.
- Total general del appointment actualizado en vivo al editar items.
- Modal de appointment mejorado (ancho, scroll, cards, notas, selector productos).
- Click en calendario para crear turno con snap a bloques de 10 minutos.
- Booking availability/empty state y fixes de confirmación/email.
