# Cómo editar la app tú mismo

Manual para perderle el miedo al código. Al final hay 6 ejercicios de dificultad
creciente. Ninguno puede romper nada de forma permanente: siempre puedes deshacer.

---

## 1. Instalar VS Code (5 minutos, una sola vez)

1. Entra a **code.visualstudio.com** → botón azul de descarga (detecta que tienes Mac)
2. Se baja un `.zip`. Haz doble clic y aparece **Visual Studio Code.app**
3. Arrástralo a tu carpeta **Aplicaciones**
4. Ábrelo. La primera vez macOS pregunta si confías en la app: **Abrir**

## 2. Abrir el proyecto

En VS Code: menú **File → Open Folder…** → elige la carpeta `habitos-app` de tu
Escritorio → **Open** → si pregunta si confías en los autores, **Yes**.

A la izquierda aparece la lista de archivos. Haz clic en **`index.html`**.

> Abre la **carpeta**, no el archivo suelto. Así VS Code ve todo el proyecto y
> puedes saltar entre archivos sin volver al Finder.

---

## 3. El ciclo de trabajo

Este es el bucle que vas a repetir cientos de veces:

```
editas  →  ⌘S (guardar)  →  ⌘R en el navegador (recargar)  →  miras el resultado
```

Ten VS Code y el navegador uno al lado del otro. Para ver la app: doble clic en
`index.html` desde el Finder, o clic derecho sobre el archivo en VS Code →
**Reveal in Finder** → doble clic.

> Mientras experimentas trabaja en el **computador**, no en el teléfono. Es mucho
> más rápido. Cuando algo te guste, lo publicas (ver sección 7).

---

## 4. Orientarte dentro del archivo

`index.html` pasa de las 1.700 líneas, pero está organizado. La forma de moverte
**no** es bajar con la rueda del mouse, es **buscar**:

**⌘F** abre el buscador. Escribe un pedazo del texto que buscas y VS Code te lleva.

> **No te fíes de los números de línea de este manual.** Cada cambio los mueve.
> Fíate del texto a buscar: ese no cambia.

El mapa general:

| Zona | Qué hay |
|---|---|
| `<style>` | Todo lo visual: colores, tamaños, espacios |
| `<body>` | La estructura: cabecera, botones, y las dos ventanas emergentes |
| `<script>` | La lógica, en secciones **A** a **M** |
| `<script type="module">` | Tres líneas al final: la librería de Supabase |

Dentro del `<script>`, cada sección tiene un título en un comentario:

| | |
|---|---|
| **A** | guardar y leer datos, y la cola de pendientes |
| **B** | fechas |
| **C** | consultas: rachas, estadísticas, conteos |
| **D** | acciones: marcar, crear, borrar, renombrar, mover |
| **E** | pintar la pantalla |
| **F** | ventana de nuevo hábito |
| **G** | modo edición |
| **H** | copia de seguridad |
| **I** | funcionar sin internet |
| **J** | botones de copia |
| **L** | el calendario en pantalla |
| **M1–M7** | la nube: errores, entrar/salir, arrancar, panel, traductores, subir/bajar, el ciclo |
| **K** | arrancar (va de último a propósito: es la línea que enciende todo) |

Busca `---------- E.` con ⌘F y caes justo en la sección E.

**Los comentarios no hacen nada.** Todo lo que está entre `/*` y `*/`, o después
de `//`, es texto para humanos. Puedes escribir los tuyos sin miedo.

---

## 5. Los ejercicios

Haz uno, guarda, recarga, míralo. Luego el siguiente.

> **Ya hiciste tres.** Los ejercicios 2, 5 y 6 están marcados como hechos, con lo
> que quedó en el código. Te faltan el 1, el 3 y el 4 — los tres son de edición
> directa, sin lógica. Y al final hay tres nuevos, más difíciles, sobre el código
> que construimos después.

### Ejercicio 1 — Cambiar el color principal 🟢 fácil

⌘F → busca `--acento:`

```css
--acento:       #5b8def;    /* azul */
```

Cambia ese código por otro. Prueba `#ff6b6b` (rojo coral), `#a78bfa` (morado),
`#f59e0b` (ámbar). En VS Code aparece un cuadrito de color al lado: haz clic y te
abre un selector visual.

