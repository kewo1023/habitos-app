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

## 2026-08-04 — Emoji libre y ejercicios nuevos

Kev publicó la v9 y borró el repo accidental `habitos-app-1`. Las dos cosas
pendientes de la sesión anterior quedan cerradas.

**Hecho**

- **Emoji desde el teclado, sin perder la lista.** Kev preguntó si valía la pena
  reemplazar la lista de emojis por un campo de texto. Se decidió tener los dos:
  la lista sigue siendo un toque (el caso normal) y el campo libre es la escotilla
  de escape. Lo escrito a mano gana sobre lo seleccionado.
- **`primerEmoji()` — sección F0, pura y probada.** Un emoji no es un carácter:
  👨‍👩‍👧 son cinco piezas unidas por caracteres invisibles y 🇨🇴 son dos.
  Cortar con `texto[0]` habría producido símbolos rotos. Se usa `Intl.Segmenter`
  con `granularity: 'grapheme'`, con `Array.from` como plan B. La validación
  acepta `Extended_Pictographic`, `Regional_Indicator` (banderas) y `⃣`
  (teclados numéricos), y rechaza letras y números.
- **`cambiarEmoji(id, emoji)`.** En modo edición, tocar el emoji de un hábito lo
  cambia; en uso normal sigue abriendo el calendario. Mismo criterio que el
  nombre, para no aprender dos reglas. El historial no se mueve: cuelga del `id`.
- `pruebas.js`: de 129 a **153 tests**. Los de emoji cubren tonos de piel,
  familias, banderas y el rechazo de texto normal.
- `COMO-EDITAR.md`: **tanda avanzada (ejercicios 10, 11 y 12)** sobre el
  calendario, la consola y la cola de sincronización. El 10 avisa a propósito que
  van a fallar tres pruebas — para que vea a los tests haciendo su trabajo. El 12
  no cambia código: enseña a seguir un hilo con ⌘F por el archivo, que es como se
  navega cualquier proyecto grande.
- `sw.js`: `VERSION` a `'v10'`.

**Pendiente / siguiente**

- [x] Publicado y probado en el iPhone. El emoji libre y el cambio de emoji
      funcionan bien. `v10` en producción.
- [ ] Ejercicios 1 y 4 de `COMO-EDITAR.md`, y la tanda 7–12 cuando quiera.
- [ ] **Compartir la app con otra persona**: se evaluó y no está lista. Ver la
      lista de bloqueadores más abajo. No es prioridad de Kev.

**Evaluación: ¿está lista para compartirla?**

Todavía no, pero está más cerca de lo que parece. Lo difícil ya está resuelto:
el RLS separa los datos de cada usuario correctamente, así que dos personas en el
mismo proyecto no se verían nada. Lo que falta:

1. **El nombre "Kev" está escrito dentro del código**, en el saludo de `pintar()`.
   Hay que sacarlo a un ajuste guardado.
2. **Los registros están cerrados** en Supabase (a propósito). Habría que crear
   cada usuario a mano desde el panel, o volver a abrirlos y aceptar el riesgo.
3. **No hay pantalla de registro ni de recuperar contraseña.** Si la otra persona
   olvida la suya, solo se arregla desde el panel.
4. **El plan gratuito pausa el proyecto** tras una semana sin consultas, y no
   manda correos (2 por hora). Con más usuarios eso empieza a pesar.

Ninguno es difícil por separado; juntos son una sesión de trabajo. La decisión
real es si Kev quiere pasar de "mi app" a "una app con usuarios", que trae
soporte y responsabilidad sobre datos ajenos.

---

## Estado al cerrar el 2026-08-04

Cuatro fases construidas y cerradas en cuatro días de trabajo.

| | |
|---|---|
| App en vivo | `kewo1023.github.io/habitos-app`, `VERSION` **v10** |
| Código | `github.com/kewo1023/habitos-app`, rama `main` |
| Datos | Supabase, proyecto `habitos_app` (`wfqhtnxhxjtdsvjzxaks`) |
| Pruebas | **153**, todas pasando (`node pruebas.js`) |
| `index.html` | ~1.760 líneas, secciones A–M |

**Qué se puede hacer hoy:** crear hábitos con cualquier emoji, marcarlos, ver
racha e historial de 14 días, calendario mensual por hábito con corrección de
días pasados, cuatro estadísticas con explicación, reordenar, renombrar, cambiar
emoji, exportar e importar copias, y sincronización automática con Postgres que
funciona sin señal y se pone al día sola.

