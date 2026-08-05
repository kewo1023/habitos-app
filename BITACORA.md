# Bitácora

Registro corto de cada sesión: qué se hizo y qué quedó pendiente.
Se actualiza al final de cada sesión de trabajo.

---

## 2026-08-01 — Arranque del proyecto (Fase 0)

**Hecho**

- Decidido el camino: PWA en HTML/CSS/JS puro. Descartadas app nativa (Swift) y
  React Native por fricción de arranque.
- `index.html` con la v0.1 completa: agregar hábitos con emoji, marcar/desmarcar,
  racha de días seguidos, puntitos de los últimos 7 días, barra de progreso del
  día, modo edición para borrar.
- Modelo de datos definido imitando dos tablas SQL (`habitos`, `registros`).
- `pruebas.js` con 15 tests de la lógica pura. Todos pasan.
- `GUIA.md` con explicación del proyecto y hoja de ruta en 4 fases.

## 2026-08-01 — Preparación para el teléfono (Fase 1)

**Hecho**

- Íconos generados (180/192/512 px): degradado azul→verde con un check blanco.
- `manifest.json` — nombre, ícono, `display: standalone`, colores.
- `sw.js` — service worker con estrategia "primero la red, copia como respaldo".
  Subir `VERSION` cada vez que se publiquen cambios.
- `index.html`: agregados `apple-touch-icon`, `apple-mobile-web-app-title`,
  enlace al manifest y registro del service worker (solo bajo https).
- `PASOS-FASE-1.md` — guía paso a paso para GitHub Pages + instalar en iPhone.
- `CLAUDE.md` — contexto del proyecto para no repetirlo cada sesión.

**Pendiente / siguiente**

- [x] Kev ejecutó los pasos de `PASOS-FASE-1.md`. **La app está en la pantalla de
      inicio del iPhone y funciona bien. Fase 1 completada.**
- [x] Fase 2, prioridad 1: exportar los datos a un archivo.
- [ ] Evaluar montar git en el Mac cuando actualizar por la web de GitHub canse.

## 2026-08-02 — Copia de seguridad y aprender a editar (Fase 2)

**Hecho**

- Skill renombrada de `habitos` a **`habitos-app`**, para dejar libre el nombre
  `habitos` para un proyecto futuro sin relación con esta app.
- **Exportar / importar datos** (sección H del `<script>` + sección J para los
  botones). Panel de "Copia de seguridad" visible solo en modo edición, para no
  estorbar en el uso diario.
  - Exportar usa el menú Compartir de iOS (`navigator.share`) si está disponible,
    y cae a una descarga normal en computador.
  - Importar valida la forma del archivo antes de aceptarlo (`esCopiaValida`) y
    pide confirmación mostrando cuántos hábitos y días trae.
  - El archivo sale nombrado `habitos-AAAA-MM-DD.json`.
- `pruebas.js` ampliado a **32 tests**, incluyendo validación de archivos
  corruptos, cancelación del confirm e ida y vuelta exportar→importar. Todos pasan.
- `COMO-EDITAR.md` — manual de VS Code con 6 ejercicios guiados (colores, días
  mostrados, emojis, textos, condicional de la racha, saludo según la hora),
  cómo leer errores en la consola y cómo deshacer.
- `sw.js`: `VERSION` subida a `'v2'`.

**Pendiente / siguiente**

- [x] Kev publicó `index.html` y `sw.js` actualizados en GitHub.
- [x] Kev hizo ejercicios de `COMO-EDITAR.md` (ver entrada siguiente).
- [ ] Siguiente de Fase 2, a elegir: calendario mensual, metas semanales
      ("3 veces por semana") o estadísticas.

## 2026-08-02 — Primeras ediciones hechas por Kev

Primera sesión en que **Kev modifica el código él mismo** con VS Code. Los
cambios ya están en `index.html` y publicados (`VERSION` en `sw.js` = `v3`).

**Hecho por Kev**

- **Ejercicio 2 — 14 días de historial.** El bucle de los puntitos pasó de
  `i = 6` a `i = 13`. Además subió `.dia` de `9px` a `11px`: decidió puntos más
  grandes en vez de más pequeños, que era la sugerencia del manual.