**Por qué funciona en todas partes a la vez:** ese valor está definido una sola
vez en `:root` y el resto del archivo lo usa como `var(--acento)`. Es exactamente
como una celda de Excel a la que apuntan cien fórmulas: cambias la celda y cambia
todo. Lo mismo aplica para `--exito` (el verde de los días cumplidos) y `--fondo`.

### Ejercicio 2 — Mostrar 14 días en vez de 7 ✅ hecho

⌘F → busca `for (let i = 13`

```js
for (let i = 13; i >= 0; i--) {
```

Lo cambiaste de `6` a `13`. Ese bucle cuenta hacia atrás desde *hace i días*
hasta hoy (`i = 0`), así que con 13 son 14 días contando el cero.

**Ojo si quieres subirlo más.** También cambiaste el tamaño de los puntos a
`11px`, y con 14 ya van justos. Busca `.dia {`: ahora dice `flex: 0 1 11px`, que
significa *"mide 11px, pero encoge si no cabes"*. Si pones 20 días, los puntos se
van a encoger solos hasta el `min-width: 6px`. Si necesitas más, baja ese `11px`
— es el tamaño ideal, no un límite.

### Ejercicio 3 — Poner tus propios emojis 🟢 fácil

⌘F → busca `const EMOJIS`

```js
const EMOJIS = ['💪','📖','💧','🧘','🏃','🥗','😴','✍️','🎸','🧠','🌅','🚭','💊','🧹','📵','☎️'];
```

Es una **lista**: elementos entre comillas, separados por comas, todo dentro de
`[ ]`. Cambia los que no uses por los tuyos (**⌃⌘Espacio** abre el selector de
emojis del Mac).

**El error clásico:** dejar una coma suelta o quitar unas comillas. Si la app
aparece en blanco después de este ejercicio, es eso. Mira la sección 6.

### Ejercicio 4 — Cambiar los textos 🟢 fácil

⌘F → busca `Aún no tienes hábitos`. Escribe lo que quieras.

Busca también `Mis Hábitos` (el título) y `+ Nuevo hábito` (el botón).

El `<br>` que ves en medio del texto es un salto de línea. Puedes moverlo o quitarlo.

### Ejercicio 5 — Que la racha aparezca solo desde 3 días ✅ hecho

⌘F → busca `🔥`

```js
<span class="racha">${racha > 2 ? '🔥 ' + racha : ''}</span>
```

Cambiaste `racha > 0` por `racha > 2`.

**Cómo se lee esa línea:** `condición ? esto : lo otro` es un "si… entonces…
si no…" comprimido. Se lee *"¿la racha es mayor que 2? entonces muestra 🔥 y el
número; si no, no muestres nada (`''` es texto vacío)"*.

Si quieres cambiar el 🔥 por otro emoji, es ahí mismo.

### Ejercicio 6 — Un mensaje distinto según la hora ✅ hecho

Este era escribir código nuevo, y lo escribiste tú. ⌘F → busca `Saludo según la
hora`:

```js
  const hora = new Date().getHours();
  let saludo = 'Buenas noches';
  if (hora < 12) saludo = 'Buenos días';
  else if (hora < 19) saludo = 'Buenas tardes';
  document.querySelector('.titulo').textContent = saludo + ', Kev';
```

**Qué aprendiste aquí:** declarar variables (`const`, `let`), condicionales
(`if` / `else if`) y modificar un elemento de la pantalla desde JavaScript.

---

## 5b. Tres ejercicios nuevos

Sobre el código que vino después. Ninguno toca la sincronización.

### Ejercicio 7 — Cambiar cuántos días miden las estadísticas 🟡 medio

⌘F → busca `Últimos 30 días`. Vas a caer en una lista llamada `ESTADISTICAS`,
donde cada estadística es un objeto con tres cosas: su etiqueta, cómo se calcula
y qué explica.

Cambia el `30` por `7` en los **tres** sitios de ese bloque: la etiqueta, el
cálculo `porcentajeUltimos(id, 30)` y el texto de ayuda.

**Por qué está hecho así:** toda la definición vive en un solo sitio. El código
que dibuja los recuadros no sabe cuántas estadísticas hay ni qué miden — solo
recorre la lista. Por eso agregar una cuarta o una quinta no obliga a tocar el
dibujado.

### Ejercicio 8 — Agregar una estadística nueva 🔴 difícil