**Sin decidir, sin prisa:** la Fase 4 (recordatorios, Capacitor, o reescribir en
React). Kev va a usar la app un tiempo antes de construir más — las mejores ideas
van a salir del uso real.

**Para retomar:** invocar `/habitos-app` en una sesión nueva. Leer `CLAUDE.md`
(sobre todo la regla de verificar documentación de terceros antes de escribir
pasos) y esta bitácora.

---

## 2026-08-05 — Sección de Pendientes (Fase 2.5)

Primera función que sale del **uso real** de la app, no del plan original: Kev
quería una lista de tareas al lado de los hábitos, con dos botones para navegar.

**Lo que se discutió antes de escribir código**

- **Una tarea no es un hábito con otro nombre.** Un hábito vive para siempre y se
  mide con racha, calendario y porcentajes; una tarea se hace una vez y se acabó.
  Casi nada del código de hábitos se reutiliza. No es una columna nueva en la hoja
  existente, es una hoja nueva en el mismo libro.
- **Choque de nombres evitado a tiempo.** `datos.pendientes` ya existía y significa
  "cola de cambios sin subir a la nube". La lista de tareas se llama `datos.tareas`
  en el código, aunque en pantalla el botón diga "Pendientes".
- **Deslizar para borrar: descartado por ahora.** Kev lo propuso y se evaluó: en JS
  puro son ~150 líneas frágiles, el problema difícil es distinguir el deslizamiento
  horizontal del scroll vertical, Safari usa el gesto desde el borde izquierdo para
  "volver atrás", y nada de eso se puede probar con `pruebas.js`. Se reutilizó el
  **modo edición que ya existe** — mismo precedente que arrastrar-y-soltar en la
  Fase 2. Kev estuvo de acuerdo: la prioridad es que la app sea fácil y rápida.

**Hecho**

- **Sección D2 (pura, se prueba)** — `agregarTarea`, `alternarTarea`,
  `renombrarTarea`, `borrarTarea`, `limpiarHechas`, `tareasOrdenadas`,
  `contarTareas`. Cae dentro del trozo A→E que `pruebas.js` ya recortaba, así que
  no hubo que tocar el recorte; solo agregar el shim `global.pintarTareas`.
- **Sección N (dibujado)** — `cambiarVista()`, `pintarTareas()` y los botones.
  Misma separación que el calendario: lógica arriba, pantalla abajo.
- **Modelo de tarea, deliberadamente pobre:** `{ id, texto, hecha, creada }`. Sin
  emoji, sin fecha límite, sin prioridad. La prioridad queda anotada como posible
  paso 2.
- **Dos pestañas** debajo de la barra de progreso, con el número de pendientes
  dentro de la pestaña de Pendientes. La app **siempre abre en Hábitos**: el gesto
  diario no cambia, Pendientes es un desvío voluntario.
- **Captura sin ventana emergente.** El campo de texto va fijo arriba de la lista;
  escribes y das Enter, y el foco se queda ahí para anotar varias seguidas. El
  botón grande de abajo cambia a "+ Nuevo pendiente" y solo hace foco en el campo.
- **Al marcar, la tarea se tacha y baja al final.** Como redibujamos todo de golpe,
  se le agregó la animación `aterrizar` (.28s) para que el movimiento no se sienta
  un glitch. La variable `tareaRecienMovida` marca a cuál aplicársela y se limpia
  sola tras dibujarla.
- **`textContent` en vez de `innerHTML`** para el texto de la tarea. Un pendiente
  escrito como "comprar \<cosas\>" habría roto el dibujado. Es la primera vez en
  el proyecto que importa: los nombres de hábitos son cortos, los pendientes no.
- **`cargar()` le pone `tareas: []` a los datos viejos**, igual que hizo con
  `pendientes` en la Fase 3. Mismo patrón cada vez que crece el modelo.
- **Copias de seguridad**: `esCopiaValida` acepta copias viejas sin tareas y valida
  la forma si vienen; `importar` las restaura.
- **`bajarTodo()` no toca `datos.tareas`** — comentado explícitamente en el código,
  porque es justo donde habría que agregarlas si algún día se sincronizan.
- `pruebas.js`: de 153 a **199 tests**. Todos pasan.
- `sw.js`: `VERSION` a `'v11'`.

**Decisión pendiente y por qué se aplazó**

Los pendientes viven **solo en `localStorage`**, sin Supabase. A propósito: primero
se usan unos días y solo entonces se decide si merecen su propia tabla en Postgres.
Comprometerse al diseño antes de haberlo probado es lo que costó tiempo en la
Fase 3. El riesgo aceptado es bajo: si se borra la app se pierden las tareas, no el
historial de hábitos.

