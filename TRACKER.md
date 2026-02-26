# Barber OS — Tracker (mejoras / correcciones)

> Archivo vivo. Mantenerlo corto y accionable.
> Convención: cada ítem tiene **prioridad**, **área**, **estado**, y un **NEXT** claro.

Leyenda estado: `todo | doing | blocked | done`

## P0 — Bugs / bloqueantes
- [x] (done) **Loyalty points mismatch**: cálculo migrado a `Service.pointsReward` por turno.
  - Resultado: se reemplazó regla basada en monto (`floor(paidAmount/1000)`) por suma de `pointsReward` de servicios.
  - Ref commit: `7d813e0`.
  - Nota: si hay datos históricos inconsistentes, evaluar script de ajuste del ledger como tarea separada.

- [x] (done) **Backoffice / Employees**: editar empleado ahora guarda correctamente.
  - Resultado: al editar y apretar Guardar, dispara PATCH, persiste y muestra toast.
  - Files: `pages/private/backoffice/employees.vue`, `server/api/employees/[id].patch.ts`.
  - Ref commits: `1310f0b`, `563f92c`, `7aa54fc`, `eb72ca0`, `e9d06ca`.

- [x] (done) **Branch selector regression**: selector del layout vuelve a permitir cambiar sucursal sin pisarse.
  - Resultado: selección estable por cookie/state, init seguro entre múltiples instancias y feedback visual al aplicar.
  - Files: `layouts/private.vue`, `composables/useSelectedBranch.ts`.
  - Ref commits: `3680ce4`, `1d3bdc9`, `4d5e7cf`, `7b17c9c`, `563f92c`.

- [ ] (todo) **Booking / Availability**: completar la data `busy` (hoy es MVP stub por día) para que “solo disponibles” sea consistente.
  - NEXT: definir endpoint/consulta que devuelva turnos ocupados por rango (por sucursal + opcional barbero) y usarlo en wizard.

- [ ] (todo) **Permisos / UX**: revisar globalmente el selector de sucursal en layout + páginas (asegurar que nunca se “pise” la selección y que haya estado visual de “aplicando”).
  - NEXT: validar en manager/backoffice/barber/client y en /book.

## P1 — UX / flujo
- [ ] (todo) **Booking / Branch select**: en el dropdown de sucursal mostrar también la **dirección** (y/o barrio) para desambiguar.
  - Acceptance: cada opción muestra `Nombre — Dirección` (si existe) sin romper el layout mobile.
  - Files: `components/BookingWizard.vue` (branch select), `composables/useSelectedBranch.ts` (si aplica en layouts)
  - NEXT: decidir formato exacto (ej. 2 líneas vs inline) y aplicar.

- [ ] (todo) **Booking / Identity**: si el usuario completa datos y **no existe** en `users`, proponer **crear cuenta de cliente** para acumular puntos.
  - Decision: si acepta crear cuenta → pedir **password** (y confirmación).
  - Acceptance: CTA claro (opt-in) + creación de cuenta con password + no bloquea el booking si el usuario no quiere.
  - Files: `components/BookingWizard.vue`, `server/api/public/users/*` o nuevo endpoint, loyalty/points.
  - NEXT: definir endpoint (crear user+client) y validaciones de password.

- [ ] (todo) **Booking / Email required**: el email **no es opcional** (se usará para confirmación por mail).
  - Acceptance: validación en UI + server (no permitir submit sin email) + copy de error.
  - Files: `components/BookingWizard.vue`, `server/api/public/clients/index.post.ts` (y/o appointments public)
  - NEXT: hacer email required y ajustar endpoints.

- [ ] (todo) **Booking / Confirmation system**: implementar confirmación por email (link/token) antes de confirmar el turno.
  - Status: POSTPONED (Iván: “dejemos para más adelante”).
  - Acceptance: al crear appointment queda PENDING_UNCONFIRMED (o similar) hasta click; link expira; reenvío.
  - Files: `server/api/public/appointments/index.post.ts`, `server/api/public/appointments/[id]/confirm.*`, mailer.
  - NEXT: elegir provider real de email + UX de reenvío.

