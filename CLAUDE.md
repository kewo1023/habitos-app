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

## Cómo responderle a Kev

Pedido explícito suyo, el 5 de agosto de 2026.

**Dar contexto, no solo el resultado.** Explicar qué pasó, qué está pasando y qué
va a pasar como consecuencia. Una respuesta de una línea a "¿por qué pasó esto?"
lo deja sin lo que necesita para decidir lo siguiente.

**Preciso, no extenso.** No es lo mismo. La medida es si se puede quitar una
palabra sin perder información: si se puede, sobra. Largo por ser largo es tan
malo como corto por ser corto.

**Corregirlo cuando se equivoque, y aceptar la corrección cuando el equivocado
sea Claude.** El 5 de agosto Claude asumió que la v11 no estaba publicada y no
subió la versión; Kev lo corrigió con razón. Ese intercambio vale más que una
respuesta cómoda.

## Regla: un tip de buenas prácticas cuando quepa

Kev sabe que las buenas prácticas son lo que separa código que sobrevive de
código que funciona hoy. **Siempre que aparezca la ocasión natural, cerrar con un
tip breve de buena práctica** relacionado con lo que se acaba de hacer.

Cómo hacerlo bien:

- **Que salga de lo que se acaba de tocar**, no de una lista genérica. Si se
  escribió un `textContent` en vez de `innerHTML`, ese es el tip.
- **Explicar el problema que evita**, no solo la regla. "Usa nombres descriptivos"
  no enseña nada; "si la variable se llama `d` vas a tener que leer tres líneas
  para recordar qué guarda" sí.
- **Uno por respuesta, corto.** Si no hay ninguno que encaje de verdad, no
  inventar uno: un tip forzado enseña a ignorarlos.
- Sirven tanto los de código (nombres, funciones puras, no repetirse) como los de
  oficio (mensajes de commit, cuándo escribir un test, cuándo NO construir algo).

## Regla: pasos a paso sobre herramientas de terceros

Esta regla salió de fricción real en la Fase 3. **Antes de escribir un solo paso**
sobre una herramienta externa (Supabase, GitHub, Resend, lo que venga):

1. **Buscar la documentación actual y el changelog. No escribir de memoria.** El
   conocimiento previo sobre estas plataformas caduca rápido y en silencio.
2. **Verificar específicamente las tres cosas que más cambian:**
   - límites y restricciones del **plan gratuito**
   - **nombres exactos** de menús, botones y secciones del panel
   - **formatos de credenciales** (llaves, tokens, URLs)
3. **Describir por lo que se ve, no por la ruta.** "Busca la sección que dice
   *Publishable key*" envejece mejor que "el tercer ítem del menú".
4. **Marcar los puntos frágiles en el propio documento.** Donde sea probable que
   la interfaz haya cambiado, escribirlo: *"si en vez de esto ves aquello,
   mándame una captura"*. Es más honesto que fingir certeza.
5. **Al primer atasco, volver a la documentación antes de improvisar.** No
   proponer un rodeo hasta confirmar qué cambió realmente.
6. **Pedir captura de pantalla temprano**, no después de tres intentos fallidos.

Lo que pasó y por qué importa: en la Fase 3 se perdió tiempo dos veces. Primero,
Supabase había limitado el correo del plan gratuito a 2 envíos por hora y había
bloqueado la edición de plantillas — eso obligó a **rehacer por completo la
decisión de login**. Segundo, Supabase había cambiado el sistema de llaves y Kev
veía un formato (`sb_publishable_...`) que la guía no mencionaba, así que no
podía avanzar. Las dos se habrían evitado con una búsqueda de cinco minutos
antes de escribir.

El costo de verificar es bajo. El costo de un paso a paso equivocado lo paga Kev
atascado frente a una pantalla que no coincide con lo que le dijeron.

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
  separados por secciones comentadas (A hasta N en el `<script>`).
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
| `PASOS-FASE-3.md` | Montar Supabase: tablas, RLS y login por código |
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
  - ✅ Estadísticas por hábito dentro del calendario (racha actual, mejor racha,
    % últimos 30 días, días en total), cada una con explicación al tocarla
  - ✅ Reordenar con flechas y renombrar (tocar el nombre en modo edición)
  - Aplazado: metas semanales. Todos los hábitos de Kev son diarios; no aporta
    hoy. Retomar solo si aparece un hábito que no sea de todos los días.
  - **Fase 2 cerrada.**
  - Añadido después: emoji libre desde el teclado (`primerEmoji`, sección F0) y
    cambiar el emoji de un hábito ya creado. La lista de emojis se conserva
    como camino rápido; el campo libre es la escotilla de escape.
