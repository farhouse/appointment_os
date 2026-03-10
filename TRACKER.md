# Barber OS — Tracker (mejoras / correcciones)

> Archivo vivo. Mantenerlo corto y accionable.
> Convención: cada ítem tiene **prioridad**, **área**, **estado**, y un **NEXT** claro.
> **Single source of truth:** este es el único archivo de tareas vigente.

Leyenda estado: `todo | doing | blocked | done`

## Focus (Now / Next / Later)

### NOW (próximo batch)
- [x] (done) Booking / Availability (`busy` real)
- [x] (done) Calendar UX (modal + mover turno)
- [x] (done) Barber working hours (base semanal + impacto en disponibilidad)
- [x] (done) Caja: revisar flujo abrir→cerrar→cobrar

### NEXT
- Venta asociada a turno (upsell)
- Client profile editable + cambio de password
- Cliente: fotos de cortes (máx 3, storage local docker)
- Barber appointments (filters UI + modal + rango diario)

### LATER
- News/Offers CMS + audiencia/expiración
- Rebook rápido
- Barber finances (más info + totales)
- Dev env cleanup (`docker-compose.yml` warning)

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

- [x] (done) **Booking / Availability**: data `busy` real por rango para que “solo disponibles” sea consistente.
  - Resultado: `/api/public/availability` consulta turnos reales `PENDING/CONFIRMED/IN_PROGRESS` por sucursal + opcional barbero, y calcula `available` evitando solapes.
  - Incluye: fallback de horario (barbero por día de semana → sucursal si no hay horario explícito).
  - Files: `server/api/public/availability/index.get.ts`, `components/BookingWizard.vue`.
  - Ref commits: `e2ff603`, `49bb0f2`.

## P1 — UX / flujo
- [x] (done) **Booking / Branch select**: en el dropdown de sucursal se muestra también la dirección para desambiguar.
  - Resultado: opciones con nombre + contexto de dirección/barrio en el wizard.

- [x] (done) **Booking / Identity**: si el usuario no existe en `users`, se propone crear cuenta cliente.
  - Resultado: flujo de opt-in activo en booking para crear usuario cliente sin bloquear la reserva.

- [x] (done) **Booking / Email required**: email obligatorio en booking.
  - Resultado: validación en UI/server para no permitir submit sin email.

- [x] (done) **Booking / Confirmation system**: confirmación por email (link/token) antes de confirmar el turno.
  - Resultado: booking genera token + envío; endpoint público confirma o informa estado; endpoint público reenvía con cooldown.
  - Files: `server/api/public/appointments/index.post.ts`, `server/api/public/appointments/[id]/confirm.*`, mailer.

- [x] (done) **Backoffice / Email settings visibility**: estado seguro de proveedor/from/reply-to y acción de test-send.
  - Resultado: sección de Settings muestra status desde env (sin secretos), endpoint de test-send disponible para ADMIN/OWNER.
  - Files: `pages/private/backoffice/settings.vue`, `server/api/settings/email.get.ts`, `server/api/settings/email-test.post.ts`.

- [x] (done) **Booking / Done screen**: después de reservar se navega a pantalla final de cierre de journey.
  - Resultado: flujo de booking termina en pantalla de finalización.

- [x] (done) **Booking UX**: vista tipo día/timeline implementada en booking para reemplazar slots sueltos.
- [x] (done) **Booking**: cuando no hay disponibilidad, mostrar mensaje/CTA claro (cambiar día / elegir otro barbero / etc.).
  - Resultado: estado vacío de horarios ahora muestra guidance + CTA directos (probar día siguiente / ver con cualquier barbero).
  - Files: `components/BookingWizard.vue`, `i18n/locales/{es-AR,en}.json`.

## P2 — Cliente (private)
- [x] (done) **Client / Upcoming shows past**: tabs y filtros de `/private/client/appointments` corregidos.
  - Resultado: `UTabs` usa `v-model` correctamente y la lista cambia entre “Próximos”/“Pasados”.
  - Regla aplicada: “Próximos” = `startTime >= now`; “Pasados” = `startTime < now`.
  - Ref commit: `c3c2247`.

