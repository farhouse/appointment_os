# OpenCode task — Barber OS (next batch)

Objetivo: ejecutar el próximo batch de mejoras de `TRACKER.md` de forma incremental, con criterios de aceptación claros y sin refactors innecesarios.

## Reglas (importante)
- No hacer refactors grandes sin necesidad.
- Commits pequeños por ítem (1 problema = 1 commit lógico).
- Si hay ambigüedad funcional, pausar y preguntar.
- Roles/permisos siempre en UI + API.
- Mantener compatibilidad con Nuxt 4 + Prisma actual.

## Estado actual (contexto)
- P0 del batch anterior está **cerrado en `fix/batch-a`**:
  - Employees save
  - Branch selector
  - Barber today

## Orden sugerido (prioridad)
1) Client appointments: tabs/filtro próximos vs pasados.
2) Backoffice split: staff (`employees`) vs `clients`.
3) Manager permissions: bloquear create/update/delete productos/servicios.
4) Calendar manager/admin: mover turno (modal + drag&drop) con persistencia.
5) Calendar resources separators: zebra + divider.
6) Tech hygiene: remover `version:` obsoleto de `docker-compose.yml`.

## Detalles por ítem (acceptance criteria)

### 1) Client / Upcoming shows past
Expected:
- En `/private/client/appointments`, tabs funcionan correctamente.
- “Próximos” muestra `startTime >= now`.
- “Pasados” muestra `startTime < now`.
- Evitar mezcla por estados cancelados/no_show según regla actual de negocio.

Archivos probables:
- `pages/private/client/appointments.vue`
- `server/api/client/appointments.get.ts` (si aplica)

### 2) Staff vs Clients split (Backoffice)
Expected:
- `/private/backoffice/employees` muestra solo staff interno (OWNER/ADMIN/MANAGER/BARBER).
- Nueva página `/private/backoffice/clients` para CRUD de `Client`.
- Navegación y permisos consistentes.

Archivos probables:
- `pages/private/backoffice/employees.vue`
- `pages/private/backoffice/clients.vue` (nuevo)
- `server/api/clients/*`
- navegación/layout de backoffice

### 3) Manager permissions on Products/Services
Expected:
- Manager puede ver, pero no crear/editar/eliminar productos/servicios.
- UI sin botones de mutación para manager.
- API valida rol (OWNER/ADMIN para mutaciones).

Archivos probables:
- páginas manager/backoffice de products/services
- endpoints `server/api/products/*`, `server/api/services/*`

### 4) Calendar move + drag&drop persist
Expected:
- Modal de appointment con acción “Mover turno” (fecha/hora).
- Drag&drop persistente con confirmación.
- Aplica en Manager + Admin/Owner.
- Feedback visual y manejo de error.

Archivos probables:
- `pages/private/backoffice/calendar.vue`
- endpoint `server/api/appointments/[id]/move.patch.ts`

### 5) Calendar resources separators
Expected:
- Mejor legibilidad por recurso (barbero):
  - fondo alternado (zebra suave)
  - separación vertical (divider)
- Sin romper responsive.

Archivos probables:
- estilos y vista de calendario backoffice/manager

### 6) Tech hygiene — docker-compose
Expected:
- Quitar `version:` de `docker-compose.yml` para eliminar warning deprecado.
- `docker compose --profile dev up -d` sigue funcionando.

Archivo:
- `docker-compose.yml`

## Validación mínima al cerrar batch
- `npm run build` (o equivalente sin errores funcionales).
- Smoke manual rápido:
  - login por rol manager/client
  - tabs client appointments
  - permisos manager en products/services
  - mover turno en calendario

## Entorno / comandos útiles
- Dev: `docker compose --profile dev up -d`
- Logs: `docker compose --profile dev logs -f app-dev`
- Restart app: `docker compose --profile dev restart app-dev`
