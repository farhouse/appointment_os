# Revision tecnica del codigo actual

Fecha original: 2026-05-19

Cierre: 2026-09-29

## Estado de cierre

Todos los hallazgos P0 y P1 fueron corregidos. Los bloqueos de tiempo ahora validan alcance, asignacion, orden y solapamientos; el HTML publico se sanitiza al guardar y leer. Se incorporo `npm run typecheck` y se corrigieron sus errores.

La normalizacion total de handlers y la reduccion adicional de `any` quedan como mejoras continuas, no como fallas funcionales ni pendientes de esta version. Los avisos de proveedores remotos de fuentes son degradacion controlada: el build usa iconos locales y finaliza correctamente.

Validacion final:

- typecheck sin errores;
- build de produccion exitoso;
- 13 migraciones aplicadas desde una base vacia;
- cero diferencias entre base migrada y `schema.prisma`;
- seed exitoso;
- sanity de caja/pagos exitoso.

Objetivo: revisar el codigo existente en busqueda de bugs, errores probables, riesgos de seguridad/datos y mejoras tecnicas. Este documento complementa `docs/implementation-gap-plan.md`: no lista features nuevas, sino problemas del codigo actual.

Validacion ejecutada:

- `npm run build`
- Resultado: build completo exitoso.
- Warnings: Nuxt/Icon intento consultar proveedores remotos de fonts/icons (`fonts.google.com`, `fonts.bunny.net`, `api.fontsource.org`, `api.fontshare.com`) y fallo por red restringida. El build continuo usando modo local.

## Hallazgos P0

### 1. Disponibilidad publica ignora el worker seleccionado

Archivos:

- `components/BookingWizard.vue`
- `server/api/public/availability/index.get.ts`

Problema:

- El frontend llama:
  - `/api/public/availability?branchId=...&workerId=...&date=...`
- El endpoint lee:
  - `const barberId = (query.barberId as string) || null`
- Resultado: `workerId` se ignora.

Impacto:

- Al reservar, la disponibilidad no se calcula para el trabajador seleccionado.
- Si `barberId` queda vacio, el endpoint consulta todos los turnos de la sucursal y puede bloquear horarios de un trabajador por turnos de otro.
- Tambien puede ignorar working hours individuales del trabajador elegido.

Correccion recomendada:

- Aceptar ambos parametros durante transicion:
  - `const workerId = query.workerId || query.barberId`
- Renombrar internamente a `professionalId`.
- Agregar test/sanity de disponibilidad con dos workers en la misma sucursal y turnos solapados.

### 2. Escalada de privilegios en endpoints de empleados

Archivos:

- `server/api/employees/index.post.ts`
- `server/api/employees/[id].patch.ts`
- `server/utils/schemas.ts`

Problema:

- `employeeSchema.role` permite `OWNER`.
- `POST /api/employees` permite roles `OWNER`, `ADMIN`, `MANAGER`, `BARBER`, `CLIENT`.
- La unica restriccion especial bloquea `ADMIN` para no-OWNER, pero no bloquea `OWNER`.
- Un `MANAGER` podria crear un usuario `OWNER`.
- En `PATCH /api/employees/:id`, un `MANAGER` podria cambiar el rol de un usuario a `OWNER`.

Impacto:

- Riesgo critico de privilegios.
- Un rol intermedio podria crear o promover usuarios al maximo rol.

Correccion recomendada:

- Definir matriz explicita de roles administrables:
  - Solo `OWNER` puede crear/asignar `OWNER` y `ADMIN`.
  - `ADMIN` puede crear/asignar `MANAGER` y `BARBER`.
  - `MANAGER` como minimo no deberia crear/asignar roles superiores ni editar usuarios fuera de sus sucursales.
- Rechazar `CLIENT` en endpoints de empleados si se mantiene separado el flujo de clientes.
- Agregar helper server-side, por ejemplo `assertCanManageEmployee(actor, targetRole, targetBranches)`.

### 3. Movimientos de caja pueden registrarse en una caja equivocada

Estado: resuelto en el bloque Caja y cobros.

Archivos:

- `pages/private/backoffice/sales.vue`
- `server/api/sales/index.post.ts`
- `server/api/appointments/[id]/status.patch.ts`
- `server/api/cash/sessions/current.get.ts`
- `server/api/cash/sessions/open.post.ts`

Problema:

- La UI de ventas obliga a elegir `cashBoxId`, pero `POST /api/sales` no acepta ni usa `cashBoxId`.
- `POST /api/sales` busca sesion abierta solo por `branchId`.
- Pago de appointment recibe `cashBoxId`, pero tambien busca sesion abierta solo por `branchId`.
- `cash/sessions/current.get.ts` con `cashBoxId` permite fallback a `{ cashBoxId: null }`.
- `open.post.ts` bloquea cualquier segunda sesion abierta en la sucursal, aunque exista modelo `cashBoxId`.