- [x] (done) **Booking / i18n + redirect**:
  - Fix: evitar colisión de `booking.confirm` (string) vs confirm page (objeto) usando `booking.confirmPage.*`.
  - Fix: ruta `/book/done` (conflicto `pages/book.vue` vs `pages/book/*`) moviendo a `pages/book/index.vue`.

  - Incluye: noticias/ofertas + resumen de últimos turnos + puntos + “hace cuánto no se corta el pelo”.
  - Acceptance: carga rápida + estados loading + responsive.
  - Files: `pages/private/client/index.vue`, endpoints nuevos.
  - Estado: dashboard base implementado con loading/empty/error states y placeholders de ofertas.
  - NEXT: definir modelo de “news/offers” y UI mínima.

- [ ] (todo) **News/Offers CMS**: permitir crear/editar noticias desde Backoffice (ADMIN/OWNER).
  - Acceptance: CRUD simple + publicar/no publicar + orden/fecha.
  - Files: `pages/private/backoffice/*` (nuevo), `server/api/news/*` (nuevo), prisma schema.
  - NEXT: definir schema (News: title/body/imageUrl/publishedAt/expiresAt/audience/branchId?).

- [x] (done) **Client pages**: selector de sucursal oculto para rol CLIENT en layout privado.
  - Resultado: CLIENT no ve selector; roles internos sí.

- [x] (done) **Loading indicators**: agregar indicadores de carga en todas las páginas de CLIENT.
  - Resultado: skeletons visibles en `/private/client` (loading de `me`), `/private/client/appointments`, `/private/client/redeem` y `/private/client/book`.
  - Files: `pages/private/client/*.vue`.

- [ ] (todo) **Client profile**: en perfil privado de cliente mostrar/editar teléfono y datos; permitir cambiar password.
  - Acceptance: editar name/phone/email (si corresponde) + flujo cambiar password.
  - Files: `pages/private/profile.vue` (o un `/private/client/profile.vue`), endpoints.
  - NEXT: decidir qué campos son editables y cómo se valida.

- [ ] (todo) **Cliente / Registro de cortes con fotos (máx 3)**: permitir cargar hasta 3 fotos por cliente para histórico visual de cortes.
  - Acceptance:
    - Subida de imagen desde ficha del cliente (backoffice).
    - Máximo 3 fotos por cliente (si llega al límite, forzar reemplazo/eliminación).
    - Vista miniatura + eliminar foto.
    - Persistencia en disco local (storage montado en Docker), con metadata en DB.
  - Tech notes:
    - Modelo recomendado: `ClientPhoto` (no 3 columnas fijas en `Client`).
    - Guardar `path/url`, `createdAt`, `uploadedBy`, opcional `note`.
    - Exponer archivos desde volumen dedicado (ej. `/uploads/client-photos`).
  - Files: `prisma/schema.prisma`, migración, `server/api/clients/*`, `pages/private/backoffice/clients.vue` (o detalle cliente), `docker-compose.yml` (volumen).

## Ideas (opcional)
- [ ] **Rebook rápido**: botón “Reservar de nuevo” usando último servicio/barbero si existe.
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
- [x] (done) **Caja / Sesiones pendientes**: banner superior con sesiones abiertas y CTA directo al cierre por sesión.
  - Resultado: alerta con caja, apertura y usuario; acceso rápido a cierre; acciones por caja OPEN/CLOSED en “Estado por caja”.
  - Files: `pages/private/backoffice/cash.vue`.
- [x] (done) **Caja / Refactor sesión diaria + sectores por método**: sesión única por sucursal con movimientos sectorizados por método de pago.
  - Resultado: cash session por sucursal/día, totales por método y cierre con conteos por método.
  - Files: `prisma/schema.prisma`, `prisma/migrations/20260226120000_cash_session_payment_sectors/migration.sql`, `server/api/cash/*`, `server/api/appointments/[id]/status.patch.ts`, `server/api/sales/index.post.ts`, `pages/private/backoffice/cash.vue`, `pages/private/backoffice/calendar.vue`.
  - Nota: requiere datos de pago por método al cobrar appointments.