**Arreglo del mismo día — Safari ofrecía la contraseña en el campo de tareas**

Kev publicó la `v11`, probó en el iPhone y mandó captura: al tocar "¿Qué tienes
pendiente?", Safari sugería rellenar con la contraseña guardada del sitio.

(Nota de método: Claude asumió que la v11 no estaba publicada y por eso no subió
la versión al arreglar. Kev lo corrigió. **Una captura del iPhone es prueba de que
la app está publicada** — probar en el teléfono real exige GitHub Pages; la vista
de móvil del inspector solo simula el tamaño. Este arreglo va en la `v12`.)

Causa: **ninguno de los inputs estaba dentro de un `<form>`**. Sin formularios,
Safari trata la página entera como uno solo, ve el `<input type="password">` del
login (aunque esté oculto) y ofrece las credenciales guardadas en cualquier campo
de texto. **`autocomplete="off"` no sirve aquí**: Safari lo ignora a propósito
para credenciales, y adivina el propósito de un campo por su `name`, su etiqueta y
su `placeholder`.

Arreglo, en tres capas:

1. Login envuelto en `<form id="formEntrar">` — le pone una cerca a las
   credenciales. `btnEntrar.onclick` pasó a `formEntrar.onsubmit`, que además
   cubre el "Ir" del teclado.
2. Campo de tareas envuelto en `<form id="formTarea">` con `name="pendiente"`.
   Al estar en otro formulario, ya no hereda el contexto de login. El `keydown` de
   Enter y el `onclick` del "+" se unificaron en un solo `onsubmit`.
3. CSS `::-webkit-credentials-auto-fill-button` oculto, para quitar el iconito de
   llave que Safari mete dentro del campo.

Los dos `onsubmit` llevan `preventDefault()`: sin él el navegador recargaría la
página al enviar el formulario.

**Pendiente / siguiente**

- [x] `v11` publicada y probada en el iPhone. Las pestañas y la captura de
      pendientes funcionan bien; salió el problema del autofill.
- [ ] Publicar la **`v12`** (ya subida en `sw.js`) y comprobar dos cosas: que
      Safari ya no ofrezca la contraseña en el campo de pendientes, y que
      **entrar con correo y contraseña siga funcionando** tras meter el login
      dentro de un `<form>`.
- [ ] Usarlo unos días. Después decidir: ¿sincronizar con Supabase? ¿prioridad?
      ¿el gesto de deslizar hace falta de verdad?
- [ ] Ejercicios 1 y 4 de `COMO-EDITAR.md`, y la tanda 7–12 cuando quiera.

## 2026-08-05 — Pestaña Ideas (Fase 2.6) y dos reglas nuevas de método

Kev pidió una lista aparte para ideas de corto/mediano plazo, con una condición
clara: **que no afecte el contador de Pendientes**. Esa condición era la pista de
que son dos cosas distintas, no una variante de la otra.

**Reglas nuevas en `CLAUDE.md`, a pedido de Kev**

1. **Evaluar antes de construir.** Ante una función nueva, primero devolverle una
   evaluación por cuatro ejes — utilidad, fricción, impacto en el código y
   límites de plataforma — y **ser propositivo**: si su idea es cara o inviable,
   ofrecer la alternativa que resuelve el mismo problema, no solo decir que no.
2. **Un tip de buenas prácticas cuando quepa**, que salga de lo que se acabó de
   tocar y explique el problema que evita. Uno por respuesta; ninguno si no hay
   uno honesto.

**La evaluación que salió de aplicar la regla 1**

- Kev la pidió *dentro* de Pendientes (pestañas anidadas). Se propuso **tres
  pestañas al mismo nivel**: un solo toque para cualquier sección y cero
  navegación en dos niveles. Kev aceptó.
- Se propuso que una idea pudiera **moverse a Pendientes**; Kev pidió eso **y**
  poder marcarla como hecha. Ambas quedaron.

**La decisión de fondo: una tabla, no dos**

Un pendiente y una idea guardan exactamente los mismos campos. En vez de
`datos.tareas` y `datos.ideas` en paralelo, hay **un solo array con una columna
`lista`**. La analogía que se usó para explicarlo:

```
SELECT * FROM ideas                          -- dos tablas gemelas
SELECT * FROM tareas WHERE lista = 'ideas'   -- una tabla y un WHERE
```

