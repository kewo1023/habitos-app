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

`index.html` tiene unas 600 líneas, pero está organizado. La forma de moverte
**no** es bajar con la rueda del mouse, es **buscar**:

**⌘F** abre el buscador. Escribe un pedazo del texto que buscas y VS Code te lleva.

El mapa general:

| Zona | Líneas aprox. | Qué hay |
|---|---|---|
| `<style>` | 30 – 300 | Todo lo visual: colores, tamaños, espacios |
| `<body>` | 315 – 400 | La estructura: cabecera, botones, ventana de nuevo hábito |
| `<script>` | 405 – 620 | La lógica, en secciones **A** a **K** |

Dentro del `<script>`, cada sección tiene un título en un comentario:

- **A** guardar y leer datos · **B** fechas · **C** consultas · **D** acciones
- **E** pintar la pantalla · **F** ventana de nuevo hábito · **G** modo edición
- **H** copia de seguridad · **I** sin internet · **J** botones de copia · **K** arrancar

Busca `---------- E.` con ⌘F y caes justo en la sección E.

**Los comentarios no hacen nada.** Todo lo que está entre `/*` y `*/`, o después
de `//`, es texto para humanos. Puedes escribir los tuyos sin miedo.

---

## 5. Los seis ejercicios

Haz uno, guarda, recarga, míralo. Luego el siguiente.

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

### Ejercicio 2 — Mostrar 14 días en vez de 7 🟢 fácil

⌘F → busca `for (let i = 6`

```js
for (let i = 6; i >= 0; i--) {
```

Cámbialo a `13`. Guarda, recarga: ahora hay 14 puntitos.

**Por qué:** ese bucle cuenta hacia atrás desde *hace i días* hasta hoy (`i = 0`).
Con 6 son 7 días contando el cero. Con 13, son 14.

Si se ven apretados, busca `.dia {` en el `<style>` y baja `width` y `height` de
`9px` a `7px`.

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

### Ejercicio 5 — Que la racha aparezca solo desde 3 días 🟡 medio

⌘F → busca `🔥`

```js
<span class="racha">${racha > 0 ? '🔥 ' + racha : ''}</span>
```

Cámbialo a `racha > 2`.

**Cómo se lee esa línea:** `condición ? esto : lo otro` es un "si… entonces…
si no…" comprimido. Se lee *"¿la racha es mayor que 0? entonces muestra 🔥 y el
número; si no, no muestres nada (`''` es texto vacío)"*.

Y ya que estás, cambia el 🔥 por el emoji que quieras.

### Ejercicio 6 — Un mensaje distinto según la hora 🟡 medio

Este ya es escribir código nuevo. ⌘F → busca `getElementById('fecha')`. Esa
instrucción ocupa **dos líneas** y termina en `);`. Agrega tu código justo
**después de ese punto y coma**:

```js
  // Saludo según la hora del día
  const hora = new Date().getHours();
  let saludo = 'Buenas noches';
  if (hora < 12) saludo = 'Buenos días';
  else if (hora < 19) saludo = 'Buenas tardes';
  document.querySelector('.titulo').textContent = saludo + ', Kev';
```

Guarda, recarga. El título ahora te saluda.

**Qué aprendiste aquí:** declarar variables (`const`, `let`), condicionales
(`if` / `else if`) y modificar un elemento de la pantalla desde JavaScript. Con
eso ya puedes hacer bastante.

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
- Si ya no sabes qué tocaste: en GitHub, entra a `index.html` → botón **History**
  → elige una versión anterior → copia el contenido y pégalo encima

**Regla de oro:** un cambio, guarda, recarga. Si haces cinco cambios de una y algo
se rompe, no sabes cuál fue.

---

## 7. Cuando quieras publicar tus cambios

Lo que edites en el Escritorio **no** llega solo al teléfono. Para publicarlo:

1. Abre `sw.js` y sube el número de `VERSION` (`'v2'` → `'v3'`). Sin esto el
   iPhone puede seguir mostrando la versión vieja
2. En GitHub, entra a tu repo → clic en `index.html` → ícono del **lápiz**
3. En VS Code selecciona todo (**⌘A**) y copia (**⌘C**); en GitHub selecciona
   todo y pega encima
4. **Commit changes**. Repite con `sw.js`
5. Espera ~1 minuto y abre la app en el iPhone

Cuando esto te canse, dime y montamos git: pasa a ser un comando de una línea.

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