Impacto:

- Cobros y ventas pueden quedar asociados a una sesion/caja distinta a la seleccionada.
- Reportes por caja pueden ser incorrectos.

Correccion recomendada:

- Regla aplicada: una sesion abierta por caja.
- `POST /api/sales` requiere `cashBoxId`.
- Ventas y pagos buscan sesion por `branchId + cashBoxId + closingTime: null`.
- `cash/sessions/current.get.ts` no usa fallback legacy cuando se pide una caja concreta.

## Hallazgos P1

### 4. Endpoints cliente dependen de email en vez de una relacion formal

Archivos:

- `server/api/client/appointments.get.ts`
- `server/api/client/points.get.ts`
- `server/api/client/redeem.post.ts`
- `server/api/public/users/register.post.ts`
- `prisma/schema.prisma`

Estado: resuelto.

Resultado:

- `User.clientId` enlaza usuarios cliente con `Client`.
- Los endpoints de cliente resuelven por relacion formal y conservan fallback/backfill por email.
- El registro publico crea o reutiliza `Client` y guarda `clientId` en `User`.

Problema:

- Los endpoints de cliente resuelven el `Client` con `email: u.email`.
- `User(CLIENT)` y `Client` no tienen relacion formal.
- Registro publico crea/upsertea ambos, pero no guarda un vinculo.

Impacto:

- Si el usuario cambia email, puede perder acceso a puntos/turnos.
- Si dos registros se desincronizan por telefono/email, el portal cliente consulta datos incorrectos o no encuentra perfil.

Correccion recomendada:

- Agregar `User.clientId String? @unique` y relacion con `Client`.
- Actualizar `/api/me` para devolver `clientId`.
- Migrar endpoints client para usar `clientId`.
- Mantener fallback por email solo durante backfill.

### 5. MANAGER puede consultar o mutar datos fuera de sus sucursales en varios endpoints

Archivos representativos:

- `server/api/employees/index.get.ts`
- `server/api/clients/index.get.ts`
- `server/api/cash/sessions/index.get.ts`
- `server/api/cash/movements.post.ts`
- `server/api/calendar/events.get.ts`
- `server/api/stock/*`
- `server/api/sales/*`

Estado: mitigado en endpoints sensibles principales.

Resultado:

- Se agregaron helpers `getAllowedBranchIds`, `requireBranchAccess` y `requireClientAccess`.
- Se aplicaron en caja, ventas, stock, calendario, empleados, clientes y turnos principales.

Problema:

- Hay validaciones puntuales, pero no existe helper comun para asegurar que un `MANAGER` solo opere sucursales asignadas.
- Algunos endpoints piden `branchId`, pero no verifican que pertenezca al usuario manager.
- Otros listan datos globales.

Impacto:

- Riesgo de filtracion o modificacion entre sucursales.
- Es especialmente sensible en caja, ventas, clientes, stock y empleados.

Correccion recomendada:

- Crear helper server-side:
  - `requireBranchAccess(event, branchId)`
  - `getAllowedBranchIds(event)`
- Aplicarlo de forma uniforme a endpoints con `branchId`.
- Para listados sin `branchId`, managers deberian recibir solo datos de sus sucursales o exigir `branchId`.

### 6. `PATCH /api/appointments/:id` puede fallar si recibe `serviceIds`

Archivo:

- `server/api/appointments/[id].patch.ts`

Problema:

- Usa `appointmentUpdateSchema`, que permite `serviceIds`.
- Luego hace `prisma.appointment.update({ data: validation })`.
- `serviceIds` no es campo escalar de `Appointment`, por lo que Prisma puede fallar con argumento desconocido si el cliente lo envia.

Impacto:

- Endpoint de update parcial puede devolver 500 en vez de manejar actualizacion de servicios o rechazarla.

Correccion recomendada:

- Separar `serviceIds` del payload:
  - si no se soporta, rechazar con `badRequest('serviceIds update not supported')`;
  - si se soporta, actualizar `AppointmentService` en transaccion.

### 7. OWNER queda excluido de algunos endpoints que deberia poder usar

Archivos:

- `server/api/appointments/[id].patch.ts`
- `server/api/appointments/[id]/confirm.patch.ts`
- Otros endpoints con `requireRole(event, ['ADMIN', 'MANAGER'])`

Problema:

- La arquitectura trata `OWNER` como superuser.
- Algunos endpoints solo aceptan `ADMIN`/`MANAGER`.

Impacto:

- Un owner puede quedar bloqueado en operaciones normales de backoffice.

Correccion recomendada:

- Revisar todos los `requireRole` y estandarizar:
  - backoffice general: `OWNER`, `ADMIN`, `MANAGER`
  - configuracion sensible: `OWNER`, `ADMIN`
  - acciones exclusivas: documentarlas explicitamente.

