# Auditoria visual Impeccable

Fecha: 2026-09-30

## Alcance y evidencia

Auditoria tecnica de `pages/`, `components/`, `layouts/` y `assets/css/` contra `DESIGN.md` y `.impeccable/design.json`.

- Detector Impeccable ejecutado sobre todo el frontend.
- Revision estatica de accesibilidad, formularios, controles, tokens, estados y responsive.
- `npm run typecheck`: correcto.
- El cliente y el servidor de produccion compilaron. El proceso termino luego con `EACCES` al intentar reemplazar `.output`, que pertenece al contenedor; no fue un error de Vue o TypeScript.
- No se pudieron obtener capturas: el navegador abierto no esta expuesto a las herramientas de auditoria. Los hallazgos visuales se limitan a evidencia verificable en codigo.

## Resultado posterior a las correcciones

| Dimension | Antes | Ahora | Resultado |
|---|---:|---:|---|
| Accesibilidad | 2/4 | 3/4 | Formularios, acciones iconograficas y dialogo del trabajador corregidos. |
| Performance | 3/4 | 3/4 | Imagen hero optimizada a 455 KB; el bundle general no fue reestructurado. |
| Responsive | 2/4 | 3/4 | Lista tactil movil, objetivos de 44 px y alturas adaptativas. |
| Theming | 2/4 | 4/4 | Detector sin hallazgos y escala heredada redirigida a tokens vigentes. |
| Integridad | 2/4 | 4/4 | Experiencia publica multiservicio y componentes compartidos alineados. |
| **Total** | **11/20** | **17/20** | **Bueno: listo para validacion visual humana.** |

Estado de los hallazgos originales: **9 resueltos, 0 pendientes de codigo**.

- [x] Etiquetas programaticas en formularios criticos.
- [x] Dialogo accesible y acciones iconograficas nombradas.
- [x] Objetivos tactiles y seleccion de horarios en movil.
- [x] Componentes compartidos y neutros heredados consolidados.
- [x] Landing y reserva adaptadas al posicionamiento multiservicio.
- [x] Geometria de agendas adaptativa.
- [x] Estados de agenda integrados al sistema visual.
- [x] Texto operativo llevado a la escala tipografica.
- [x] Preview de email alineado a tipografia y color.

Verificacion final:

- Detector Impeccable completo: **0 hallazgos primarios, 0 advisories**.
- `npm run typecheck`: correcto.
- `npm run build`: correcto, cliente y servidor Nitro generados.
- `git diff --check`: correcto.
- Colecciones `lucide` y `heroicons`: instaladas localmente y empaquetadas por Nuxt Icon.
- Contenedor dev recreado; `/`, `/book` y `/login` responden HTTP 200 en el puerto 3001.
- Render automatizado desktop/movil: no disponible porque el entorno no pudo iniciar su navegador. La lista movil y los breakpoints se verificaron por implementacion y compilacion, no mediante gesto tactil sintetizado.

## Puntaje de referencia inicial

| Dimension | Puntaje | Hallazgo principal |
|---|---:|---|
| Accesibilidad | 2/4 | Formularios y acciones iconograficas sin nombre programatico consistente. |
| Performance | 3/4 | No hay animaciones costosas evidentes; el CSS inicial compilado es amplio. |
| Responsive | 2/4 | Agendas con alturas fijas y objetivos tactiles menores a 44 px. |
| Theming | 2/4 | El sistema nuevo convive con estilos `stone/gray`, dark mode residual y sombras. |
| Integridad | 2/4 | La direccion aprobada es coherente en las vistas nuevas, pero aun no gobierna toda la aplicacion. |
| **Total** | **11/20** | **Aceptable: necesita una pasada sistemica antes de produccion.** |

## Veredicto de integridad

Antes de las correcciones, el sistema visual no estaba completamente consolidado. El shell privado, login, dashboard y las configuraciones recientemente revisadas ya expresaban una herramienta operativa precisa, pero los componentes compartidos heredados y varias superficies publicas seguian usando otro lenguaje visual.

Conteo priorizado: **0 P0, 3 P1, 4 P2, 2 P3**.

## Hallazgos

### P1 - Campos sin etiqueta programatica

**Ubicacion:** `components/BookingWizard.vue:627`, `components/AppointmentCreateModal.vue:342`, `pages/private/backoffice/settings/email.vue:215`, `pages/private/backoffice/cash.vue:814`.

Hay etiquetas visuales sin `for`/`id`, campos identificados solo por placeholder y textareas sin nombre accesible. Esto dificulta completar reservas y operaciones con lector de pantalla, y reduce el area clickeable de las etiquetas.

**Estandar:** WCAG 1.3.1 y 3.3.2.  
**Recomendacion:** usar `UFormField` o pares `label[for]` + `id` en todos los campos.  
**Comando sugerido:** `$impeccable harden`.

### P1 - Dialogos y botones iconograficos incompletos

**Ubicacion:** `pages/private/worker/today.vue:312`, `pages/private/worker/today.vue:322`, `components/AppointmentCreateModal.vue:361`, `pages/private/backoffice/sales.vue:468`, `pages/private/backoffice/calendar.vue:922`.

El detalle de turno del trabajador es un dialogo construido con `div` sin semantica, foco inicial ni bloqueo/restauracion de foco. Varias acciones muestran solo un icono y no tienen `aria-label`; los cierres usan el caracter `x` como unica señal.

**Estandar:** WCAG 2.1.1, 2.4.3 y 4.1.2.  
**Recomendacion:** migrar dialogos manuales a `UModal` y nombrar cada accion iconografica.  
**Comando sugerido:** `$impeccable harden`.

