# Barber OS — Tracker (shortlist)

> Estado rápido y accionable. Solo pendientes activos.
> Leyenda: `todo | doing | blocked | done`

## NEXT (prioridad alta)
- [ ] (todo) **Landing configurable desde Settings (MVP)**
  - Alcance: hero (título/subtítulo), CTA principal, beneficios, imagen.
  - Entrega: panel en Settings + persistencia DB + consumo en home pública con fallback.

- [ ] (todo) **Generalización de dominio: Barber → Worker**
  - Fase 1: copy/UI/i18n (sin romper nada).
  - Fase 2: alias API (`/workers` compatible con `/barbers`).
  - Fase 3: renombre interno progresivo (modelo/campos).

- [x] (done) **Client profile editable + cambio de password**
  - Resultado: `/private/profile` ahora permite editar nombre/email/teléfono y cambiar contraseña con validaciones básicas.
  - Files: `pages/private/profile.vue`, `server/api/me.patch.ts`, `server/api/me/password.post.ts`.

- [ ] (todo) **Cliente: fotos de cortes (máx 3)**
  - Upload + preview + delete + storage local docker + metadata en DB.

## MANAGER / CALENDAR / CASH (pendientes)
- [ ] (todo) **Calendar resources separators**
  - Zebra suave por columna/resource + divisores visuales.

- [ ] (todo) **Caja: revisar flujo abrir→cerrar→cobrar**
  - Definir regla cuando caja está cerrada y llega cobro.

- [ ] (todo) **Módulo de Venta (venta directa fuera del turno)**
  - Requiere sucursal + caja abierta + descuento de stock + movimiento de caja.

## BARBER APP (pendientes)
- [ ] (todo) **Barber finances** (totales + comisión fija por barbero)
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
