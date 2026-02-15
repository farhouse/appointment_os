# Barber OS — Faltantes / Próximos pasos

> Estado al 2026-02-15.

## Bloqueante actual
### Admin/Manager CRUD con UTable (delegado a OpenCode)
Objetivo: reemplazar placeholders en manager/admin con CRUD completo (UTable + modales + delete).
Páginas objetivo:
- `pages/private/manager/products.vue`
- `pages/private/manager/stock.vue`
- `pages/private/manager/employees.vue`

Checklist por página:
- [ ] Listado con `UTable` (loading/empty/error)
- [ ] Search + sort
- [ ] Paginación
- [ ] Acciones por fila: Edit / Delete
- [ ] Create/Edit modal (UForm + zod)
- [ ] Delete confirm
- [ ] Refetch/optimistic update
- [ ] Endpoints server/api si faltan
- [ ] Enforce roles server-side (OWNER/ADMIN/MANAGER)

Referencia: `docs/admin-crud-utables.md`

## Auth / i18n (hecho, pero vigilar)
- i18n: lazy locales por archivos JSON. Asegurar que en prod/containers se resuelva bien (`i18nDir: 'i18n'`).
- login redirect: se corrigió redirect encoding + cookie forward SSR.

## Booking
- `/book` implementado como wizard progresivo.
- `/private/client/book` reusa el wizard.

Pendientes posibles:
- [ ] En privado, decidir si branch depende del selector global o se elige dentro del wizard.
- [ ] Después de booking exitoso: limpiar formulario / redirigir a “Mis turnos”.

## UX / UI
- [ ] Unificar estilos de forms y tablas (componentes reutilizables).
- [ ] Toasts consistentes.

## Infra/Dev
- OpenCode:
  - [ ] OpenRouter key limit exceeded (si volvemos a usar openrouter/*).
  - [ ] PATH debe incluir `/usr/sbin` para que exista `sysctl` (Bun).

## Repo hygiene
- [ ] Commit del doc `docs/admin-crud-utables.md` (actualmente untracked en git).
- [ ] Revisar qué hay dentro de `scripts/` (aparece como untracked) y decidir si se agrega o se borra.
