# CLAUDE.md — contexto del proyecto "Mis Hábitos"

> Archivo de contexto para Claude. Léelo al empezar cualquier sesión sobre este
> proyecto, antes de tocar código. Kev: puedes editarlo cuando quieras, es tuyo.

## Quién es el usuario

Kev. Conocimientos de programación casi nulos; entiende conceptos generales y
aprendió SQL hace años (lo tiene oxidado). **Quiere aprender mientras construye**,
no solo recibir código funcionando.

Implicaciones para cómo trabajar con él:

- Explicar el *por qué* de cada decisión, no solo el *qué*
- Comentarios en el código en español, orientados a enseñar
- Analogías con SQL cuando aplique: es su punto de anclaje
- Un cambio grande a la vez, no diez cosas simultáneas
- Nunca dar por hecho que sabe usar la Terminal, git, npm, etc.
- Responder en español
- Edita el código con **VS Code**. Al indicarle un cambio, darle la referencia de
  búsqueda (⌘F + el texto exacto a buscar), no solo el número de línea: las líneas
  se desplazan, el texto no.

## Qué es la app

Seguimiento diario de hábitos. Uso estrictamente personal (no se publica, no hay
otros usuarios). Prioridad de diseño: **simple y rápida de usar**, para que el uso
sea sostenible en el tiempo. Si una función agrega fricción diaria, no va.

Plataforma: iPhone. Kev tiene un Mac.

## Decisiones técnicas tomadas (y por qué)

- **PWA en HTML/CSS/JavaScript puro, un solo archivo** en vez de app nativa o
  React Native. Razón: cero instalación, cero costo, cero herramientas que se
  rompan, y enseña las bases que se trasladan a todo lo demás.
- **Sin frameworks, sin dependencias, sin paso de compilación.** Editar y recargar.
  No introducir React/Vue/Tailwind/npm sin discutirlo antes: rompería la premisa.
- **Todo en `index.html`** — estilos, estructura y lógica en el mismo archivo,
  separados por secciones comentadas (A hasta I en el `<script>`).
- **`localStorage` como almacenamiento**, con un modelo de datos que imita dos
  tablas SQL (`habitos` y `registros`) para que la migración futura a Postgres sea
  directa.
- **Patrón de render:** los datos son la única verdad; cualquier cambio llama a
  `guardar()` y luego `pintar()`, que redibuja todo. No optimizar esto a render
  parcial sin una razón de peso.
- **Service worker con estrategia "primero la red, copia como respaldo"**, para
  que Kev nunca vea una versión vieja mientras iteramos.

## Archivos

| Archivo | Qué es |
|---|---|
| `index.html` | La app completa |
| `sw.js` | Service worker (funcionar sin internet) |
| `manifest.json` | Metadatos para instalarla en el teléfono |
| `icono-*.png` | Íconos generados con PIL (script en la bitácora) |
| `pruebas.js` | Tests de la lógica pura. Correr con `node pruebas.js` |
| `GUIA.md` | Explicación del proyecto y hoja de ruta |
| `PASOS-FASE-1.md` | Instrucciones para publicar en GitHub Pages |
| `PASOS-GIT.md` | Montar git en VS Code y el ciclo commit/sync |
| `COMO-EDITAR.md` | Manual de VS Code y ejercicios para que Kev edite solo |
| `BITACORA.md` | Registro de qué se hizo en cada sesión |

**Correr `node pruebas.js` después de cualquier cambio en la lógica.** Si se
agrega lógica nueva (metas semanales, estadísticas), agregar sus tests ahí.

## Hoja de ruta

- **Fase 0 — v0.1 ✅** Agregar/marcar/borrar hábitos, racha, últimos 7 días,
  progreso del día, datos locales.
- **Fase 1 — En el teléfono ✅** Publicada en GitHub Pages e instalada en la
  pantalla de inicio del iPhone. Funcionando.
- **Fase 2 — Uso diario agradable** (en curso)
  - ✅ Exportar/importar datos a archivo `.json` (el respaldo)
  - ✅ Calendario mensual por hábito (se abre tocando su emoji), con corrección
    de días pasados
  - Pendiente: estadísticas, hábitos con meta semanal, reordenar, editar nombre.
- **Fase 3 — Sincronizar** Supabase (Postgres). Aquí vuelve el SQL de verdad.
- **Fase 4 — Opcional** Capacitor para app nativa (widgets, notificaciones), o
  reescribir en React para aprender un framework.

## Riesgo conocido

Los datos viven solo en el navegador del teléfono. Borrar la app o una limpieza
de almacenamiento de iOS = historial perdido. Ya existe exportar/importar como
mitigación (panel visible en modo edición), pero es manual: Kev tiene que
acordarse de hacerlo. La solución de fondo sigue siendo la Fase 3.

## Publicar cambios

Kev edita en `~/Desktop/habitos-app`. Se está migrando de "copiar y pegar en la
web de GitHub" a **git desde VS Code** (commit + Sync); los pasos están en
`PASOS-GIT.md`. Cada vez que cambien archivos ya publicados, **subir el número
de `VERSION` en `sw.js`** o el iPhone puede seguir mostrando la versión vieja.
`VERSION` en el Mac: `v4` (calendario). Confirmar que quedó publicada.

## Personalizaciones hechas por Kev

Kev ya edita el código él mismo. Cambios suyos que hay que respetar y no revertir
al tocar `index.html`:

- Muestra **14 días** de historial, no 7 (`for (let i = 13; i >= 0; i--)`).
- Puntos del historial a `11px` (`.dia`), no 9.
- La racha 🔥 solo aparece **desde 3 días** (`racha > 2`).
- `pintar()` incluye un **saludo según la hora** que reemplaza el título
  ("Buenos días, Kev"). Ojo: si se toca el título en el HTML, ese texto se
  sobrescribe en cada repintado.