- **Ejercicio 5 — la racha aparece desde 3 días.** `racha > 0` → `racha > 2`.
- **Ejercicio 6 — saludo según la hora.** Código nuevo escrito por él dentro de
  `pintar()`: variable `hora`, condicionales `if` / `else if` y modificación del
  título con `querySelector`. Bien ubicado, antes del caso de lista vacía, así
  que se actualiza en cada repintado.

**Verificado**

- Sintaxis del `<script>` completo: sin errores.
- `node pruebas.js`: los 32 tests siguen pasando.
- Ancho de los 14 puntos a 11px: ~206px, entra en la tarjeta en pantalla de
  iPhone, pero queda justo. Si algún día agrega más días, tocará bajar el tamaño.

**Sin hacer (quedan disponibles)**

- Ejercicio 1 (colores), 3 (emojis propios) y 4 (textos). Los tres son de
  edición directa, sin lógica.

**Pendiente / siguiente**

- [ ] Elegir el siguiente bloque de Fase 2: calendario mensual, metas semanales
      o estadísticas.
- [ ] Evaluar montar git en el Mac: ya van dos publicaciones a mano.

## 2026-08-04 — Calendario mensual y git (Fase 2)

**Hecho**

- **Calendario mensual por hábito.** Se abre tocando el emoji del hábito (era el
  único punto de la tarjeta sin función asignada, así que no chocó con nada).
  Cuadrícula de 7 columnas con CSS grid, navegación entre meses, día de hoy
  marcado con borde, días futuros atenuados y resumen "X de N días".
- **Corregir días pasados.** `alternarHoy` se generalizó a `alternarFecha(id,
  fecha)`; `alternarHoy` quedó como un caso particular. Tocar un día del
  calendario lo marca o desmarca. El futuro está bloqueado (devuelve `false`).
  Los días que quedan vacíos se borran de `registros` para no acumular basura.
- Lógica de fechas nueva en las secciones B/C/D (testeable): `claveDe`,
  `diasDelMes`, `columnaInicio`, `esFutura`, `contarMes`. El dibujado quedó
  aparte, en la nueva **sección L**, para mantener la lógica pura separada de la
  pantalla.
- `pruebas.js` ampliado de 32 a **53 tests** (bisiestos, columna de inicio del
  mes, conteo por mes, bloqueo del futuro). Todos pasan.
- `sw.js`: `VERSION` subida a `'v4'`.
- **`PASOS-GIT.md`** — guía para montar git en VS Code: instalar, configurar
  nombre/correo, conectar con el repo existente y el ciclo diario commit → sync.
  Incluye el plan B por Terminal si "Publish to GitHub" choca con el repo que ya
  existe.

**Pendiente / siguiente**

- [x] Kev montó git en VS Code y publicó el calendario.
- [x] Calendario probado en el iPhone: se ve bien, la cuadrícula entra en
      pantalla. `VERSION` `v4` publicada y confirmada.
- [ ] Siguiente bloque de Fase 2: estadísticas, metas semanales, o reordenar y
      editar nombre.

## 2026-08-04 — Montar git: el lío de las dos cuentas

Primera publicación con git. Se atravesaron tres problemas encadenados que
conviene tener anotados por si vuelven.

**Qué pasó**

1. **"Publish to GitHub" creó un repo equivocado.** Como `habitos-app` ya
   existía, VS Code creó `habitos-app-1` — y encima **en la cuenta vieja de Kev
   (`kev1023`)**, no en la actual (`kewo1023`). Arreglado con
   `git remote set-url origin https://github.com/kewo1023/habitos-app.git`.
2. **La causa de fondo era el navegador.** GitHub autoriza con la sesión que
   esté abierta en el navegador; ahí seguía `kev1023`, así que todo se
   autorizaba con la cuenta vieja sin preguntar. `git config user.email` no
   tenía nada que ver: eso solo firma el commit, no da permisos. **Firma y
   credencial son cosas distintas.** Se resolvió cerrando sesión en github.com
   y entrando con `kewo1023`.
3. **`fatal: Need to specify how to reconcile divergent branches`** al hacer
   Sync (Sync = pull y luego push; se atascaba en el pull). El repo de GitHub
   tenía las subidas manuales viejas y la carpeta local su propia historia.
   Se resolvió con `git config --global pull.rebase false` y un **force push
   desde VS Code**, pisando la copia de GitHub con la del Mac. Seguro aquí: los
   archivos de GitHub eran una versión estrictamente más vieja de los mismos, y
   los datos de hábitos viven en el teléfono, no en el repo.