Lo que se ganó: `moverALista()` es un cambio de campo (un `UPDATE`), no un
borrar-y-recrear; toda la lógica de D2 sirve para las dos listas pasándole cuál;
y agregar una tercera lista mañana no duplica nada.

**Hecho**

- **D2 generalizada** — `LISTAS`, `tareasDe(lista)`, y `agregarTarea`,
  `tareasOrdenadas`, `contarTareas` y `limpiarHechas` ahora reciben la lista.
  `moverALista(id, lista)` es nueva; al mover una idea a Pendientes la deja en
  `hecha: false`, porque acabas de decidir hacerla.
- **Migración** en `cargar()`: a las tareas guardadas sin columna `lista` se les
  pone `'pendientes'`. Es el `UPDATE ... WHERE lista IS NULL` que se corre una
  vez al agregar una columna a una tabla con datos.
- **Sección N reescrita** — `pintarTareas()` pasó a `pintarLista()`, que dibuja
  la lista en la que estés. Las palabras de cada lista (placeholder, botón,
  estado vacío) viven en una tabla `TEXTOS_LISTA`, no repartidas en ifs.
- **Ideas no lleva contador ni barra de progreso.** Deliberado: medir "cuántas
  ideas llevas hechas" convertiría la lista en algo que te reclama.
- Pendientes e Ideas **comparten el mismo bloque de HTML**. Duplicarlo habría
  sido la misma trampa que tener dos arrays.
- `pruebas.js`: de 199 a **224 tests**, con los existentes adaptados a las firmas
  nuevas. Cubren que las listas no se mezclen, que el contador de Pendientes
  ignore las ideas, el movimiento entre listas y la migración de datos viejos.
- `sw.js`: `VERSION` a `'v13'`. La `v12` (autofill) no llegó a publicarse sola:
  queda absorbida aquí.

**Pendiente / siguiente**

- [ ] Publicar la **`v13`** y probar en el iPhone: que las tres pestañas quepan y
      se lean bien, que Safari ya no ofrezca la contraseña en el campo de texto,
      y que **entrar con correo y contraseña siga funcionando** tras meter el
      login dentro de un `<form>`.
- [ ] Usar Pendientes e Ideas unos días. Después decidir: ¿sincronizar con
      Supabase? ¿prioridad en los pendientes? ¿hace falta el gesto de deslizar?

## 2026-08-05 — Ficha de la idea y pestaña activa más visible (v14)

Kev publicó la `v13`, la probó y confirmó que funciona. De usarla salieron dos
pedidos, los dos de uso real y no de plan.

**1. Tocar una idea abre su ficha, ya no la marca**

Evaluación previa: el problema es real y específico de Ideas — "app de propinas"
no dice nada tres semanas después, mientras que "llamar al banco" se explica solo.
Y de paso arregla un error fácil: hoy tocar en cualquier parte de la tarjeta la
tachaba sin querer.

- **Campo `nota` opcional.** Si está vacío, el campo no existe en los datos: no se
  guarda como `''`. Un campo vacío repetido en todas las filas es basura que se
  arrastra para siempre.
- **`editarTarea(id, texto, nota)`** es la función general y `renombrarTarea` pasó
  a ser un caso particular que la llama — mismo patrón que `alternarHoy` sobre
  `alternarFecha`. Usa `??` y no `||` a propósito: con `||` un texto vacío se
  confundiría con "no me mandaron ese parámetro" y borrar una nota dejaría de
  funcionar.
- **Ventana `#modalIdea`** reusando el patrón `.fondo-modal` del calendario:
  título editable, `<textarea>` de contexto (tope 500), y las acciones "→ A
  Pendientes" y "Borrar" ahí mismo. Guardar antes de mover, para no perder lo
  escrito. Borrar desde la ficha **sí** pregunta, a diferencia de la ✕ de la
  lista: una idea con contexto ya no es una línea que reescribes en 3 segundos.
- **En la lista, la nota se asoma debajo del título** cortada a dos líneas
  (`-webkit-line-clamp`). Sirve para reconocer la idea sin abrirla, que es el
  problema que la nota vino a resolver.
- **Decisión de fondo:** el ✓ es el único sitio que marca, en las dos listas.
  Pero **en Pendientes tocar el texto sigue marcando**, y eso es deliberado: ahí
  el gesto es diario y meterle puntería al elemento más usado de la app sería un
  mal negocio. En Ideas el gesto dominante es leer, no tachar. Para que no sean
  "dos reglas", la tarjeta de idea lleva subrayado punteado — la misma pista de
  "esto se toca" que la app ya usa en modo edición.

**2. La pestaña activa se distinguía poco**