- [x] (done) **Caja / Settings vs Cash split + sesiones globales**: configuración de cajas/métodos en Settings y panel global de sesiones abiertas para admin.
  - Resultado: administración de cajas/métodos en Settings; caja operativa sin setup; admin ve sesiones abiertas multi-sucursal.
  - Files: `pages/private/backoffice/settings.vue`, `pages/private/backoffice/cash.vue`, `server/api/cash/sessions/index.get.ts`, `server/api/settings/payment-methods.*`.
- [x] (done) **Caja / Hardening medios de pago**: implementación tipada y consistente con migración.
  - Estrategia: rieles base fijos (`CASH`, `CARD`, `TRANSFER`, `OTHER`) + medios personalizados (nombre/descr.) configurables.
  - Resultado: se eliminan fallbacks frágiles (`as any`), se centraliza validación en `server/utils/paymentMethods.ts`, se agregan medios personalizados desde Settings y se bloquean cobros/movimientos cuando no hay medio activo para el riel.
  - Además: cobros/ventas/movimientos ahora aceptan `paymentMediumId` para trazabilidad fina por medio personalizado.
  - Files: `prisma/migrations/20260226123000_payment_method_config/migration.sql`, `prisma/migrations/20260227120000_payment_media_profiles/migration.sql`, `prisma/migrations/20260227124000_payment_medium_links/migration.sql`, `server/utils/paymentMethods.ts`, `server/api/settings/payment-methods.*`, `server/api/appointments/[id]/status.patch.ts`, `server/api/sales/index.post.ts`, `server/api/cash/movements.post.ts`, `pages/private/backoffice/{settings,cash,calendar}.vue`.
- [ ] (todo) **Calendar UX**: el modal de appointment debería mostrar más info + permitir mover el turno (y/o editar horario).
  - Acceptance: modal incluye datos (cliente, contacto, servicio, estado, pago, notas) + acción “Mover turno” con selector de fecha/hora.
  - NEXT: definir UI de move (drag&drop vs form) y conectar a endpoint `PATCH /api/appointments/:id/move`.

- [x] (done) **Calendar drag&drop**: arrastrar el turno en el calendario hoy no hace nada.
  - Scope: aplicar a calendarios de **Manager + Admin/Owner**.
  - Resultado: drag&drop persiste con `PATCH /api/appointments/:id/move`, feedback toast y refresh del calendario.
  - Files: `pages/private/backoffice/calendar.vue`, `server/api/appointments/[id]/move.patch.ts`.

- [ ] (todo) **Calendar resources separators**: agregar separación visual entre resources (barberos) para mejorar legibilidad.
  - Decision: **C** = zebra suave (fondo alternado por resource) + divider entre columnas.
  - Scope: calendarios de **Manager + Admin/Owner**.
  - Acceptance: líneas/espaciado/fondo alternado por resource; no rompe responsive.
  - NEXT: revisar capacidades del componente (VueCal) y aplicar CSS.

- [x] (done) **Dashboard/Resumen**: implementar métricas reales (reemplazar placeholders).
  - Resultado: métricas reales para turnos hoy, facturación hoy, sesiones de caja abiertas y clientes atendidos hoy.
  - Files: `pages/private/backoffice/index.vue`, `server/api/dashboard/summary.get.ts`, `i18n/locales/{es-AR,en}.json`.

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

- [x] (done) **Venta asociada a turno**: desde el appointment en calendario poder agregar productos a la venta (upsell) y cobrarlos.
  - Decision: **1 venta por turno** con **items editables**.
  - Acceptance: en modal de appointment → agregar/editar items (producto + qty) → registra/actualiza Sale vinculada al appointment; descuenta stock sucursal; requiere caja abierta para cobrar.
  - Files: `pages/private/backoffice/calendar.vue` (modal), `server/api/appointments/[id]/sale.post.ts`, `server/api/appointments/[id]/status.patch.ts`, `prisma/schema.prisma` (Sale.appointmentId unique).
  - Estado: Implementado flujo de upsell con persistencia de items, descuento de stock y cobro unificado.