- [ ] (todo) **Booking / Done screen**: después de bookear, navegar a una página de “finalizado” (journey cerrado).
  - Decision: incluir botón **“Agregar al calendario”** vía **ICS** (primero).
  - Acceptance: redirect a `/book/done?appointmentId=...` o similar; muestra resumen; botón descarga `.ics` válido.
  - Files: `components/BookingWizard.vue`, `pages/book/done.vue` (nuevo), `server/api/public/appointments/[id]/calendar.ics.get.ts` (nuevo) o similar.
  - NEXT: definir datos mínimos del evento (title/location/notes/timezone).

- [ ] (todo) **Booking UX**: vista tipo “día de calendar” (timeline/bloques) en vez de slots sueltos.
  - NEXT: elegir diseño (timeline vertical vs grid 15m) + implementar en `BookingWizard`.
- [ ] (todo) **Booking**: cuando no hay disponibilidad, mostrar mensaje/CTA claro (cambiar día / elegir otro barbero / etc.).
  - NEXT: definir copy y estados.

## P2 — Cliente (private)
- [x] (done) **Client / Upcoming shows past**: tabs y filtros de `/private/client/appointments` corregidos.
  - Resultado: `UTabs` usa `v-model` correctamente y la lista cambia entre “Próximos”/“Pasados”.
  - Regla aplicada: “Próximos” = `startTime >= now`; “Pasados” = `startTime < now`.
  - Ref commit: `c3c2247`.

- [x] (done) **Booking / i18n + redirect**:
  - Fix: evitar colisión de `booking.confirm` (string) vs confirm page (objeto) usando `booking.confirmPage.*`.
  - Fix: ruta `/book/done` (conflicto `pages/book.vue` vs `pages/book/*`) moviendo a `pages/book/index.vue`.

- [ ] (todo) **Client landing**: convertir `/private/client` en un dashboard útil.
  - Incluye: noticias/ofertas + resumen de últimos turnos + puntos + “hace cuánto no se corta el pelo”.
  - Acceptance: carga rápida + estados loading + responsive.
  - Files: `pages/private/client/index.vue`, endpoints nuevos.
  - NEXT: definir modelo de “news/offers” y UI mínima.

- [ ] (todo) **News/Offers CMS**: permitir crear/editar noticias desde Backoffice (ADMIN/OWNER).
  - Acceptance: CRUD simple + publicar/no publicar + orden/fecha.
  - Files: `pages/private/backoffice/*` (nuevo), `server/api/news/*` (nuevo), prisma schema.
  - NEXT: definir schema (News: title/body/imageUrl/publishedAt/expiresAt/audience/branchId?).

- [ ] (todo) **Client pages**: sacar selector de sucursal del layout en páginas CLIENT (no tiene sentido que cambie branch).
  - Acceptance: CLIENT no ve selector; roles internos sí.
  - Files: `layouts/private.vue` (probable), `composables/useSelectedBranch.ts`.
  - NEXT: decidir regla exacta por rol.

- [ ] (todo) **Loading indicators**: agregar indicadores de carga en todas las páginas de CLIENT.
  - Acceptance: skeleton/spinner visible mientras fetch; sin flicker molesto.
  - Files: `pages/private/client/*.vue`.
  - NEXT: estandarizar componente de loading.

- [ ] (todo) **Redeem**: mostrar solo productos canjeables *y* que el cliente pueda pagar con sus puntos.
  - Acceptance: no mostrar productos con `pointsCost <= 0` ni los que `pointsCost > balance`.
  - Files: `pages/private/client/redeem.vue`.
  - NEXT: ajustar computed `redeemable` para filtrar por balance.

- [ ] (todo) **Client profile**: en perfil privado de cliente mostrar/editar teléfono y datos; permitir cambiar password.
  - Acceptance: editar name/phone/email (si corresponde) + flujo cambiar password.
  - Files: `pages/private/profile.vue` (o un `/private/client/profile.vue`), endpoints.
  - NEXT: decidir qué campos son editables y cómo se valida.

## Ideas (opcional)
- [ ] **Rebook rápido**: botón “Reservar de nuevo” usando último servicio/barbero si existe.
- [ ] **Turnos**: mostrar próximos + últimos 3 con status y CTA “ver detalle”.
- [ ] **News**: audiencia (todos vs por sucursal) + expiración.