Kev tenía razón: la única diferencia era un fondo apenas más claro. Se aplicó el
mismo criterio que con los hábitos ya cumplidos — **varias señales suaves a la vez
se leen más rápido que una sola señal fuerte**: fondo elevado, blanco puro contra
el gris de las otras, negrilla, y una línea de acento de 2px debajo.

La línea va como pseudo-elemento `::after` posicionado y no como `border-bottom`,
para que no empuje el texto ni un píxel al aparecer. Es la misma razón por la que
la barra verde de los hábitos cumplidos es un `box-shadow: inset` y no un borde.

Se descartó la pastilla azul sólida: ese azul ya es el botón grande de abajo, y
dos azules fuertes compiten entre sí.

**Otros**

- `.tarea-info` envuelve título y nota, para que el ✓ y los botones queden
  centrados respecto a los dos y no solo respecto al título.
- `pruebas.js`: de 224 a **239 tests**. Cubren que la nota no pise el título, que
  vaciarla borre el campo, el recorte a 500, y que sobreviva a mover la idea a
  Pendientes.
- `sw.js`: `VERSION` a `'v14'`.

**Pendiente / siguiente**

- [ ] Publicar la **`v14`** y probar en el iPhone: que el `<textarea>` no quede
      tapado por el teclado al escribir la nota (la ventana tiene
      `max-height: 92vh` con scroll, pero eso hay que verlo en el teléfono), y
      que la pestaña activa ahora sí se distinga de un vistazo.
- [ ] Usar las tres secciones unos días. Después decidir: ¿sincronizar
      pendientes e ideas con Supabase? ¿prioridad en los pendientes?

## 2026-08-07 — Tema claro, la app en inglés y panel de Ajustes (v15)

Tres cosas a la vez, pero las tres son la misma: **sacar del código lo que
estaba escrito a mano**. Los colores estaban escritos en el CSS, los textos en
el JavaScript y el nombre "Kev" dentro de `pintar()`. Ahora los tres salen de
una tabla o de un ajuste.

**1. Tema claro (Auto / Claro / Oscuro)**

- Los colores pasaron de un `:root` a dos: `:root[data-tema="oscuro"]` y
  `:root[data-tema="claro"]`. Quién manda lo decide `aplicarTema()` poniendo
  `data-tema` en la etiqueta `<html>`.
- **"Automático" no es un tercer juego de colores.** Se resuelve a claro u
  oscuro preguntándole al teléfono *antes* de dibujar. Así el CSS solo conoce
  dos temas, que es la mitad de colores que mantener.
- **Un trocito de JavaScript en el `<head>`**, duplicado a propósito, aplica el
  tema antes de que se pinte nada. Sin él la app abriría un instante en oscuro
  y saltaría a claro en cada apertura.
- Se sacaron a variables los nueve colores que estaban escritos a mano
  (`#fff`, `#0f1115`, `rgba(0,0,0,.65)`…). Cada uno estaba pensado para fondo
  oscuro y en claro había que darle la vuelta: `--sobre-exito` es negro en
  oscuro y blanco en claro, y así con los demás.
- El `<meta name="theme-color">` se actualiza al cambiar de tema, o en claro
  queda una franja negra arriba en la PWA instalada.

**2. La app en inglés, con el mismo patrón que Tips Control**

- **Sección A0 nueva**: una tabla `TEXTOS` con `es` y `en`, y la función
  `t('clave')`. ~120 claves. Ningún texto que ve el usuario queda escrito
  suelto en el código.
- En el HTML, `data-t` (texto), `data-ph` (placeholder) y `data-aria`
  (etiqueta para VoiceOver). `traducirEstaticos()` los recorre de golpe: para
  traducir un elemento nuevo basta con marcarlo, sin volver a esa función.
- `ESTADISTICAS` y `TEXTOS_LISTA` guardan ahora **claves, no frases**. Las dos
  listas se crean una sola vez al abrir la app; si guardaran el texto, se
  quedarían congeladas en el idioma con el que arrancaste.
- Las fechas salen de `localeFechas()` (`es-CO` / `en-US`). El calendario
  **sigue empezando en lunes en los dos idiomas**: cambiar el primer día tocaría
  `columnaInicio()` y sus pruebas, y no era lo que estábamos haciendo.
- Los avisos con números usan huecos (`%h`, `%d`, `%n`) en vez de pegar trozos
  de frase. El orden de las palabras cambia entre idiomas; pegando trozos
  acabas con frases imposibles de traducir sin tocar el código.