### 8. Bloqueos de tiempo no validan acceso de manager a sucursal ni solapamientos

Archivos:

- `server/api/time-blocks/index.post.ts`
- `server/api/time-blocks/[id].delete.ts`

Problema:

- Usa `event.context.user` directo y `createError` ad hoc.
- Un `MANAGER` puede crear/eliminar blocks para cualquier `branchId`.
- No valida `endTime > startTime`.
- No valida que `professionalId` pertenezca a la sucursal.
- No valida solapamientos o duplicados.

Impacto:

- Un manager podria bloquear agenda de otra sucursal.
- Se pueden crear blocks invalidos o incoherentes.

Correccion recomendada:

- Migrar a `getAuthUser`, `requireRole`, `readBodyValidated`, helpers de error.
- Aplicar `requireBranchAccess`.
- Validar intervalos y relacion professional-branch.
- Decidir si se permiten solapamientos; si no, rechazar.

## Hallazgos P2

### 9. Landing configurable usa `v-html` sin sanitizacion server-side

Archivos:

- `pages/index.vue`
- `pages/private/backoffice/settings/landing.vue`
- `server/api/settings/landing.patch.ts`
- `server/api/public/landing.get.ts`

Problema:

- Admin/Owner puede guardar HTML libre hasta 50k.
- Public landing renderiza con `v-html`.

Impacto:

- Si una cuenta admin se compromete o se pega HTML no confiable, hay riesgo XSS publico.
- Puede ser una decision aceptada para CMS interno, pero debe quedar documentada y acotada.

Correccion recomendada:

- Sanitizar HTML al guardar o al renderizar.
- Si se permite HTML completo, documentar que es trusted-admin HTML y agregar advertencia en UI.
- Como minimo, considerar whitelist de tags/attrs.

### 10. Inconsistencia de errores y validacion en handlers nuevos/viejos

Archivos representativos:

- `server/api/time-blocks/*`
- `server/api/public/availability/index.get.ts`
- `server/api/employees/[id].patch.ts`
- `server/api/me.patch.ts`
- `server/api/me/password.post.ts`
- `server/api/cashboxes/index.post.ts`

Problema:

- Parte del codigo usa helpers compartidos (`badRequest`, `notFound`, `conflict`).
- Parte sigue usando `createError` directo.
- Algunas validaciones usan `readBody` + `safeParse`, otras `readBodyValidated`.

Impacto:

- Respuestas inconsistentes.
- Mas dificil agregar tests y manejar errores desde UI.

Correccion recomendada:

- Migrar progresivamente a:
  - `readBodyValidated`
  - `requireParam`
  - `requireQueryString`
  - helpers de `server/utils/errors.ts`.

### 11. Uso extendido de `any` tapa errores de contrato

Archivos representativos:

- `pages/private/backoffice/calendar.vue`
- `pages/private/backoffice/sales.vue`
- `components/BookingWizard.vue`
- `server/api/calendar/events.get.ts`
- `server/api/client/redeem.post.ts`

Problema:

- Hay muchos `any` y casts `as any` en contratos API/UI.
- Algunos bugs encontrados, como `workerId` vs `barberId`, pasan desapercibidos por falta de tipos compartidos.

Impacto:

- Cambios de API pueden romper UI sin feedback de TypeScript.

Correccion recomendada:

- Tipar respuestas clave:
  - disponibilidad publica,
  - eventos calendario,
  - ventas/caja,
  - appointment summaries.
- Extraer tipos compartidos simples donde haya alto trafico UI/API.

### 12. Build depende parcialmente de providers remotos de fuentes/iconos

Validacion:

- `npm run build` completo exitoso.
- Warnings por fetch fallido a providers remotos.

Impacto:

- En CI sin red puede haber ruido o fallos si algun provider deja de degradar bien.

Correccion recomendada:

- Configurar icon/font provider local de forma explicita.
- Documentar que esos warnings son esperados o eliminarlos.

## Orden recomendado de correccion

1. Corregir disponibilidad publica `workerId`/`barberId`.
2. Cerrar escalada de roles en empleados.
3. Corregir caja/cashbox en ventas y pagos.
4. Agregar helper `requireBranchAccess` y aplicarlo a endpoints con `branchId`.
5. Formalizar `User.clientId`.
6. Corregir `PATCH /api/appointments/:id` con `serviceIds`.
7. Normalizar time-blocks con helpers comunes y validaciones.
8. Decidir politica de sanitizacion para landing HTML.
9. Reducir `any` en contratos de alto riesgo.
10. Limpiar warnings de build remotos.

## Notas

- Esta revision no reemplaza tests. Marca riesgos encontrados por lectura estatica y una corrida de build.
- No se ejecuto `npm run sanity` porque requiere base de datos preparada.
- No hay `npm test` definido en `package.json`.