En esa misma lista `ESTADISTICAS`, agrega un objeto más antes del `]` final:

```js
  ,{
    etiqueta: 'Días fallados',
    calcular: id => diasDeVida(id) - totalDias(id),
    ayuda: 'Días que existió el hábito y no lo marcaste.'
  }
```

Guarda, recarga, abre el calendario de un hábito: aparece un quinto recuadro y se
acomoda solo.

**Lo que estás usando:** `diasDeVida` y `totalDias` ya existen en la sección C.
No escribiste lógica nueva, combinaste dos piezas que ya estaban. Eso es lo que
hace que valga la pena tener funciones pequeñas y con nombre claro.

### Ejercicio 9 — Correr las pruebas 🟢 fácil pero importante

Este no es de editar, es de comprobar. Terminal, y dentro de la carpeta:

```
node pruebas.js
```

Deben salir 129 líneas en ✅. **Hazlo después de los ejercicios 7 y 8**: si
rompiste algo de la lógica, aquí te enteras en dos segundos en vez de
descubrirlo dentro de una semana con las rachas mal contadas.

Si sale algún ❌, el texto de la línea te dice qué dejó de funcionar.

---

## 6. Qué hacer cuando rompas algo

Vas a romper cosas. Es parte del asunto y no es grave.

**Si la app aparece en blanco o no responde:**

1. En el navegador: clic derecho → **Inspeccionar** → pestaña **Console**
2. Vas a ver una línea roja tipo `Uncaught SyntaxError: ... (index.html:562)`
3. Ese número final es **la línea del problema**. En VS Code, **⌃G** te lleva a
   una línea específica
4. Mira una o dos líneas *antes* también: los errores de sintaxis suelen
   señalar donde el navegador se dio cuenta, no donde está la falla

**Los tres errores del 90% de los casos:**

- Falta una coma entre elementos de una lista, o sobra una al final
- Falta una comilla de cierre `'`
- Se borró una llave `}` o un paréntesis `)`

VS Code ayuda: pinta las llaves que hacen pareja y subraya en rojo ondulado lo
que no cuadra. Si ves rojo, ahí está.

**Para deshacer:**

- **⌘Z** cuantas veces necesites — funciona incluso después de guardar
- Si ya no sabes qué tocaste: **Source Control** (`⌃⇧G`) → clic en `index.html`
  → ahí ves exactamente qué cambiaste, en verde y rojo, contra la última versión
  publicada. Y con el botón **↩︎ Discard Changes** vuelves a esa versión
- Si ya hiciste commit: en la vista **Graph** del mismo panel, clic en cualquier
  punto del historial te muestra los archivos de ese momento

**Regla de oro:** un cambio, guarda, recarga. Si haces cinco cambios de una y algo
se rompe, no sabes cuál fue.

---

## 7. Cuando quieras publicar tus cambios

Lo que edites en el Escritorio **no** llega solo al teléfono. Para publicarlo:

1. Abre `sw.js` y **sube el número de `VERSION`** (`'v8'` → `'v9'`). Sin esto el
   iPhone puede seguir mostrando la versión vieja. Es el paso que más se olvida
2. **Source Control** (`⌃⇧G`) → escribe qué hiciste → **✓ Commit**
3. **Sync Changes**
4. Espera ~1 minuto y abre la app en el iPhone

Los detalles están en `PASOS-GIT.md`.

> **Si algo falla al publicar**, lo primero que hay que revisar es con qué cuenta
> de GitHub está el navegador. Tienes una vieja (`kev1023`) y la buena
> (`kewo1023`), y GitHub autoriza con la sesión del navegador, no con lo que diga
> git. Eso ya nos costó un rato una vez.

---

## 8. Atajos de VS Code que vale la pena memorizar

| Atajo | Qué hace |
|---|---|
| **⌘S** | Guardar |
| **⌘F** | Buscar en el archivo |
| **⌘Z** | Deshacer |
| **⌃G** | Ir a una línea por número |
| **⌘/** | Comentar o descomentar la línea (para desactivar algo sin borrarlo) |
| **⌥↑ / ↓** | Mover la línea completa arriba o abajo |
| **⌘⇧K** | Borrar la línea completa |

**⌘/** es el más útil de todos para experimentar: te deja apagar un pedazo de
código temporalmente, ver qué pasa, y volverlo a encender.