- **Renombrada toda variable local llamada `t`** (había once) a `tarea`, `idea`
  o `palabras`. Con `t()` como función global, una variable `t` la tapaba
  dentro de su función y el fallo habría salido en runtime, no al guardar.

**3. Panel de Ajustes, y "Kev" fuera del código**

- Panel nuevo en modo edición, junto a Copia de seguridad y Cuenta. Se
  descartó una cuarta pestaña: son ajustes que se tocan una vez, y un cuarto
  botón permanente arriba habría apretado el ancho en iPhone para nada.
- Tres ajustes: **Tu nombre**, **Idioma** y **Apariencia**. Viven en
  `datos.prefs`.
- El nombre se guarda con `input` (en cada tecla) y no con `blur`: en el
  teléfono cerrar el teclado no siempre dispara `blur`. Solo repinta la
  cabecera, porque repintar la lista entera en cada tecla cerraría el teclado.
- Si el nombre está vacío el saludo queda solo ("Buenos días"), no con una
  coma huérfana.
- **`prefs` no viaja.** Ni se importa de una copia ni se baja de la nube:
  restaurar un respaldo hecho en el Mac no debería cambiarte el idioma del
  teléfono. Hay tres pruebas que lo vigilan.
- De paso, esto cierra el **bloqueador nº 1** de la lista de "¿está lista para
  compartirla?" del 4 de agosto.

**Verificación: dos capas ahora, no una**

- `pruebas.js`: de 239 a **270 tests**. Los nuevos más útiles no comprueban una
  traducción concreta sino que **no falte ninguna**: comparan las claves de las
  dos tablas, que ningún texto esté vacío, que los huecos `%h`/`%n` existan en
  las dos versiones, y que cada `data-t` del HTML tenga su clave.
- **`pruebas-app.js` + `mini-dom.js` — capa nueva, copiada de Tips Control.**
  Carga la app entera en un navegador de mentira y comprueba el comportamiento:
  53 verificaciones. Encontró lo que `pruebas.js` no puede ver por diseño —
  errores de conexión entre piezas, no de cálculo.
- `sw.js`: `VERSION` a `'v15'`.

**Límite conocido y aceptado**

El nombre bajo el ícono de la pantalla de inicio sigue diciendo "Hábitos" en
los dos idiomas. Sale de `manifest.json`, que el teléfono lee una sola vez al
instalar la app y no se puede cambiar desde JavaScript. Para arreglarlo habría
que reinstalar la app con otro manifiesto. No vale la pena.

**Pendiente / siguiente**

- [ ] Publicar la **`v15`** y probar en el iPhone:
      - que al abrir con el teléfono en modo claro **no parpadee** en oscuro
      - que el tema claro se lea bien **a plena luz**, sobre todo los puntitos
        del historial y los días del calendario
      - que el panel de Ajustes quepa sin apretar en modo edición
      - que **entrar con correo y contraseña siga funcionando**
      - que el ícono nuevo se vea bien en la pantalla de inicio (hay que
        **borrar la app y volver a añadirla**: iOS guarda el ícono al instalar
        y no lo vuelve a pedir)
- [x] Logo nuevo elegido y generado (ver abajo).
- [ ] Usar las tres secciones unos días. Después decidir: ¿sincronizar
      pendientes e ideas con Supabase? ¿prioridad en los pendientes?

## 2026-08-07 — Logo nuevo: "El brote"

Se propusieron cuatro conceptos (la racha, la marca, el brote, la cuadrícula)
dibujados en SVG y mirados también a 44 px, que es el tamaño al que se ve un
ícono de verdad en la pantalla de inicio. **Kev eligió el brote.**

- **`hacer-iconos.py`** — el script que genera los tres PNG. Reemplaza al que
  vivía suelto en esta bitácora desde la Fase 1; ahora es un archivo del
  proyecto y se corre con `python3 hacer-iconos.py`.
- Los colores salen de las variables de la app: `--fondo`, `--exito` y
  `--acento`. El ícono y la app son la misma cosa.
- **El dibujo se centra solo.** El script mide su propia caja, la escala al 74%
  del lienzo y la centra. Cuadrar coordenadas a ojo obliga a rehacer el cuadre
  entero cada vez que mueves una hoja.
- **Se dibuja 8 veces más grande y luego se encoge** (LANCZOS). Pillow no
  suaviza bordes: sin eso, las curvas de las hojas salen con escalones.
