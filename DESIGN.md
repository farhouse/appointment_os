---
name: BarberOS
description: Operaciones de servicios, precisas y claramente visibles.
colors:
  primary: "#2563EB"
  ink: "#17233C"
  success: "#2D7D68"
  warning: "#B66A16"
  danger: "#D45A55"
  canvas: "#F6F8FB"
  surface: "#FFFFFF"
  border: "#D9E1EA"
  muted: "#627087"
typography:
  display:
    fontFamily: "ui-serif, Georgia, Cambria, Times New Roman, serif"
    fontSize: "40px"
    fontWeight: 600
    lineHeight: 1.05
  body:
    fontFamily: "ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.45
  label:
    fontFamily: "ui-sans-serif, system-ui, sans-serif"
    fontSize: "12px"
    fontWeight: 600
    lineHeight: 1.3
rounded:
  sm: "4px"
  md: "6px"
  lg: "8px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "24px"
  2xl: "32px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.surface}"
    rounded: "{rounded.md}"
    padding: "8px 12px"
  panel:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
    padding: "16px"
---

# Design System: BarberOS

## Overview

**Creative North Star: "La jornada en claro"**

BarberOS se siente como una herramienta de trabajo precisa que fue cuidada hasta el ultimo detalle. La interfaz es luminosa, compacta y familiar; su caracter premium aparece en la proporcion, la tipografia y la calidad de los estados, no en adornos ni efectos de lujo.

La agenda es el gesto distintivo del sistema. El tiempo, los profesionales y el estado de cada atencion deben comprenderse de un vistazo. El resto de la interfaz acompana esa operacion con una estructura serena, bordes finos y superficies tonales discretas.

**Key Characteristics:**
- Densidad operativa con lectura inmediata.
- Superficies claras, tinta azul profunda y color funcional moderado.
- Calendarios y tablas como estructuras principales, no como contenido encerrado en tarjetas.
- Acabado premium sobrio y accesible.

## Colors

La estrategia es restringida: neutros frios y calidos equilibrados, azul mineral para acciones y estados semanticos reservados.

### Primary
- **Azul Mineral** (`#2563EB`): acciones principales, foco y seleccion activa. Nunca debe dominar una pantalla completa.
- **Tinta Profunda** (`#17233C`): navegacion, titulos y controles de alta jerarquia.

### Secondary
- **Eucalipto Operativo** (`#2D7D68`): confirmaciones, progreso saludable y estados completados.

### Tertiary
- **Coral de Alerta** (`#D45A55`): errores y alertas que requieren accion; usarlo en areas pequenas.
- **Ambar de Atencion** (`#B66A16`): demoras, riesgos y estados en curso.

### Neutral
- **Lienzo Claro** (`#F6F8FB`): fondo principal.
- **Superficie Blanca** (`#FFFFFF`): areas de trabajo y controles.
- **Linea Mineral** (`#D9E1EA`): divisores, grillas y limites.
- **Texto Secundario** (`#627087`): metadatos y ayuda.

**The Functional Color Rule.** Todo color saturado debe comunicar accion, seleccion o estado; nunca funciona como relleno decorativo.

## Typography

**Display Font:** `ui-serif, Georgia, Cambria, "Times New Roman", serif`
**Body Font:** `ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`

**Character:** Los encabezados editoriales dan identidad a momentos de orientacion, mientras la sans del sistema conserva velocidad y claridad en controles, datos y tareas repetitivas.

### Hierarchy
- **Display** (600, `40px`, 1.05): fecha o contexto principal de una vista; una sola vez por pantalla.
- **Headline** (650, `24px`, 1.2): titulo de pagina cuando no corresponde un display editorial.
- **Title** (650, `16px`, 1.3): secciones, paneles y encabezados de tabla.
- **Body** (400, `14px`, 1.45): contenido operativo y formularios.
- **Label** (600, `12px`, 1.3): etiquetas compactas, estados y metadatos; sin espaciado negativo.

**The One Editorial Moment Rule.** La serif aparece en un unico punto de orientacion por pantalla; datos, controles y navegacion permanecen en sans.

## Layout

El escritorio usa una barra lateral estable, una barra superior compacta y un area de trabajo fluida. La agenda, tabla o formulario principal recibe la mayor superficie; alertas y acciones secundarias ocupan una columna lateral cuando el ancho lo permite.

La grilla base sigue incrementos de `4px`, con espacios recurrentes de `8px`, `12px`, `16px`, `24px` y `32px`. En tablet la columna auxiliar pasa debajo del contenido principal. En movil la navegacion se compacta, las metricas se desplazan horizontalmente cuando sea necesario y la agenda conserva su eje temporal sin comprimir texto hasta volverlo ilegible.

**The Work Surface Rule.** Una pantalla tiene una superficie operativa dominante. Los indicadores y acciones la rodean; no compiten con ella mediante una coleccion de tarjetas equivalentes.

## Elevation & Depth

El sistema es plano por defecto. La profundidad se comunica con cambios tonales y bordes de un pixel; las sombras quedan reservadas para menus, dialogos y elementos que realmente flotan sobre el trabajo.

**The Flat at Rest Rule.** Ningun contenedor permanente necesita sombra para ser reconocible.

## Shapes

Los controles y superficies usan esquinas suavemente rectas: `4px` en campos y chips, `6px` en botones y `8px` como maximo en paneles. Los estados se distinguen mediante color, icono y texto; no mediante siluetas decorativas.

## Do's and Don'ts

### Do:
- **Do** dar prioridad espacial a agenda, tabla o formulario que materializa el trabajo actual.
- **Do** usar lineas finas, alineacion y fondos tonales para agrupar informacion densa.
- **Do** mantener visibles tiempo, profesional y estado en cada turno.
- **Do** combinar color, icono y etiqueta textual para comunicar estados.

### Don't:
- **Don't** convertir cada dato o accion en una tarjeta redondeada independiente.
- **Don't** usar gradientes, vidrio, brillos o decoracion abstracta.
- **Don't** llevar la interfaz hacia una estetica clinica ni hacia lujo ostentoso.
- **Don't** usar lenguaje o imagenes que limiten el producto a barberias.