**Detalles que costaron tiempo**

- La Terminal **no muestra nada** al escribir una contraseña. Parece que no
  registra, pero sí. Además GitHub no acepta contraseñas de cuenta desde 2021:
  para git por HTTPS hace falta un Personal Access Token, o dejar que VS Code
  maneje la autenticación por navegador (esto último fue lo que se usó).
- El force push desde VS Code exige activar `Git: Allow Force Push` y desactivar
  `Git: Use Force Push With Lease` en Settings. **Se volvió a desactivar
  `Allow Force Push` después de usarlo**, para que no esté a un clic de
  distancia por accidente.

**Estado**

- `~/Desktop/habitos-app` conectada a `kewo1023/habitos-app`, rama `main`.
- El ciclo diario ya es: editar → subir `VERSION` en `sw.js` → commit → Sync.
- `PASOS-GIT.md` describe el camino feliz; esta entrada, los tropiezos reales.

**Pendiente / siguiente**

- [ ] Borrar el repo accidental `habitos-app-1` de la cuenta `kev1023`.
- [ ] Actualizar `PASOS-GIT.md` con lo aprendido (revisar la sesión del
      navegador **antes** de autorizar) si el tema vuelve a aparecer.

## 2026-08-04 — Estadísticas por hábito (Fase 2)

Elegidas sobre metas semanales: Kev confirmó que **todos sus hábitos son
diarios**, así que las metas semanales no le hacen falta por ahora. Quedan
aplazadas sin fecha.

**Hecho**

- **Cuatro estadísticas por hábito**, dentro del calendario (debajo de la
  cuadrícula): racha actual, mejor racha histórica, % de los últimos 30 días y
  días en total. Decisión de ubicación: el calendario ya es la vista de detalle
  del hábito; una pantalla nueva o números en la lista principal habrían metido
  ruido al gesto diario.
- Lógica nueva en la sección C: `fechasDe`, `totalDias`, `diasEntre`,
  `mejorRacha`, `fechaInicio`, `diasDeVida`, `porcentajeUltimos`.
- `pintarStats()` dibuja desde una lista de objetos, no con HTML repetido:
  agregar una quinta estadística es una línea.
- `.modal` con `max-height: 92vh` + scroll — la ventana creció y podía salirse
  de pantalla en teléfonos pequeños.
- `pruebas.js`: de 53 a **74 tests**. Todos pasan.
- `sw.js`: `VERSION` subida a `'v5'`.

**Decisiones de cálculo que conviene recordar**

- `diasEntre` parsea con `'T00:00:00'` para leer las fechas en hora local; sin
  eso JavaScript las toma como UTC y en Colombia caen un día antes. El
  `Math.round` cubre los días de 23/25 horas del horario de verano.
- `porcentajeUltimos` mide sobre `min(n, díasDeVida)`: un hábito de 3 días no se
  castiga con 27 días en los que no existía.
- `fechaInicio` toma la **más antigua** entre `creado` y el primer día marcado.
  Como el calendario permite marcar días anteriores a la creación, sin esto el
  porcentaje podía pasarse de 100%. También cubre los hábitos de copias viejas
  que no tienen el campo `creado`.

**Pendiente / siguiente**

- [x] Publicado y revisado en el iPhone. Los 4 recuadros entran bien.

## 2026-08-04 — Ajustes visuales y cierre de la Fase 2

Los tres primeros salen de mirar la app real en el iPhone, no del plan.

**Hecho**

- **La racha ya no se parte en dos líneas.** Con 14 puntos rígidos de 11px no
  quedaba ancho para el `🔥 3` y el texto caía abajo. `.dia` pasó de
  `width/height` fijos a `flex: 0 1 11px` + `aspect-ratio: 1`: los 11px de Kev
  siguen siendo la medida ideal, pero ahora pueden encoger. `.racha` lleva
  `flex-shrink: 0` y `white-space: nowrap`. Se arregla solo con cualquier número
  de días y cualquier ancho de pantalla.