### P1 - Objetivos tactiles demasiado pequenos

**Ubicacion:** `components/BookingWizard.vue:556`, `components/BookingWizard.vue:778`, `pages/private/worker/today.vue:252`, `pages/private/backoffice/cash.vue:814`.

Chips con `py-1/py-1.5`, filtros `text-xs` y turnos cuya altura minima es 18 px quedan muy por debajo de 44 x 44 px. En movil esto aumenta errores al elegir servicio, horario o fecha.

**Estandar:** WCAG 2.5.8.  
**Recomendacion:** mantener 44 px de area interactiva aunque la representacion de agenda sea mas compacta.  
**Comando sugerido:** `$impeccable adapt`.

### P2 - Dos sistemas visuales conviven en componentes compartidos

**Ubicacion:** `components/CrudTableShell.vue:19`, `components/CrudTableShell.vue:38`, `components/CrudState.vue:14`, `layouts/default.vue:2`.

Se encontraron 39 archivos con la paleta heredada `stone/gray`, 20 con sombras persistentes y restos de un modo oscuro marron que ya no tiene selector. Como estos estilos viven en componentes compartidos, el desvio se replica en CRUDs y estados vacios.

**Impacto:** la aplicacion cambia de identidad entre rutas y se percibe como una migracion incompleta.  
**Recomendacion:** corregir primero los componentes compartidos y luego las excepciones locales.  
**Comando sugerido:** `$impeccable colorize`.

### P2 - La experiencia publica sigue limitada al producto anterior

**Ubicacion:** `pages/index.vue:10`, `pages/index.vue:20`, `layouts/default.vue:2`, `components/BookingWizard.vue:485`.

La landing de respaldo conserva imagen de barberia, estructura de tarjetas con sombra, bordes grandes y paleta crema/marron. Esto contradice el posicionamiento multiservicio y el sistema aprobado. El flujo de reserva tambien mantiene gran parte de esa estetica.

**Impacto:** el primer contacto del cliente no coincide con el backoffice ni con el alcance actual del producto.  
**Recomendacion:** adaptar landing publica, layout publico y reserva como un unico bloque.  
**Comando sugerido:** `$impeccable shape`.

### P2 - Geometria rigida en agendas

**Ubicacion:** `components/BookingWizard.vue:748`, `pages/private/worker/today.vue:295`, `pages/private/backoffice/calendar.vue:709`.

Las agendas usan alturas fijas de 520/560 px y el calendario de backoffice exige al menos 600 px. El dashboard usa una grilla minima de 760 px con scroll intencional. Sin capturas moviles no se confirma desborde, pero el codigo obliga a una revision especifica en 390 x 844 y con texto ampliado.

**Impacto:** riesgo de doble scroll, acciones fuera del viewport y perdida de contexto en pantallas pequenas.  
**Recomendacion:** definir alturas con `clamp()`/viewport disponible y verificar scroll horizontal deliberado.  
**Comando sugerido:** `$impeccable adapt`.

### P2 - Estados de agenda fuera del sistema

**Ubicacion:** `assets/css/main.css:6`, `pages/private/worker/today.vue:408`, `pages/private/backoffice/calendar.vue:1115`.

Los estados usan cuatro bordes laterales gruesos y colores no documentados. Impeccable marco cuatro `side-tab` y varios desvíos de color. La regla aprobada pide color funcional moderado y bordes finos.

**Impacto:** agenda y dashboard comunican los mismos estados con lenguajes distintos.  
**Recomendacion:** centralizar una paleta de estados y usar fondo, icono y etiqueta, no una banda lateral de 3-4 px.  
**Comando sugerido:** `$impeccable colorize`.

### P3 - Texto operativo por debajo de la escala

**Ubicacion:** `components/BookingWizard.vue:520`, `components/BookingWizard.vue:757`, `pages/private/backoffice/cash.vue:785`, `pages/private/backoffice/index.vue:169`.

Hay etiquetas de 10 y 11 px fuera de la escala de `DESIGN.md`. Aunque son metadatos, pierden legibilidad en pantallas densas.

**Recomendacion:** elevarlas a 12 px y conservar densidad con espaciado.  
**Comando sugerido:** `$impeccable typeset`.

### P3 - Plantilla de email fuera de tipografia y color

**Ubicacion:** `pages/private/backoffice/settings/email.vue:49`.

El estado vacio del preview usa Arial y `#666`, ambos fuera del sistema. Es un desvio aislado y de bajo impacto.

**Recomendacion:** usar la pila sans y `#627087`.  
**Comando sugerido:** `$impeccable polish`.

## Aspectos positivos

- `DESIGN.md` y su sidecar definen una direccion concreta, tokens y reglas comprobables.
- El shell privado nuevo mantiene contraste, foco visible, navegacion movil y superficies planas.
- Landing administrativa y novedades/promociones pasan el detector sin hallazgos.
- Las imagenes publicas existentes usan `alt` y carga diferida.
- El flujo de reserva modela sus selectores como `radiogroup`/`radio`, una buena base semantica.
- TypeScript y Vue pasan la comprobacion de tipos.

## Orden recomendado

1. **P1 `$impeccable harden`:** etiquetas, nombres accesibles y dialogos con foco correcto.
2. **P1 `$impeccable adapt`:** objetivos tactiles y agendas en movil.
3. **P2 `$impeccable colorize`:** consolidar tokens en CRUDs y estados de agenda.
4. **P2 `$impeccable shape`:** llevar landing publica y reserva al posicionamiento multiservicio.
5. **P3 `$impeccable typeset`:** eliminar texto de 10/11 px.
6. **P3 `$impeccable polish`:** pasada final y nueva auditoria con capturas.

