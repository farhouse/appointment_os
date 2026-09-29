# Plan de faltantes desde implementaciones previas

> Plan historico completado el 2026-09-29. El estado vigente esta en `TRACKER.md` y no contiene pendientes activos.

Fecha: 2026-05-19

Este documento resume que fue lo ultimo relevante que se hizo, que quedo pendiente o inconsistente en los archivos viejos de implementacion, y propone un plan de trabajo incremental.

Fuentes revisadas:

- `TRACKER.md`
- `docs/CODING_AGENT_TASKS.md`
- `docs/PRIVATE_ROLE_SKELETON_PLAN.md`
- `docs/ARCHITECTURE_PRIVATE.md`
- `docs/opencode-pack-loyalty.md`
- `docs/admin-crud-utables.md`
- `docs/refactor-cashboxes-paid.md`
- `docs/REFactor_DECISIONS.md`
- `docs/prisma-baseline.md`
- Codigo actual en `pages/`, `server/api/`, `prisma/schema.prisma`, `layouts/`, `middleware/`, `composables/`.

## Ultimo trabajo relevante detectado

Segun `git log`, los ultimos hitos fueron:

- `chore(prisma): add formal time_blocks migration after db-push rollout`
- `feat(calendar): implement staff time blocking`
- Ajustes previos de UI de caja y separadores visuales del calendario.
- `refactor(worker-routes): make worker pages primary and keep barber routes as redirects`

En terminos funcionales, lo ultimo cerrado fue el modulo de bloqueos de tiempo:

- Modelo `TimeBlock`.
- API `server/api/time-blocks/*`.
- Integracion en calendario interno.
- Integracion en disponibilidad publica.
- Soporte de auto-bloqueo desde vistas worker.
- Migracion formal `20260312200000_time_blocks`.

## Estado por archivo viejo de implementacion

### `docs/CODING_AGENT_TASKS.md`

Estado general: mayormente implementado, con pendientes de pulido.

Hecho:

- i18n esta instalado y configurado en `nuxt.config.ts`.
- Existen locales `i18n/locales/es-AR.json` y `i18n/locales/en.json`.
- `layouts/private.vue` incluye selector de idioma.
- Landing/login/private navigation usan i18n en gran parte.
- Landing tiene flujo hacia login/panel y ahora ademas es configurable desde settings.
- Existe selector global de sucursal via `useSelectedBranch()`.
- El selector persiste en cookie `selectedBranchId`.
- Calendario backoffice y vistas worker usan `branchId` o reaccionan a la sucursal.
- El problema viejo de FullCalendar quedo obsoleto: el calendario actual usa `vue-cal`.

Faltante o dudoso:

- Auditar textos hardcodeados restantes. Ejemplo confirmado: `pages/private/backoffice/sales.vue` aun contiene textos visibles en castellano sin i18n.
- `pages/private/worker/appointments.vue` filtra por sucursal en cliente despues de traer datos; el endpoint no recibe `branchId`.
- Confirmar que todos los endpoints sensibles validen pertenencia de la sucursal para `MANAGER` y `BARBER`, no solo filtren por query.

### `docs/PRIVATE_ROLE_SKELETON_PLAN.md` y `docs/ARCHITECTURE_PRIVATE.md`

Estado general: implementado, con una deuda estructural.

Hecho:

- `/private` funciona como router por rol.
- `/private/backoffice/**`, `/private/worker/**`, `/private/client/**` son las rutas primarias actuales.
- Rutas antiguas `/private/manager/**` y `/private/barber/**` existen como redirects.
- Middleware frontend `private` y `role` existen.
- RBAC real vive en servidor con `requireRole()` y `getAuthUser()`.
- JWT/cookie/auth fueron centralizados en `server/utils/auth.ts`.

Faltante:

- El vinculo formal `User(role=CLIENT)` -> `Client` sigue sin existir.
- Endpoints client actuales resuelven el cliente por email (`prisma.client.findFirst({ where: { email: u.email } })`), lo que es fragil si cambia el email o si existen perfiles sin email.
- Plan minimo recomendado: agregar `User.clientId String? @unique` con relacion opcional a `Client`, actualizar setup/registro/login cliente y hacer que `/api/me` devuelva `clientId`.

### `docs/opencode-pack-loyalty.md`

