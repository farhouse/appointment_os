# Barber OS — Raptor Audit Triage (Depurado)

Fecha: 2026-02-28
Fuente: `raptor-improvements.md`

Objetivo: separar ruido de pendientes reales para ejecutar solo trabajo útil.

---

## Criterio de clasificación
- **Descartar:** falso positivo / ya cubierto suficientemente.
- **Parcialmente hecho:** hay avances, pero queda un borde importante.
- **Pendiente real:** riesgo activo, conviene implementar.

---

## 1) DESCARTAR (ya resuelto o no prioritario ahora)

### A. “Overlap checks en create/move admin”
- **Estado:** ✅ ya implementado.
- **Evidencia:** commits de tareas #2 del plan Grok.
- **Nota:** no confundir con **public booking create**, que sí sigue pendiente.

### B. “Role checks inconsistentes en endpoints barber principales”
- **Estado:** ✅ normalizados en Task #5.
- **Nota:** puede quedar algún endpoint aislado, pero el núcleo marcado por Grok ya se trató.

### C. “Hardcoded strings en private layout”
- **Estado:** ✅ resuelto en Task #4.

### D. “Calendar color/status base no implementado”
- **Estado:** ✅ resuelto (clases por estado + fix de `class` en Vue Cal).

---

## 2) PARCIALMENTE HECHO (revisar fino)

### A. Permisos OWNER/ADMIN/MANAGER en flujos de confirmación
- **Situación:** hubo normalización de `requireRole`, pero Raptor detecta posible desalineación puntual (ej. OWNER en confirm).
- **Decisión:** revisar endpoint por endpoint de appointments confirm/status con matriz explícita.
- **Prioridad:** Media.

### B. i18n/copy en páginas manager/client
- **Situación:** se avanzó bastante, pero siguen textos hardcodeados en modales/labels puntuales.
- **Decisión:** barrido final de copy/i18n en páginas calientes (calendar, cash, client index/appointments).
- **Prioridad:** Media-Baja.

### C. Cash closing balance (regla contable)
- **Situación:** bloque de caja mejoró; posible ambigüedad en qué representa `closingBalance` vs totales por medio.
- **Decisión:** documentar regla y alinear UI/API (suma total vs efectivo arqueado separado).
- **Prioridad:** Media.

---

## 3) PENDIENTES REALES (accionables)

### 1) Overlap en **public booking create** ✅ DONE
- **Severidad:** High
- **Problema:** `/api/public/appointments/index.post.ts` puede crear turno sin guardia final de solape (race entre disponibilidad y creación).
- **Fix recomendado:** repetir validación de solape en el create público dentro de transacción antes de persistir.
- **Archivos:**
  - `server/api/public/appointments/index.post.ts`
  - (opcional helper compartido con admin create/move)
- **Done commit:** `4863901`
 - **Estado:** ✅ hecho (commit: TBD)

### 2) Validar sesión de caja abierta en flujo de cobro (UX + backend coherente) ✅ DONE
- **Severidad:** High
- **Problema:** modal de cobro puede dejarte intentar pagar y fallar tarde por sesión/caja.
- **Fix recomendado:** precheck de sesión abierta por branch/cashbox + mensaje claro “Abrí caja primero”.
- **Archivos:**
  - `pages/private/backoffice/calendar.vue`
  - `server/api/cash/sessions/current.get.ts`
  - `server/api/appointments/[id]/status.patch.ts`
- **Done commit:** `$HASH`

### 3) Unificar estrategia de horarios/timezone (booking vs calendar)
- **Severidad:** Medium-High
- **Problema:** diferencias de ventanas horarias y parseo de fechas pueden generar percepción de slots faltantes o desfasados.
- **Fix recomendado:**
  - centralizar horario operativo por sucursal,
  - normalizar UTC en backend + conversión explícita para UI.
- **Archivos:**
  - `components/BookingWizard.vue`
  - `server/api/public/availability/index.get.ts`
  - `pages/private/backoffice/calendar.vue`

### 4) Enlace fuerte User↔Client (evitar “profile missing” por email)
- **Severidad:** Medium
- **Problema:** dependencia en match por email/teléfono puede romper historial/puntos.
- **Fix recomendado:** FK explícita (`clientId` en user o `userId` en client) + migración + fallback de compatibilidad.
- **Archivos:**
  - `prisma/schema.prisma`
  - `server/api/client/*`
  - `server/api/public/users/register.post.ts`

### 5) Cierre de caja: definición única de balance final
- **Severidad:** Medium
- **Problema:** posible confusión entre balance total multi-medio y arqueo efectivo.
- **Fix recomendado:**
  - definir contrato de `closingBalance`,
  - si es total, sumar medios; si no, separar `closingCash` y `closingTotal`.
- **Archivos:**
  - `server/api/cash/sessions/[id]/close.post.ts`
  - `pages/private/backoffice/cash.vue`

---

## Top 5 next actions (recomendado)
1. Public booking create overlap guard (transaccional).
2. Cobro en calendario: precheck sesión abierta + UX de bloqueo.
3. Timezone/hours unificados entre booking y calendar.
4. Link estructural User↔Client (migración controlada).
5. Regla contable final de cierre de caja documentada y aplicada.

---

## Prompt sugerido para OpenCode (pendientes reales)
"Aplicá únicamente los pendientes reales de `raptor-improvements-prioritized.md` en orden 1→5, una tarea por commit, sin refactors no relacionados, con `npm run build` al final de cada tarea y resumen de riesgo residual."