- Dos cosas que solo se vieron generando la imagen y mirándola:
  1. **El orden de dibujado.** Con el tallo antes que la hoja de la izquierda,
     la hoja le pisaba un trozo con su verde oscuro y quedaba un escalón justo
     en el medio. Ahora el orden es hoja de atrás → tallo → hoja de delante.
  2. **La punta del tallo sobresalía** por encima de la unión de las hojas y se
     leía como un bultito suelto. Se bajó a `TALLO_ARRIBA = 61`.
- Las hojas arrancan un poco *dentro* del tallo (x=58 y x=62, no 60): dos
  bordes que se tocan justo se notan, dos que se solapan un poco no.

**Ojo al probarlo:** iOS guarda el ícono **al instalar** la app en la pantalla
de inicio y no lo vuelve a pedir. Para ver el nuevo hay que borrar el ícono
viejo y volver a añadir la app desde Safari. Publicar y recargar no basta.

## 2026-08-08 — Celebraciones, reordenar tareas y las tareas en la nube (v16)

Tres cambios grandes en una sesión, que es uno más de los que aconseja la regla
del proyecto. Se hicieron en orden y con las pruebas corriendo entre uno y otro.

**La evaluación previa, y en qué cambió lo que Kev pidió**

Kev propuso confeti al marcar cada hábito. Se evaluó y se propuso otra cosa:
marcar pasa cinco o seis veces al día, y una celebración que sale siempre deja
de ser una celebración en una semana. Quedó **una animación pequeña para el
gesto diario** (el check hace *pop* y sale una onda) y **el confeti reservado
para el día completo**, que es el evento de verdad. Kev estuvo de acuerdo.

Para reordenar pidió flechas o arrastrar sosteniendo. Se descartó arrastrar —
tercera vez en este proyecto, siempre por lo mismo: en táctil lo difícil no es
mover la tarjeta, es distinguir tu dedo arrastrando de tu dedo haciendo scroll,
y nada de eso se puede probar con `node`.

**1. Las dos animaciones**

- `diaCompleto(fecha)` en la sección C: función **pura**, y por eso probada. La
  animación no se puede probar (no hay pantalla); la condición que la dispara,
  sí. Esa separación es todo el diseño de este cambio.
- Sin hábitos devuelve `false` a propósito. `every` sobre una lista vacía es
  `true` por lógica, y la app te felicitaría por no tener hábitos.
- El confeti se dispara en `alternarFecha()`, **nunca en `pintar()`**.
  `pintar()` corre al abrir la app, al cambiar de idioma y al sincronizar:
  puesto ahí, saldría confeti cada vez que abrieras la app con el día ya
  terminado. Se exige la **transición** (`!estabaCompleto` antes, completo
  después), no el estado.
- Y se exige que la fecha sea hoy: arreglar un martes desde el calendario no es
  "quedar al día".
- La clase de la animación no se pone directamente sobre el elemento, porque
  `pintar()` rehace las tarjetas desde cero y se la llevaría. Se anota en
  `habitoRecienMarcado` y la aplica `pintar()` al construir la tarjeta — el
  mismo truco que `tareaRecienMovida` ya usaba en Pendientes.
- La capa del confeti (`#confeti`) vive fuera de la lista, en el `<body>`, por
  esa misma razón.
- El azar vive en JavaScript y el movimiento en CSS: cada papelito recibe
  `--dx`, `--giro` y `--dur`, y la animación es una sola. Así el navegador la
  corre en la tarjeta gráfica en vez de que la movamos con un temporizador.
- `prefers-reduced-motion` se respeta en el CSS **y** en JavaScript. En JS es lo
  que evita crear 34 elementos para después esconderlos.
- Color nuevo `--celebrar` en los dos temas (más oscuro en el claro, como pasó
  con el verde). La regla de la v15 sigue en pie: ningún color suelto.

**2. Reordenar Pendientes e Ideas**

- `moverTarea(id, direccion)`. Lo que no se ve a simple vista: `datos.tareas`
  tiene las dos listas mezcladas, así que **subir una posición en pantalla no es
  subir un sitio en el array**. La función anota primero en qué sitios del array
  están las tareas visibles y luego intercambia esos dos.
- Las hechas no se mueven: viven al final por definición.
- Flechas ↑↓ en modo edición, con los extremos apagados en vez de escondidos —
  mismo criterio que los hábitos, para que los botones no cambien de sitio bajo
  el dedo.
- En modo edición se esconde la flecha → de las ideas: con ↑ ↓ ✕ ya son tres
  botones y un cuarto no cabe bien en un iPhone.

**3. Pendientes e Ideas en Postgres**

Se cumplió el plan: primero usarlas unos días, después decidir. Ya se usaron.