- **Los hábitos cumplidos se distinguen de lejos.** Antes solo cambiaba a un
  fondo más claro, casi invisible. Ahora son cuatro señales juntas: fondo más
  oscuro (variable nueva `--tarjeta-hecha`), barra verde a la izquierda con
  `box-shadow: inset` (no un `border`, para no mover el contenido), borde
  verdoso y `opacity: .72`. Se descartó reordenar la lista al marcar: haría
  saltar las tarjetas bajo el dedo.
- **Cada estadística explica qué mide.** Tocar un recuadro muestra su
  descripción debajo; tocarlo otra vez la cierra. Los cuatro textos, sus
  cálculos y sus etiquetas viven en una sola lista, `ESTADISTICAS`: agregar una
  quinta es agregar un objeto, sin tocar el dibujado. El área de ayuda tiene
  `min-height` para que la ventana no dé saltos al aparecer y desaparecer.
- **Renombrar** — `renombrarHabito(id, nombre)`. Se toca el nombre en modo
  edición (subrayado punteado como pista) y sale un `prompt`. El historial no se
  toca porque cuelga del `id`, no del nombre: el pago de haber usado un id como
  PRIMARY KEY desde el principio.
- **Reordenar** — `moverHabito(id, direccion)` con flechas ↑↓ en modo edición.
  Se descartó arrastrar y soltar: en táctil es bastante más código y más frágil.
  Los botones de los extremos se **deshabilitan**, no se esconden, para que los
  demás no cambien de sitio bajo el dedo.
- `pruebas.js`: de 74 a **95 tests**. Todos pasan.
- `sw.js`: `VERSION` subida a `'v6'`.

**Con esto se cierra la Fase 2.**

**Pendiente / siguiente**

- [ ] Kev publica (commit + Sync) y revisa en el iPhone: que la racha quede en
      línea, que los cumplidos se noten y que las flechas de reordenar no queden
      muy apretadas junto a la ✕.
- [ ] Decidir el salto a **Fase 3 (Supabase)**. Es el cambio más grande hasta
      ahora y el que elimina el riesgo de perder el historial. Requiere crear
      cuenta, aprender el cliente de Supabase y reescribir `guardar()`/`cargar()`
      contra Postgres.
- [ ] Borrar el repo accidental `habitos-app-1` de la cuenta `kev1023`.

## 2026-08-04 — Fase 3, etapas 1 y 2: base de datos y login

**Etapa 1 — hecha por Kev.** Proyecto `habitos_app` en Supabase (ref
`wfqhtnxhxjtdsvjzxaks`), tablas `habitos` y `registros` con RLS, usuario creado a
mano y registros cerrados. Guía en `PASOS-FASE-3.md`.

**Dos sorpresas que cambiaron el plan de autenticación**

1. El **enlace mágico no sirve** para esta app: en iOS una PWA de la pantalla de
   inicio tiene almacenamiento separado de Safari. El enlace abre Safari, la
   sesión queda allá y la app nunca se entera.
2. El plan B era código de 6 dígitos por correo, y también se cayó: desde el
   **3 de junio de 2026** el plan gratuito no deja editar plantillas de correo
   sin SMTP propio, y el correo por defecto de Supabase permite solo **2 envíos
   por hora**.

Resultado: **correo y contraseña**, que no manda ningún correo y ocurre entero
dentro de la app. El anexo de `PASOS-FASE-3.md` deja escrito cómo pasarse al
código por correo con Resend si algún día se quiere.

**Etapa 2 — hecha en esta sesión**

- **Sección M** en `index.html`, dividida en cuatro: M1 traducir errores, M2
  entrar/salir, M3 arrancar el cliente, M4 el panel.
- La librería de Supabase entra por un **`<script type="module">` aparte**, al
  final del archivo, importada desde `esm.sh`. Sin npm y sin compilar. Si el CDN
  no responde, ese bloque no se ejecuta y **la app funciona igual que antes**:
  la nube es un extra, no un requisito.
- `entrar()` es **una sola función** y es el único sitio que sabe cómo se inicia
  sesión. Cambiar a código por correo = reescribir esa función y nada más.
- Panel de **Cuenta** junto al de copia de seguridad, visible solo en modo
  edición: entrar se hace una vez por dispositivo, no a diario.
