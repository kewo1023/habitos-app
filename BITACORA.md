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

- [ ] Kev sigue `PASOS-GIT.md` y publica el calendario con commit + sync.
- [ ] Probar el calendario en el iPhone: que los 7 cuadros por fila entren bien
      en pantalla y que el modal no quede demasiado alto.
- [ ] Siguiente bloque de Fase 2: estadísticas, metas semanales, o reordenar y
      editar nombre.

---

<!-- Plantilla para la próxima entrada:

## AAAA-MM-DD — Título

**Hecho**
-

**Pendiente / siguiente**
- [ ]

-->