Estado general: implementado casi completo.

Hecho:

- `Product.pointsCost Int @default(0)` existe.
- Modelo `Redemption` existe.
- `LoyaltyLedger.appointmentId String? @unique` existe.
- Migracion `20260215235833_loyalty_redemption_points` existe.
- Productos backoffice incluyen `pointsCost`.
- APIs existen:
  - `GET /api/client/points`
  - `POST /api/client/redeem`
  - `GET /api/public/products?redeemable=true`
- UI existe:
  - `/private/client/redeem`
  - link de navegacion cliente.
- Awarding de puntos al marcar appointment como `PAID` existe en `server/api/appointments/[id]/status.patch.ts`.
- Regla actual: usar suma de `Service.pointsReward`; si es 0, fallback `floor(paidAmount / 1000)`.
- Idempotencia: usa `LoyaltyLedger.appointmentId`.

Faltante:

- Resolver el vinculo formal client-user mencionado arriba.
- Revisar si `public/appointments/index.post.ts` debe seguir otorgando puntos al crear turno publico. Actualmente aparece escritura de ledger en booking publico, lo que puede duplicar semantica con el award al pagar si no esta cuidadosamente separado.
- Validar UX de saldo/canje cuando no hay `Client` asociado al usuario.

### `docs/admin-crud-utables.md`

Estado general: parcialmente implementado.

Hecho:

- Existen helpers reutilizables:
  - `components/CrudTableShell.vue`
  - `components/CrudState.vue`
  - `composables/useCrudTable.ts`
  - `composables/useBackofficeTableUi.ts`
- Productos, empleados, servicios y stock tienen UI backoffice moderna o parcialmente modernizada.

Faltante:

- Estandarizar todas las areas backoffice con el mismo patron UTable/search/sort/pagination/modal.
- `pages/private/backoffice/sales.vue` usa tabla HTML/manual, textos hardcodeados y formulario inline; no sigue el patron CRUD/UTable.
- Revisar `branches`, `cashboxes`, `clients`, `cash` para consistencia de estados loading/error/empty y modales.
- El documento viejo menciona `/private/manager/*`; la ruta primaria actual es `/private/backoffice/*`.

### `docs/refactor-cashboxes-paid.md`

Estado general: implementado, pero hay inconsistencias importantes con caja/cashbox.

Hecho:

- Modelo `CashBox` existe.
- `Appointment` guarda `paidCashBoxId`, `paidPaymentMethod`, `paidPaymentMediumId`, `paidAmount`.
- `CashMovement` puede vincular `appointmentId` y `saleId`.
- APIs `cashboxes` existen.
- Settings de cashboxes existe.
- Pago de appointment requiere `cashBoxId`.
- Pago de appointment exige una sesion abierta en vez de auto-crear sesion. Esto resuelve parcialmente la pregunta "que pasa si caja esta cerrada".

Inconsistencias / faltantes:

- `server/api/cash/sessions/open.post.ts` impide mas de una sesion abierta por sucursal, aunque el modelo tiene `cashBoxId`. Si hay varias cajas por sucursal, esto limita el diseño.
- `server/api/sales/index.post.ts` no acepta `cashBoxId`, aunque `pages/private/backoffice/sales.vue` obliga a elegir caja.
- `server/api/sales/index.post.ts` busca cualquier sesion abierta por `branchId`, por lo que una venta directa puede terminar en la sesion equivocada si el usuario eligio otra caja en UI.
- `server/api/appointments/[id]/status.patch.ts` valida `cashBoxId`, pero luego busca sesion abierta solo por `branchId`, no por `cashBoxId`. Puede registrar movimientos en una sesion de otra caja.
- `cash/sessions/current.get.ts` permite `OR: [{ cashBoxId }, { cashBoxId: null }]`, probablemente por compatibilidad legacy, pero puede ocultar errores cuando se exige caja concreta.
- `cash/sessions/[id]/close.post.ts` todavia importa `createError` sin usar y no usa helpers de error para casos de sesion inexistente.

### `docs/prisma-baseline.md`

Estado general: documento operativo, pero esta desactualizado.

Hecho:

- Describe como baselinar una DB existente.

Faltante:

- La lista de migraciones aplicadas no incluye migraciones posteriores:
  - `20260227120000_payment_media_profiles`
  - `20260227124000_payment_medium_links`
  - `20260312140500_user_commission_rate`
  - `20260312143500_landing_config_html`
  - `20260312200000_time_blocks`
- Actualizar este doc antes de usarlo en una DB real.

## Faltantes consolidados

### P0 - Corregir inconsistencias de caja antes de sumar mas features

Estado: hecho.

Riesgo original: alto. Afectaba dinero, sesiones y reportes.

Resultado:

- Regla elegida: una sesion abierta por `cashBoxId`.
- `POST /api/sales` requiere `cashBoxId` y busca sesion abierta por `branchId + cashBoxId`.
- Pago de appointment busca sesion abierta por `branchId + cashBoxId`.
- `cash/sessions/open.post.ts` permite sesiones independientes por caja y bloquea duplicados por caja.
- `cash/sessions/current.get.ts` ya no cae automaticamente a una sesion legacy sin `cashBoxId` cuando se pide una caja concreta.
- `scripts/sanity.ts` valida que el movimiento de pago quede asociado a la sesion de la caja seleccionada.

Detalle historico de tareas cerradas:

Tareas:

1. Decidir regla de negocio:
   - Opcion A: una sola caja abierta por sucursal.
   - Opcion B: una sesion abierta por `cashBoxId`. Elegida.
2. Si se mantiene seleccion de caja, alinear API con UI:
   - Agregar `cashBoxId` al schema de `POST /api/sales`.
   - Buscar sesion abierta por `branchId + cashBoxId`.
   - En pago de appointment, buscar sesion por `branchId + paidCashBoxId`.
3. Ajustar `cash/sessions/open.post.ts` para no bloquear multiples cashboxes si se elige Opcion B.
4. Ajustar `cash/sessions/current.get.ts` para no caer silenciosamente a `cashBoxId: null` salvo en modo legacy explicito.
5. Agregar/actualizar sanity checks para:
   - pago appointment con caja correcta,
   - venta directa con caja correcta,
   - rechazo si la caja seleccionada esta cerrada.

### P1 - Formalizar relacion `User(CLIENT)` con `Client`

Riesgo: medio/alto. Afecta loyalty, perfil cliente, canjes y futuras fotos.

Estado: hecho.

Resultado aplicado:

- `User.clientId` y relacion opcional con `Client`.
- Migracion con backfill por email para usuarios `CLIENT` existentes.
- `/api/me` devuelve `clientId`.
- Endpoints de cliente resuelven por `clientId` y mantienen fallback/backfill por email.
- Registro publico enlaza el `User(CLIENT)` al `Client`.

Tareas:

1. Agregar `User.clientId String? @unique` y relacion opcional a `Client`.
2. Migrar o backfill por email/telefono para datos existentes.
3. Actualizar `/api/me` para incluir `clientId`.
4. Actualizar:
   - `/api/client/points`
   - `/api/client/redeem`
   - `/api/client/appointments`
   - `/api/client/redeem.post.ts`
   - `/api/public/users/register`
5. Mantener fallback por email solo durante migracion, si hace falta.

### P1 - Cerrar Worker appointments

Riesgo: medio. Es funcionalidad visible para worker.

Estado: hecho.

Resultado aplicado:

- `/api/worker/appointments` acepta `branchId` y filtra en servidor.
- El rango soporta `day`, `week` y `month`.
- La pantalla `/private/worker/appointments` agrega detalle/modal de turno y usa i18n para el label de cliente.
- Regla confirmada: esta vista es solo consulta; cambios de estado quedan fuera del bloque.

Tareas:

1. Pasar `branchId` al endpoint `/api/worker/appointments` en vez de filtrar solo en frontend.
2. Agregar rango diario, no solo week/month.
3. Agregar modal/detalle de turno.
4. Reemplazar texto hardcodeado `Cliente` por i18n.
5. Confirmar si el worker puede cambiar estados o solo consultar.

### P1 - Actualizar tracker y docs obsoletos

Riesgo: medio. Evita trabajo duplicado.

Tareas:

1. Marcar como hecho o parcial:
   - loyalty/redemption,
   - venta directa,
   - cash closed behavior parcial,
   - worker routes primarias.
2. Actualizar `docs/prisma-baseline.md` con todas las migraciones.
3. Aclarar que rutas primarias actuales son `/private/backoffice` y `/private/worker`, no `/private/manager` y `/private/barber`.