- `mensajeDeError()` traduce los errores de Supabase al español. Está marcada
  con `M1` / `fin M1` para poder recortarla desde `pruebas.js`: es lógica pura
  aunque viva en una sección que habla con la red.
- `pruebas.js`: arreglado el recorte del `<script>` — ahora hay dos etiquetas
  `<script>` en el archivo y `lastIndexOf('</script>')` agarraba la equivocada.
  De 95 a **103 tests**. Todos pasan.
- `sw.js`: `VERSION` a `'v7'` y un `.catch` al guardar en caché, porque ahora
  pasan por ahí peticiones a otros dominios que no siempre se pueden guardar.

**Pendiente / siguiente**

- [ ] Kev publica y prueba entrar desde el iPhone. Verificar que la sesión
      sobreviva a cerrar y volver a abrir la app.
- [ ] Si `esm.sh` diera problemas, la alternativa es
      `https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm`.
- [ ] **Etapa 3 — sincronizar.** Subir los hábitos que ya existen, bajar los de
      la nube, y la cola de pendientes para funcionar sin señal. Ahí sí hay
      lógica pura que probar (la mezcla de datos).

## 2026-08-04 — Fase 3, etapa 3: sincronización

Kev confirmó que el login funciona y que la sesión sobrevive a cerrar y reabrir
la app. Con eso, se construyó la sincronización completa.

**El diseño, en tres reglas**

1. **`localStorage` sigue mandando en lo que se dibuja.** Marcar un hábito nunca
   espera a la red. La nube va detrás.
2. **Cada cambio se anota en una cola** (`datos.pendientes`) que se guarda en el
   teléfono. Sin señal, la cola espera; al volver, se vacía sola.
3. **Solo se baja cuando la cola está vacía.** Es la regla de oro: bajar con
   cambios sin subir haría que la nube pisara lo local.

**Hecho**

- **Sección A:** `encolar()` y `pendientes` dentro del modelo de datos. `cargar()`
  le agrega la cola a los datos viejos que no la tienen, para no obligar a
  empezar de cero.
- **Sección D:** las cinco acciones (marcar, crear, borrar, renombrar, mover)
  encolan su cambio. Borrar encola una sola operación: el `on delete cascade` de
  Postgres se lleva el historial solo.
- **M5 (pura, se prueba):** `habitoAFila`, `filasAHabitos`, `filasARegistros`,
  `textoPendientes`. `filasARegistros` es el traductor importante — en la base
  hay una fila por marca y la app las quiere agrupadas por día; es un `GROUP BY`
  hecho a mano.
- **M6:** `enviarPendiente` (uno a la vez, devuelve false = "todavía no"),
  `bajarTodo`, `subirTodo`.
- **M7:** `sincronizar()` con el ciclo subir→bajar, `pedirSincronizar()` que
  agrupa cambios seguidos con un temporizador de 1s para no llamar a la nube en
  cada toque, y bandera `sincronizando` para que no corran dos a la vez.
- **Disparadores:** al entrar, al volver la señal (`online`), al volver a la app
  (`visibilitychange`) y al encolar un cambio.
- **Primera subida:** `primeraSincronizacion()` empuja lo que ya había en el
  teléfono la primera vez, con la bandera `subidaHecha`. En un dispositivo nuevo
  no encola nada y simplemente baja.
- **Red de seguridad:** si la nube llegara vacía teniendo hábitos locales, se
  guarda una copia en `habitos-app-v1-respaldo` antes de reemplazar.
- El panel de Cuenta muestra el estado real: `Sincronizando…`, `Todo
  sincronizado.` o `N cambios esperando señal.`
- `pruebas.js`: de 103 a **129 tests**, incluyendo la cola (que cada acción
  encole lo que debe) y los traductores. Todos pasan.
- `sw.js`: `VERSION` a `'v8'`.

**Límite conocido y aceptado**

Si se marca lo mismo en dos dispositivos sin señal, gana el último en subir. Como
cada marca es una fila `(hábito, fecha)`, las marcas distintas no chocan entre
sí; el único choque real sería marcar y desmarcar lo mismo a la vez. Para un solo
usuario con dos dispositivos, no vale la pena resolverlo mejor.

**Pendiente / siguiente**

- [x] Las tres pruebas pasaron: datos en el Table Editor, cola de pendientes
      funcionando en modo avión, y los mismos datos en el Mac.