## P2 — Manager
- [x] (done) **Caja / Visibilidad**: panel de estado por caja con OPEN/CLOSED, apertura, balance y último movimiento.
  - Resultado: estado visible en `/private/backoffice/cash` por sucursal, actualizado al abrir/cerrar.
  - Files: `pages/private/backoffice/cash.vue`, `server/api/cash/sessions/index.get.ts`.
- [x] (done) **Caja / Split UI**: separar “Uso de Cajas” vs “Administración de Cajas” con permisos por rol.
  - Resultado: operaciones diarias visibles a MANAGER/ADMIN/OWNER; administración solo ADMIN/OWNER.
  - Files: `pages/private/backoffice/cash.vue`.
- [x] (done) **Caja / Cierre por caja**: acción de cerrar sesión directamente desde cada tarjeta OPEN.
  - Resultado: botón “Cerrar caja” dispara el flujo existente y actualiza estado/sesiones al cerrar.
  - Files: `pages/private/backoffice/cash.vue`.
- [ ] (todo) **Calendar UX**: el modal de appointment debería mostrar más info + permitir mover el turno (y/o editar horario).
  - Acceptance: modal incluye datos (cliente, contacto, servicio, estado, pago, notas) + acción “Mover turno” con selector de fecha/hora.
  - NEXT: definir UI de move (drag&drop vs form) y conectar a endpoint `PATCH /api/appointments/:id/move`.

- [ ] (todo) **Calendar drag&drop**: arrastrar el turno en el calendario hoy no hace nada.
  - Scope: aplicar a calendarios de **Manager + Admin/Owner**.
  - Acceptance: drag&drop habilitado (con confirmación) y persiste via endpoint move; feedback visual.
  - Files: `pages/private/backoffice/calendar.vue` (y manager calendar), `server/api/appointments/[id]/move.patch.ts`.
  - NEXT: revisar configuración del componente calendar y eventos.

- [ ] (todo) **Calendar resources separators**: agregar separación visual entre resources (barberos) para mejorar legibilidad.
  - Decision: **C** = zebra suave (fondo alternado por resource) + divider entre columnas.
  - Scope: calendarios de **Manager + Admin/Owner**.
  - Acceptance: líneas/espaciado/fondo alternado por resource; no rompe responsive.
  - NEXT: revisar capacidades del componente (VueCal) y aplicar CSS.

- [ ] (todo) **Dashboard/Resumen**: implementar métricas reales (reemplazar placeholders).
  - Items: “Turnos hoy”, “Pagos pendientes”, “Ingresos de la semana”.
  - Acceptance: números consistentes con queries; loading/skeleton; filtros por sucursal (si aplica).
  - NEXT: definir fuentes (appointments + payments/cash) y rango de fechas.

- [ ] (todo) **Caja**: revisar flujo abrir→cerrar→cobrar (comportamiento confuso) + clarificar botón “Movimientos”.
  - Acceptance: movimientos muestran claramente depósitos/retiros/auto; si caja cerrada, qué pasa con cobros posteriores (regla explícita).
  - NEXT: reproducir caso y decidir regla (rechazar cobro / auto-reabrir / asignar a nueva sesión).

- [x] (done) **Permisos**: Manager no debe poder crear/editar Productos ni Servicios (solo ver).
  - Acceptance: UI oculta botones; API valida roles.
  - Files: `pages/private/manager/products.vue` / `services.vue` (si existen) + `server/api/*`.
  - NEXT: aplicar `requireRole` (OWNER/ADMIN) en endpoints de create/update/delete.

- [ ] (todo) **Módulo de Venta**: crear flujo para vender productos (**MANAGER/ADMIN/OWNER**) y registrar el pago.
  - Decision: venta requiere **sucursal** + **caja abierta**; descuenta **stock de esa sucursal**.
  - Acceptance: selección producto + qty + método pago; si no hay caja abierta → bloquear con CTA “Abrir caja”; al confirmar → crea sale + movimiento de caja + decrementa BranchStock.
  - NEXT: definir modelo (Sale + SaleItems) + movimiento de caja asociado + UI mínima.