## P2 — Barber
- [x] (done) **Barber Today calendar**: `/private/barber/today` muestra turnos del barbero logueado.
  - Resultado: carga eventos por rango desde `/api/calendar/events` con restricción server-side por BARBER.
  - QA/Prod: **validado por usuario** (el barbero ve sus propios cortes).
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

- [ ] (todo) **Barber working hours**: definir y guardar horarios de trabajo por barbero (rol BARBER).
  - Estado actual: **parcial implementado**.
  - Resultado actual:
    - Configuración semanal por día (inicio/fin + día no laboral) disponible desde Backoffice Employees (acción "Horarios").
    - Persistencia vía endpoints de employees/working-hours.
    - Availability pública (`/api/public/availability`) ya usa estos horarios (barbero y fallback sucursal).
  - Pendiente para cerrar:
    - Visualización en calendar del barbero/manager (franjas disponibles/no disponibles según horario laboral).
    - QA E2E completo (configuración → impacto en booking/calendario en todos los roles).
  - Acceptance:
    - Configuración semanal por día (inicio/fin + día no laboral).
    - Visible/editable por ADMIN/OWNER (y opcionalmente por MANAGER según permisos).
    - Booking/agenda respeta disponibilidad real de ese horario.
    - Calendar muestra claramente ventanas laborales vs fuera de horario.
  - Files: `prisma/schema.prisma` (availability model), endpoints de employees/availability, `pages/private/backoffice/employees.vue` (o detalle), lógica de disponibilidad en calendar/booking.
  - NEXT: implementar overlay/indicador visual de jornada laboral en `pages/private/barber/today.vue` (y validar si aplica también en backoffice calendar).

## P2 — Backoffice
- [x] (done) **Settings split**: sectores de configuración separados en subpáginas dedicadas.
  - Resultado: hub en `/private/backoffice/settings` con accesos a Sucursales, Medios de pago, Email y Cajas.
- [x] (done) **Staff vs Clients split**: separar CRUD de staff (employees) vs CRUD de clientes.
  - Resultado:
    - `/private/backoffice/employees` mantiene staff only (OWNER/ADMIN/MANAGER/BARBER).
    - nueva página `/private/backoffice/clients` con CRUD de `Client` para OWNER/ADMIN/MANAGER.
    - listado incluye campo de puntos (`pointsBalance`).
  - Files: `pages/private/backoffice/clients.vue`, `layouts/private.vue`, `server/api/clients/index.get.ts`, `server/api/clients/index.post.ts`, `server/api/clients/[id].patch.ts`, `server/api/clients/[id].delete.ts`, `i18n/locales/{es-AR,en}.json`.

- [x] (done) **Employees table**: permitir ordenar/filtrar por Rol (y que se vea bien).
  - Resultado: filtro por rol (dropdown) + sort por rol + paginado se resetea al filtrar.
  - Files: `pages/private/backoffice/employees.vue`, `components/CrudTableShell.vue`.

- [x] (done) **Caja**: validar cálculo de “monto actual” vs movimientos automáticos por `PAID` + manuales.
  - Resultado: apertura se registra como movimiento CASH; totales incluyen apertura y mantienen signos para depósitos/retiros.
  - NEXT: test con 1 sesión real con depósitos/retiros + cierre.

## P3 — Tech / hygiene
- [ ] (todo) **Dev env**: warning `docker-compose.yml: version is obsolete`.
  - NEXT: remover `version:` del compose.

## Notas / decisiones
- Booking “disponibles” hoy = filtra contra `busy` (PENDING/CONFIRMED/IN_PROGRESS) + filtra pasado.
- Se corrigió bug de selector de sucursal (múltiples instancias de `useSelectedBranch` re-inicializando desde cookie) moviendo `didInit` a `useState`.
- QA smoke general en prod reportado por usuario: Login/Logout ✅, Navegación ✅, Agenda ✅, Crear/Editar ✅, estado general estable.
