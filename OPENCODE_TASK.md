# OpenCode task — Barber OS

Objetivo: ejecutar mejoras/correcciones listadas en `TRACKER.md` de manera segura, incremental y verificable.

## Reglas (importante)
- No hacer refactors grandes sin necesidad.
- Cada cambio debe tener criterio de aceptación (ver abajo) y dejar la app funcionando.
- Preferir PR/commits pequeños por feature/bug.
- Si hay ambigüedad, **preguntar** antes de implementar.
- Roles/permissions siempre validados en **UI + API**.

## Orden sugerido (prioridad)
### P0 — Bloqueantes
1) Backoffice/Employees: editar empleado → botón Guardar no persiste.
2) Branch selector (layout): volvió a no dejar seleccionar sucursal.
3) Barber Today: `/private/barber/today` no muestra turnos del barbero.

### P1/P2 — Booking
4) Booking: branch select mostrar dirección.
5) Booking: email requerido (UI + server).
6) Booking: done screen + ICS download.

### P2 — Manager
7) Calendar: modal con más info + mover turno (endpoint move) + drag&drop persiste.
8) Calendar: resources separators (zebra + divider).

## Detalles por ítem (acceptance criteria)

### 1) Backoffice/Employees — Guardar no funciona
- Repro: editar empleado existente, click Guardar.
- Expected:
  - dispara submit del form
  - hace PATCH `/api/employees/:id`
  - cierra modal + toast success
  - al recargar lista, se ven cambios.

Archivos probables:
- `pages/private/backoffice/employees.vue`
- `server/api/employees/[id].patch.ts`

### 2) Branch selector — no deja seleccionar
Expected:
- al cambiar sucursal en selector del layout, se actualiza cookie/state y las páginas reaccionan.
- no se “pisa” la selección por re-init.

Archivos:
- `layouts/private.vue`
- `composables/useSelectedBranch.ts`

### 3) Barber Today — calendar vacío
Expected:
- `today` muestra appointments del barber logueado y coincide con `/private/barber/appointments`.

Archivos:
- `pages/private/barber/today.vue`
- endpoints usados por barber.

### 4) Booking branch select con dirección
Expected:
- opciones: `Nombre — Dirección` (si existe)
- mobile OK.

Archivo:
- `components/BookingWizard.vue`

### 5) Booking email requerido
Expected:
- UI bloquea submit sin email (mensaje claro)
- server rechaza si falta.

Archivos:
- `components/BookingWizard.vue`
- `server/api/public/clients/index.post.ts` / `server/api/public/appointments/index.post.ts`

### 6) Booking done screen + ICS
Expected:
- al crear appointment → redirect a `/book/done?...`
- done screen muestra resumen
- botón descarga `.ics` válido
- TZ: America/Argentina/Buenos_Aires
- Title: `Turno — <Servicio> (<Barbero>)`
- Location: `<Sucursal> — <Dirección>`

Archivos:
- `components/BookingWizard.vue`
- `pages/book/done.vue` (nuevo)
- `server/api/public/appointments/[id]/calendar.ics.get.ts` (nuevo)

### 7) Calendar move + drag
Expected:
- modal tiene acción mover turno (fecha/hora) y persiste
- drag&drop mueve y persiste (con confirmación)
- aplica a Manager + Admin/Owner

Archivos:
- `pages/private/backoffice/calendar.vue`
- (calendar manager)
- `server/api/appointments/[id]/move.patch.ts`

### 8) Calendar resources separators
Decision:
- zebra suave por resource + divider entre columnas

Expected:
- mejora legibilidad, no rompe responsive

## Entorno / Comandos útiles
- Dev: `docker compose --profile dev up -d`
- App logs: `docker compose --profile dev logs -f app-dev`
- Restart: `docker compose --profile dev restart app-dev`

## Definiciones rápidas
- Venta/movimientos/caja: no tocar en este batch salvo que sea necesario para P0.

