# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Los usuarios principales son propietarios, administradores y encargados de negocios de servicios con agenda, incluyendo barberias, peluquerias, podologia, salones de unas y rubros similares. Necesitan coordinar la operacion diaria de una o varias sucursales desde un unico sistema.

Los trabajadores usan una experiencia enfocada en su agenda, horarios, clientes e ingresos. Los clientes reservan servicios y consultan sus turnos, datos y beneficios.

## Product Purpose

Centralizar la operacion de negocios que atienden clientes mediante turnos: reservas, disponibilidad, personal, sucursales, clientes, servicios, productos, stock, ventas, caja, pagos y fidelizacion.

El producto tiene exito cuando reduce la coordinacion manual, evita inconsistencias operativas y permite que cada rol complete su trabajo cotidiano con informacion clara y actualizada.

## Positioning

La propuesta no se limita a ofrecer reservas. Conecta la agenda con la operacion comercial y administrativa de cada sucursal: disponibilidad real, atencion, cobro, venta, stock, historial del cliente y beneficios forman parte del mismo flujo.

## Operating Context

- Negocios presenciales de servicios que trabajan con turnos y profesionales.
- Operacion desde escritorio, tablet o navegador movil.
- Una o varias sucursales con personal asignado.
- Uso diario repetitivo por administradores y trabajadores durante la atencion.
- Reserva publica y autoservicio del cliente fuera del horario comercial.

## Capabilities and Constraints

- Roles persistidos: `OWNER`, `ADMIN`, `MANAGER`, `BARBER` y `CLIENT`.
- La interfaz usa el termino generico Worker, aunque `BARBER` y `professionalId` se conservan internamente por compatibilidad.
- La arquitectura debe admitir distintos rubros sin asumir que todos los trabajadores son barberos ni que todos los servicios son cortes.
- Incluye agenda, disponibilidad, horarios, bloqueos, clientes, servicios, productos, stock, ventas, cajas, pagos, comisiones, fidelizacion y contenido publico.
- El idioma principal es espanol de Argentina; ingles es el idioma secundario.
- La seleccion de sucursal condiciona la mayoria de los flujos operativos.
- El nombre actual es BarberOS. Una generalizacion de marca o nombre comercial queda como decision abierta y no debe realizarse implicitamente durante trabajos de interfaz.

## Brand Commitments

- Nombre actual: BarberOS.
- La comunicacion debe ser directa, profesional y comprensible para usuarios no tecnicos.
- La terminologia visible debe favorecer conceptos genericos como trabajador, profesional, servicio y negocio cuando corresponda.
- La experiencia visual debe sentirse como una herramienta operativa precisa con un acabado premium sobrio.
- La base debe ser familiar y de alta legibilidad, diferenciada por la centralidad de la agenda y no por decoracion llamativa.
- Evitar estetica clinica, lujo excesivo y patrones de SaaS generico basados en grillas de tarjetas intercambiables.

## Evidence on Hand

- Aplicacion funcional en Nuxt con experiencias publicas, backoffice, trabajador y cliente.
- Modelo de datos y flujos implementados en `prisma/schema.prisma` y `server/api/`.
- Convenciones de producto y arquitectura en `AGENTS.md`, `agent-context.md` y `TRACKER.md`.
- No hay testimonios, clientes publicados, metricas comerciales ni afirmaciones de mercado verificadas; futuras interfaces no deben inventarlos.

## Product Principles

1. Servir a negocios de servicios con agenda sin encerrar el producto en un rubro especifico.
2. Mantener agenda, operacion y dinero conectados en flujos coherentes.
3. Priorizar rapidez, claridad y control en tareas repetitivas del trabajo diario.
4. Mostrar a cada rol solamente las acciones y datos que necesita y puede administrar.
5. Preservar compatibilidad de datos mientras la experiencia visible evoluciona hacia un dominio mas general.

## Accessibility & Inclusion

La interfaz debe funcionar con teclado, mantener contraste legible, comunicar estados sin depender exclusivamente del color y adaptarse a pantallas de escritorio y moviles. El lenguaje debe ser claro para personas sin experiencia tecnica.
