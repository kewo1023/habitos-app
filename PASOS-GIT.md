# Publicar con git desde VS Code

Hasta ahora publicabas arrastrando archivos a la web de GitHub. Esto lo
reemplaza: escribes, tocas un botón, y en un minuto está en tu teléfono.

Se hace **una sola vez**. Después son 3 clics por publicación.

---

## Antes de empezar: qué es git, en una frase

Git es un **historial de versiones** de tu carpeta. Cada vez que guardas un
avance (un *commit*), git anota exactamente qué cambió y te deja volver atrás.

Piénsalo como el historial de versiones de un archivo, pero para la carpeta
entera y con un mensaje escrito por ti en cada punto de guardado.

Hay dos copias del proyecto: la de tu Mac y la de GitHub. Los verbos clave:

| Palabra | Qué hace |
|---|---|
| **commit** | Guardar un punto en el historial, en tu Mac |
| **push** | Mandar tus commits a GitHub |
| **pull** | Traerte lo que haya en GitHub |
| **sync** | Hacer pull y push de un golpe. Es el botón que vas a usar |

Publicar = commit + sync.

---

## Paso 1 — Instalar git

macOS lo trae casi listo. Ábrelo así:

1. `⌘ + Espacio`, escribe `Terminal`, Enter
2. Escribe esto y dale Enter:

```
git --version
```

- Si responde algo como `git version 2.39.5` → ya lo tienes, sigue al Paso 2.
- Si sale una ventana ofreciendo instalar las *Command Line Tools* → dale
  **Instalar** y espera (unos minutos). Al terminar, repite el comando.

Esta es la única vez que necesitas la Terminal. Puedes cerrarla después.

---

## Paso 2 — Decirle a git quién eres

Cada commit queda firmado con un nombre y un correo. En la misma Terminal,
cambiando lo que va entre comillas por lo tuyo:

```
git config --global user.name "Kev"
git config --global user.email "tucorreo@ejemplo.com"
```

Usa **el mismo correo de tu cuenta de GitHub**. Si no, los commits aparecen
como de un desconocido.

Ya puedes cerrar la Terminal.

---

## Paso 3 — Abrir la carpeta en VS Code

1. Abre VS Code
2. Menú **File → Open Folder…**
3. Elige `Desktop/habitos-app` → **Open**

A la izquierda deberías ver la lista de archivos del proyecto.

---

## Paso 4 — Conectar la carpeta con tu repo de GitHub

Ahora mismo tu carpeta y tu repo de GitHub no se conocen. Los presentamos.

1. En la barra de la izquierda, el ícono de **Source Control** (tres puntos
   unidos por líneas, el tercero de arriba abajo). O `⌃ + ⇧ + G`.
2. Botón **Publish to GitHub**.
   - Si te pide iniciar sesión: dale **Allow**, se abre el navegador, autorizas
     con tu cuenta de GitHub y vuelves solo a VS Code. Sin contraseñas que
     copiar ni tokens.
3. Te va a preguntar el nombre del repositorio. **Aquí ojo:** ya tienes uno
   llamado `habitos-app` con la app publicada. Escribe **exactamente**
   `habitos-app` y elige **público**.

> **Si te dice que ese nombre ya existe:** es lo esperado. Entonces salta a la
> sección "Si Publish falla" al final de este archivo — es un comando de
> Terminal, uno solo, y quedas igual.

---

## Paso 5 — El ciclo de todos los días

Este es el que vas a repetir. Cuando termines de editar:

1. **Source Control** (`⌃ + ⇧ + G`). Verás la lista de archivos cambiados.
   Clic en cualquiera te muestra el *diff*: verde lo agregado, rojo lo quitado.
   Vale la pena mirarlo, es la mejor forma de cachar un cambio accidental.
2. En la cajita de arriba escribe **qué hiciste**. Ej:
   `Calendario mensual por hábito`
3. Botón **✓ Commit**.
   - Si pregunta por *staging*, dile **Yes** (significa "incluye todo lo
     cambiado en este commit").
4. Botón **Sync Changes** (o **Publish Branch** la primera vez).

Espera ~1 minuto y refresca la app en el iPhone. GitHub Pages tarda un poco en
reconstruir el sitio.

**No olvides:** si cambiaste `index.html`, sube antes el número de `VERSION` en
`sw.js` (`'v4'` → `'v5'`). Si no, el iPhone puede seguir mostrando la versión
vieja. Es el paso que más se olvida.

---

## Qué ganas con esto

- Publicar deja de ser arrastrar 6 archivos y pasa a ser un botón.
- Puedes **romper la app sin miedo**: cada commit es un punto de retorno.
  Para volver atrás: Source Control → menú `…` → **Undo Last Commit**, o en
  GitHub, pestaña *Commits*, ver cualquier versión anterior.
- El historial cuenta la historia del proyecto: cuándo hiciste qué.

---

## Si "Publish to GitHub" falla porque el repo ya existe

Un solo comando conecta tu carpeta con el repo que ya tienes. En la Terminal,
reemplazando `TU-USUARIO` por tu usuario de GitHub:

```
cd ~/Desktop/habitos-app
git init
git remote add origin https://github.com/TU-USUARIO/habitos-app.git
git branch -M main
git add .
git commit -m "Traer el proyecto desde el Mac"
git pull origin main --allow-unrelated-histories
git push -u origin main
```

Qué hace cada línea:

| Línea | Qué hace |
|---|---|
| `cd` | Entrar a la carpeta |
| `git init` | Convertir la carpeta en un repositorio |
| `git remote add origin` | Anotar la dirección de la copia en GitHub |
| `git branch -M main` | Nombrar la rama principal `main` (lo que espera GitHub) |
| `git add .` | Marcar todos los archivos para el próximo commit |
| `git commit -m` | Guardar el punto en el historial, con mensaje |
| `git pull … --allow-unrelated-histories` | Traer lo que ya hay en GitHub y mezclarlo. La opción larga es porque las dos copias nacieron por separado |
| `git push -u origin main` | Mandarlo todo a GitHub |

Si el `pull` abre un editor de texto raro pidiendo un mensaje: escribe `:wq` y
Enter. Es `vim`, y eso significa "guardar y salir".

Después de esto, VS Code ya reconoce el repo y sigues con el Paso 5 normal.