- Tabla `tareas`, **una sola** para las dos listas, igual que en la app hay un
  solo array. Con `check (lista in ('pendientes','ideas'))`: lo que en el código
  es una promesa, en la base es una garantía.
- **El detalle que casi cuesta datos.** El `orden` de una tarea es su posición
  en `datos.tareas`, así que todo lo que corre las posiciones obliga a resubir
  las que se movieron. De eso se encarga `encolarTareasDesde(indice)`: borrar la
  tercera corre a la cuarta y la quinta, las anteriores no. Sin eso, dos tareas
  podrían acabar con el mismo `orden` y volver barajadas del otro dispositivo.
- **El otro detalle, peor.** Kev ya había entrado antes de la v16, así que tiene
  `datos.subidaHecha = true` y la subida inicial no vuelve a correr nunca. Sin
  hacer nada, sus tareas no habrían subido jamás y el primer `bajarTodo()` se
  las habría llevado por delante, reemplazándolas por la tabla vacía. Se agregó
  una segunda bandera, `datos.tareasSubidas`. **Cada vez que el modelo crece hay
  que preguntarse qué pasa con quien ya venía usando la app**: los datos nuevos
  casi nunca son el problema, los viejos casi siempre.
- La nota vacía sube como `null`, no como `''`. Guardar una cadena vacía sería
  inventarse un tercer estado que no significa nada.
- `bajarTodo()` ahora reemplaza `datos.tareas` y llama también a `pintarLista()`.
- El SQL, verificado contra la documentación del 7 de agosto, está en el
  **Paso 5 de `PASOS-FASE-3.md`**. Usa `to authenticated` y `(select auth.uid())`,
  que las políticas viejas no tienen: son recomendaciones de rendimiento
  actuales de Supabase, no de seguridad.

**Verificación**

- `pruebas.js`: de 270 a **316**. Un test viejo — *"crear, marcar y mover no
  encola nada"* — hubo que **darlo vuelta**: afirmaba la decisión de la v15 de
  no sincronizar tareas. Un test que defiende una decisión ya cambiada hace que
  un cambio correcto parezca un fallo.
- `pruebas-app.js`: de 53 a **64**. Los nuevos cubren el confeti (que se creen
  los papelitos, que tengan color **en los dos temas** y que "reducir
  movimiento" lo apague de verdad) y el reordenar desde la pantalla.
- **`mini-dom.js` sí se tocó**, dos cosas mínimas que la app pasó a necesitar:
  `style.setProperty` (lo usa el confeti) y leer el atributo `disabled` de un
  `innerHTML` (lo usan las flechas). Y en `pruebas-app.js`, `matchMedia` ahora
  mira **qué** se le pregunta: antes respondía lo mismo a todo, y con el sistema
  en oscuro habría contestado "sí, reduce el movimiento" y el confeti no se
  habría probado nunca.
- `sw.js`: `VERSION` a `'v16'`.

**Pendiente / siguiente**

- [ ] **Correr primero el SQL** del Paso 5 de `PASOS-FASE-3.md` en Supabase, y
      **solo después** publicar la `v16`. Al revés, la app intentaría subir
      tareas a una tabla que no existe y la cola se quedaría atascada
      reintentando ("N cambios esperando" en el panel de Cuenta). No se pierde
      nada, pero confunde.
- [ ] Publicar la `v16` y probar en el iPhone:
      - que la onda del check se vea y no estorbe al marcar rápido varios
      - que el confeti salga **una sola vez** al completar el día, y que no
        vuelva a salir al cerrar y reabrir la app
      - que el confeti se lea bien en tema claro
      - que las flechas de reordenar no queden apretadas junto a la ✕
      - que en **Table Editor** aparezcan tus pendientes e ideas
      - que la cola quede en "Todo sincronizado" después de entrar
- [ ] Sigue pendiente de la v15: probar el tema claro a plena luz y **borrar la
      app y volver a añadirla** para ver el ícono nuevo (iOS lo guarda al
      instalar).
- [ ] Bloqueadores 2, 3 y 4 de "compartir la app" (registros cerrados, sin
      recuperar contraseña, el plan gratuito pausa el proyecto tras 7 días sin
      consultas). El nº 1 lo cerró la v15.
- [ ] Fase 4 sin decidir. Ejercicios 1 y 4 de `COMO-EDITAR.md` y la tanda 7–12.

---

<!-- Plantilla para la próxima entrada:

## AAAA-MM-DD — Título

**Hecho**
-

**Pendiente / siguiente**
- [ ]

-->