- [ ] (todo) **Venta asociada a turno**: desde el appointment en calendario poder agregar productos a la venta (upsell) y cobrarlos.
  - Decision: **1 venta por turno** con **items editables**.
  - Acceptance: en modal de appointment → agregar/editar items (producto + qty) → registra/actualiza Sale vinculada al appointment; descuenta stock sucursal; requiere caja abierta.
  - Files: `pages/private/backoffice/calendar.vue` (modal), `server/api/sales/*` (nuevo), prisma (Sale.appointmentId unique).
  - NEXT: diseñar UI mínima y endpoints create/update sale.

- [ ] (todo) **Servicios (venta)**: definir si “vender servicio” es cobro de un appointment o venta directa.
  - NEXT: aclarar scope para no duplicar caja/appointments.

## P2 — Barber
- [x] (done) **Barber Today calendar**: `/private/barber/today` muestra turnos del barbero logueado.
  - Resultado: carga eventos por rango desde `/api/calendar/events` con restricción server-side por BARBER.
  - Files: `pages/private/barber/today.vue`, `server/api/calendar/events.get.ts`.
  - Ref commits: `ac31e20`, `563f92c`.

- [ ] (todo) **Barber finances**: mejorar el panel/lista con más info + totales.
  - Decision: comisión = % **fijo por barbero** (Employee/Barber tiene `commissionRate` o similar).
  - Add: total de appointments PAID (semana) + total $ (comisión barbero = % del total de servicios).
  - Acceptance: totales correctos por rango; % configurable por barber.
  - Files: `pages/private/barber/finances.vue`, `server/api/barber/finances.get.ts`, prisma schema (employee).
  - NEXT: agregar campo a modelo + exponerlo en API + calcular totales.

- [ ] (todo) **Barber appointments filters UI**: selector de estado es muy chico y no se ven valores completos.
  - Acceptance: select con width suficiente / responsive.
  - Files: `pages/private/barber/appointments.vue`.

- [ ] (todo) **Barber appointments modal**: en `/private/barber/appointments` seleccionar un appointment abre modal y permite cambiar estado (iniciar/finalizar).
  - Acceptance: modal con info + acciones; usa `PATCH /api/appointments/:id/status`.
  - Files: `pages/private/barber/appointments.vue`, `server/api/appointments/[id]/status.patch.ts`.
  - NEXT: definir qué estados permite el rol BARBER.

- [ ] (todo) **Barber appointments range**: agregar opción de rango **Diario** además de semanal/mensual.
  - Acceptance: selector incluye Daily; UI maneja volumen (10+ por día).
  - Files: `pages/private/barber/appointments.vue`.

## P2 — Backoffice
- [ ] (todo) **Staff vs Clients split**: separar CRUD de staff (employees) vs CRUD de clientes.
  - Decision: CRUD de clientes se basa en entidad `Client` (booking/loyalty). `User(role=CLIENT)` es opcional/vinculado.
  - Acceptance:
    - `/private/backoffice/employees` = staff only (OWNER/ADMIN/MANAGER/BARBER).
    - nueva página `/private/backoffice/clients` = CRUD de `Client`.
  - Files: `pages/private/backoffice/employees.vue`, `pages/private/backoffice/clients.vue` (nuevo), `server/api/clients/*` (si falta), permisos.
  - NEXT: definir columnas/acciones mínimas para clients (ver historial turnos, puntos, contacto).

- [ ] (todo) **Employees table**: permitir ordenar/filtrar por Rol (y que se vea bien).
  - Acceptance: filtro por rol (dropdown) + sort por rol.
  - Files: `pages/private/backoffice/employees.vue`.
  - NEXT: agregar filter state y aplicarlo en `useCrudTable`.

- [ ] (todo) **Caja**: validar cálculo de “monto actual” vs movimientos automáticos por `PAID` + manuales.
  - NEXT: test con 1 sesión real con depósitos/retiros + cierre.

## P3 — Tech / hygiene
- [ ] (todo) **Dev env**: warning `docker-compose.yml: version is obsolete`.
  - NEXT: remover `version:` del compose.

## Notas / decisiones
- Booking “disponibles” hoy = filtra contra `busy` (PENDING/CONFIRMED/IN_PROGRESS) + filtra pasado.
- Se corrigió bug de selector de sucursal (múltiples instancias de `useSelectedBranch` re-inicializando desde cookie) moviendo `didInit` a `useState`.
