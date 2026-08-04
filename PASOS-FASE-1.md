# Fase 1 — Poner la app en tu iPhone

Tiempo: unos 20 minutos la primera vez. Después, actualizarla toma 30 segundos.

**Qué vamos a hacer:** subir los archivos a GitHub (gratis), que te da una
dirección web `https://...`. Luego abres esa dirección en Safari del iPhone y la
agregas a la pantalla de inicio. Queda con ícono propio, a pantalla completa y
funcionando sin internet. Indistinguible de una app descargada de la App Store.

**Por qué hace falta una dirección web:** iOS solo deja "instalar" páginas que
vienen de una URL segura (https). Un archivo suelto en el computador no sirve.

---

## Antes de empezar: ¿mis datos quedan públicos?

No. El repositorio de GitHub es público, sí, pero lo único público es el **código**
— el mismo que ya tienes abierto. Tus hábitos y tu historial nunca salen de tu
teléfono: viven en el almacenamiento local del navegador, no se suben a ningún
lado. Nadie más los ve, ni siquiera GitHub.

---

## Paso 1 — Crear la cuenta de GitHub

1. Abre **github.com/signup**
2. Correo, contraseña, nombre de usuario. Anota tu usuario, lo vas a necesitar.
3. Plan **Free**. No pide tarjeta.

Si ya tienes cuenta, salta al Paso 2.

---

## Paso 2 — Crear el repositorio

Un "repositorio" (o *repo*) es simplemente una carpeta de proyecto en GitHub.

1. Arriba a la derecha, el botón **+** → **New repository**
2. **Repository name:** `habitos-app`
3. Déjalo en **Public**
4. **No** marques "Add a README file" (ya tenemos nuestros archivos)
5. Botón verde **Create repository**

Te va a quedar una página que dice "Quick setup". No cierres esa pestaña.

---

## Paso 3 — Subir los archivos

En esa página busca el enlace **"uploading an existing file"** (está en la frase
*"…or upload an existing file"*). Haz clic.

1. Abre la carpeta `habitos-app` de tu Escritorio en el Finder
2. Selecciona **estos 6 archivos** y arrástralos a la zona de GitHub:

   - `index.html`
   - `manifest.json`
   - `sw.js`
   - `icono-180.png`
   - `icono-192.png`
   - `icono-512.png`

   > Importante: arrastra **los archivos**, no la carpeta. Y no subas la
   > carpeta entera con `GUIA.md` y `pruebas.js` — esos son para ti, no estorban
   > si los subes, pero no hacen falta.

3. Abajo, en **Commit changes**, escribe: `Primera versión`
4. Botón verde **Commit changes**

Acabas de hacer tu primer *commit*. Un commit es una foto del proyecto en un
momento dado; GitHub las guarda todas, así que siempre puedes volver atrás.

---

## Paso 4 — Encender GitHub Pages

Esto es lo que convierte el repo en una página web de verdad.

1. En tu repo, pestaña **Settings** (arriba a la derecha)
2. Menú de la izquierda: **Pages**
3. En **Source**, elige **Deploy from a branch**
4. En **Branch**, elige **main** y carpeta **/ (root)** → **Save**
5. Espera 1 o 2 minutos y recarga la página. Va a aparecer arriba:

   > Your site is live at `https://TU-USUARIO.github.io/habitos-app/`

Esa es tu app. Ábrela en el computador para confirmar que carga.

Si sale error 404, espera un minuto más y recarga; la primera publicación a veces
se demora.

---

## Paso 5 — Instalarla en el iPhone

**Tiene que ser Safari.** Chrome en iOS no puede agregar a la pantalla de inicio.

1. Abre `https://TU-USUARIO.github.io/habitos-app/` en **Safari**
2. Toca el botón **Compartir** (el cuadrito con la flecha hacia arriba, abajo al centro)
3. Desliza hacia abajo → **Agregar a pantalla de inicio**
4. El nombre ya dice "Hábitos". Toca **Agregar**

Listo. Ahora tienes el ícono en tu pantalla de inicio. Ábrelo desde ahí — no
desde Safari — y vas a ver que no tiene barra de direcciones ni botones del
navegador.

**Pruébalo:** activa modo avión y ábrela. Debe funcionar igual.

---

## Paso 6 — Cómo actualizarla de ahora en adelante

Cuando cambiemos algo del código:

1. En tu repo de GitHub, clic en el archivo (ej. `index.html`)
2. El ícono de **lápiz** arriba a la derecha
3. Pega el contenido nuevo → **Commit changes**
4. Espera ~1 minuto y abre la app en el iPhone

> Si cambiaste algo y la app sigue viéndose igual: abre `sw.js` y sube el número
> de `VERSION` (`'v1'` → `'v2'`). Eso le avisa al iPhone que bote la copia vieja.

Cuando esto te empiece a dar pereza, dime y montamos Git en tu Mac: pasa a ser un
solo comando desde la Terminal.

---

## Una advertencia honesta sobre los datos

Tus hábitos se guardan solo en el teléfono. Eso significa:

- Si borras la app de la pantalla de inicio, **pierdes el historial**
- Si cambias de teléfono, no se lleva nada
- iOS a veces limpia el almacenamiento de apps web que llevan mucho sin abrirse

Mientras la uses a diario no hay problema, pero por eso las dos siguientes
prioridades del proyecto son: **exportar los datos a un archivo** (Fase 2,
rápido de hacer) y **sincronizar con la nube** (Fase 3, la solución de fondo).

Si algo se atasca en cualquiera de estos pasos, dime en qué paso vas y qué ves en
pantalla.