- [x] **Fase 3 cerrada.** El riesgo de perder el historial queda resuelto: los
      datos viven en Postgres, no solo en el teléfono.

## 2026-08-04 — Ajuste de método (a partir de la fricción de la Fase 3)

Kev señaló que lo que más lo frenó no fue la dificultad del proyecto sino los
pasos a paso desactualizados sobre Supabase. Dos veces quedó atascado frente a
una pantalla que no coincidía con la guía:

1. El plan gratuito ya no permitía editar plantillas de correo y limitaba el
   envío a 2 por hora. Obligó a **rehacer la decisión de login completa** a mitad
   de camino.
2. Supabase había cambiado el sistema de llaves; Kev veía `sb_publishable_...` y
   la guía hablaba de `anon public`, así que no podía avanzar.

Ambas se habrían evitado verificando la documentación antes de escribir. Se
agregó a `CLAUDE.md` la sección **"Regla: pasos a paso sobre herramientas de
terceros"** con seis puntos, arriba del todo para que se lea temprano en cada
sesión.

Lo que hay que recordar: el detalle de las guías no era el problema — Kev lo
agradece. El problema era la **exactitud**. Una guía muy detallada y desfasada es
peor que una corta, porque genera confianza justo donde no la hay.
- [ ] Actualizar `GUIA.md`, que quedó describiendo el proyecto de la Fase 0.
- [ ] Borrar el repo accidental `habitos-app-1` de la cuenta `kev1023`.

## 2026-08-04 — Pulir detalles y poner la documentación al día

Sesión corta de mantenimiento. Nada nuevo en la app; se arregló lo que había
quedado desfasado.

**Hecho**

- **Orden de las secciones del `<script>`.** El panel de cuenta (`M4`) había
  quedado después de `M7`. Se movió a su sitio: ahora se lee M1 → M7 en orden.
  Los tests siguen pasando (las marcas `M1` y `M5` que usa `pruebas.js` no
  cambiaron).
- **`GUIA.md` reescrita.** Describía el proyecto en la Fase 0: decía que los
  datos no se sincronizaban y que la Fase 1 era "el próximo paso". Ahora refleja
  el estado real, incluye el SQL de Supabase junto al modelo local para poder
  compararlos, y una tabla de dónde vive cada cosa (Mac, GitHub, Pages,
  Supabase).
- **`COMO-EDITAR.md` actualizado.** Tenía el mismo problema que las guías de
  Supabase, en pequeño: mandaba a buscar código que Kev ya había cambiado.
  - El mapa de secciones va de A a M, sin números de línea (envejecían mal) y
    con un aviso de fiarse del texto a buscar, no de la línea.
  - Ejercicios 2, 5 y 6 marcados como hechos, con el código tal como quedó. El 2
    explica el `flex: 0 1 11px` nuevo, porque el `width: 9px` que mencionaba ya
    no existe.
  - **Tres ejercicios nuevos**: cambiar la ventana de las estadísticas, agregar
    una estadística nueva a la lista `ESTADISTICAS`, y correr `node pruebas.js`.
    El 8 se verificó compilando el resultado: da 5 estadísticas y no rompe nada.
  - Sección de publicar reescrita para git + VS Code, con el aviso de revisar la
    cuenta del navegador si algo falla.
  - "Qué hacer cuando rompas algo" ahora usa el diff de Source Control y
    *Discard Changes*, que es mejor que copiar y pegar desde GitHub.
- `sw.js`: `VERSION` a `'v9'`.

**Pendiente / siguiente**

- [ ] Kev publica (commit + Sync). El cambio de código es solo de orden, pero
      conviene que lo publicado y lo local coincidan.
- [ ] Ejercicios 1, 3 y 4 de `COMO-EDITAR.md` (colores, emojis, textos), y los
      nuevos 7, 8 y 9 cuando quiera.
- [ ] Borrar el repo accidental `habitos-app-1` de la cuenta `kev1023`.
- [ ] Fase 4 sin decidir y sin prisa. Kev va a usar la app un tiempo antes de
      construir más.

---

<!-- Plantilla para la próxima entrada:

## AAAA-MM-DD — Título

**Hecho**
-

**Pendiente / siguiente**
- [ ]

-->