### P2 - Estandarizar Backoffice Sales

Riesgo: medio. Hoy funciona parcialmente, pero esta fuera del patron visual y tiene deuda i18n.

Tareas:

1. Migrar `pages/private/backoffice/sales.vue` a componentes Nuxt UI consistentes.
2. Usar i18n en todos los textos.
3. Mostrar estados loading/empty/error con `CrudState`.
4. Mover nueva venta a modal o slide-over.
5. Enlazar correctamente con `cashBoxId` segun P0.

### P2 - Auditoria i18n y textos hardcodeados

Riesgo: bajo/medio.

Tareas:

1. Ejecutar auditoria sobre `pages/`, `components/`, `layouts/`.
2. Reemplazar textos visibles restantes con claves.
3. Mantener ambos JSON validos.
4. Considerar automatizar con `scripts/i18n-audit.mjs` si esta vigente.

### P2 - Fotos de cortes para cliente

Riesgo: medio por storage/migracion.

Estado: hecho.

Resultado aplicado:

- Modelo `ClientPhoto` con metadata.
- Upload/list/delete en `/api/client/photos`.
- Dashboard cliente permite subir, previsualizar y borrar hasta 3 fotos.

Tareas:

1. Definir modelo, por ejemplo `ClientPhoto`.
2. Limitar a maximo 3 fotos por cliente.
3. Definir storage local para Docker.
4. Crear API upload/list/delete con RBAC.
5. Agregar UI en cliente/perfil o historial.

### P3 - Renombre interno Barber -> Worker

Riesgo: alto si se hace grande.

Estado: bloqueado/deferido.

Decision:

- Mantener `BARBER`, `professionalId` y aliases actuales por ahora.
- No mezclar esta migracion con features ni fixes: requiere cambio de enum/datos, rutas internas y compatibilidad.

Tareas:

1. Mantener `BARBER` y `professionalId` hasta tener migracion planificada.
2. Primero completar aliases y cobertura de tests/sanity.
3. Luego hacer migracion en pasos:
   - API aliases estables,
   - rename de carpetas internas,
   - rename Prisma enum/campos,
   - compatibilidad temporal o migracion total.

## Plan recomendado

### Fase 1 - Cerrar dinero y caja

Objetivo: que cada cobro termine en la caja/sesion correcta o sea rechazado.

Entregables:

- `POST /api/sales` acepta y usa `cashBoxId`.
- Pago de appointment busca sesion por `cashBoxId`.
- Regla documentada para una o multiples sesiones por sucursal.
- Sanity checks ampliados.

### Fase 2 - Cerrar identidad cliente

Objetivo: que loyalty/canje/appointments cliente no dependan de email mutable.

Entregables:

- Prisma relation `User.clientId`.
- Backfill/migracion.
- APIs client usan `clientId`.
- `/api/me` devuelve `clientId`.

### Fase 3 - Sincronizar docs/tracker

Objetivo: que los documentos guien el trabajo real.

Entregables:

- `TRACKER.md` actualizado.
- `docs/prisma-baseline.md` actualizado.
- Docs viejos marcados como "historicos" o corregidos con estado actual.

### Fase 4 - Completar worker UX

Objetivo: mejorar uso diario del worker sin tocar arquitectura grande.

Entregables:

- Worker appointments con branch server-side, rango diario y modal.
- Working hours visual + QA manual/E2E si se agrega herramienta.

### Fase 5 - Normalizar UI backoffice e i18n

Objetivo: consistencia y menos deuda visible.

Entregables:

- Sales refactor a Nuxt UI/i18n.
- Auditoria de hardcoded strings.
- Estados loading/error/empty consistentes.

### Fase 6 - Nuevas features

Objetivo: sumar producto nuevo despues de cerrar deudas de base.

Entregables:

- Fotos de cortes cliente.
- News/offers CMS.
- Rebook rapido.

## Recomendacion inmediata

Empezar por P0. Hay una discrepancia concreta entre UI y API en ventas directas: la pantalla exige seleccionar caja, pero el endpoint no recibe `cashBoxId` y registra el movimiento en cualquier sesion abierta de la sucursal. Esa correccion es pequena, verificable y protege datos financieros antes de avanzar con features nuevas.