- **Fase 3 — Sincronizar** Supabase (Postgres). Aquí vuelve el SQL de verdad.
  Partida en tres etapas (un cambio grande a la vez):
  - Etapa 1 — Base de datos: proyecto, tablas, RLS, OTP. Guía en
    `PASOS-FASE-3.md`. **La ejecuta Kev.**
  - Etapa 2 — Login dentro de la app (panel de sesión). ✅ Sección M de
    `index.html`. Proyecto `wfqhtnxhxjtdsvjzxaks`. La librería entra por un
    `<script type="module">` aparte desde `esm.sh`; si el CDN falla, la app
    sigue funcionando solo con `localStorage`.
  - Etapa 3 — Sincronizar con cola de pendientes. ✅ Secciones M5, M6 y M7.
    Regla de oro: **solo se baja de la nube cuando la cola de pendientes está
    vacía**; si se bajara con cambios sin subir, la nube pisaría lo local.
  - **Fase 3 cerrada.** El riesgo de perder el historial queda resuelto.
  - **Decisión clave:** login con **correo y contraseña**, no con enlace mágico
    ni código por correo. Tres razones: (1) en iOS una PWA de la pantalla de
    inicio tiene almacenamiento separado de Safari, así que un enlace mágico
    abre Safari y la sesión nunca llega a la app; (2) desde junio de 2026 el
    plan gratuito no deja editar plantillas de correo sin SMTP propio, que es
    lo que haría falta para mandar un código; (3) el correo por defecto de
    Supabase permite solo **2 envíos por hora**. Con contraseña no se manda
    ningún correo y los tres problemas desaparecen.
    El código debe mantener el login **aislado en una sola función**: Kev quiere
    dejar abierta la opción de pasarse al código por correo vía Resend más
    adelante. El anexo de `PASOS-FASE-3.md` tiene los pasos.
  - **Decisión clave:** el usuario se crea **a mano desde el panel** y se apaga
    "Allow new users to sign up". La app no tiene pantalla de registro. RLS
    impide ver datos ajenos; cerrar registros impide que alguien con la llave
    pública (que va en el HTML) cree cuentas en el proyecto.
  - **Decisión clave:** `localStorage` sigue siendo la fuente de lo que se
    dibuja; Supabase va detrás. La app debe seguir funcionando sin internet.
- **Fase 2.5 — Pendientes (lista de tareas) ✅** Segunda sección de la app, con
  dos pestañas para navegar. Salió del uso real, no del plan original.
  - **Decisión clave:** una tarea **no** es un hábito. Modelo aparte y pobre a
    propósito: `{ id, texto, hecha, creada }`. Sin emoji, sin fecha límite, sin
    prioridad. El código de hábitos no se reutiliza casi nada.
  - **Decisión clave:** en el código se llaman `datos.tareas`; en pantalla,
    "Pendientes". `datos.pendientes` ya existía y es la cola de sincronización.
    **No confundirlas.**
  - **Decisión clave:** los pendientes viven **solo en `localStorage`**, sin
    Supabase, hasta que Kev los use unos días. `bajarTodo()` no los toca.
  - **Decisión clave:** descartado deslizar (swipe) para borrar/editar. Se
    reutiliza el modo edición que ya existe, mismo criterio que arrastrar-y-
    soltar en la Fase 2. Retomar solo si el uso real lo pide.
  - La app **siempre abre en Hábitos**. Pendientes es un desvío voluntario.
  - Secciones nuevas: **D2** (lógica pura, se prueba) y **N** (dibujado).
- **Fase 4 — Opcional** Capacitor para app nativa (widgets, notificaciones), o
  reescribir en React para aprender un framework.

## Riesgo conocido — resuelto en la Fase 3

Antes los datos vivían solo en el navegador del teléfono: borrar la app o una
limpieza de almacenamiento de iOS significaba perder el historial. Hoy todo se
sincroniza a Postgres, y exportar/importar sigue ahí como respaldo manual.

Lo que queda como límite aceptado: si se marca lo mismo en dos dispositivos sin
señal, gana el último en subir. No vale la pena resolverlo mejor para un solo
usuario.

## Publicar cambios

Kev edita en `~/Desktop/habitos-app`. Se está migrando de "copiar y pegar en la
web de GitHub" a **git desde VS Code** (commit + Sync); los pasos están en
`PASOS-GIT.md`. Cada vez que cambien archivos ya publicados, **subir el número
de `VERSION` en `sw.js`** o el iPhone puede seguir mostrando la versión vieja.
`VERSION` en el Mac: `v12` (arreglo del autofill). `v11` (sección de Pendientes)
ya está publicada. Confirmar que la v12 quedó publicada.

**Probar en el iPhone exige publicar.** La vista de móvil del inspector del
navegador simula el tamaño de pantalla, no el comportamiento de iOS: el autofill
de contraseñas de Safari, el service worker, el menú Compartir y la PWA de la
pantalla de inicio solo se comportan de verdad en el teléfono, contra GitHub
Pages. No dar por hecho que algo "no se ha publicado" si Kev manda una captura
del iPhone: esa captura **es** la prueba de que sí.

Cuenta de GitHub: **`kewo1023`**, repo `habitos-app`, rama `main`. Kev tiene una
cuenta vieja (`kev1023`); si algo falla al publicar, revisar primero con qué
sesión está el navegador — GitHub autoriza con esa, no con `git config`.

## Personalizaciones hechas por Kev

Kev ya edita el código él mismo. Cambios suyos que hay que respetar y no revertir
al tocar `index.html`:

- Muestra **14 días** de historial, no 7 (`for (let i = 13; i >= 0; i--)`).
- Puntos del historial a `11px` (`.dia`), no 9. Ahora es `flex: 0 1 11px`:
  los 11px siguen siendo su medida, pero pueden encoger para que la racha
  quepa en la misma línea. Si cambia ese valor, que siga siendo el `flex-basis`.
- La racha 🔥 solo aparece **desde 3 días** (`racha > 2`).
- `pintar()` incluye un **saludo según la hora** que reemplaza el título
  ("Buenos días, Kev"). Ojo: si se toca el título en el HTML, ese texto se
  sobrescribe en cada repintado.
