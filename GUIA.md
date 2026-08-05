# Mis Hábitos — guía del proyecto

Proyecto personal de Kev. Una app de seguimiento de hábitos, construida desde
cero, pensada para durar años y para ir aprendiendo programación en el camino.

**Estado: funcionando.** Instalada en el iPhone, con los datos sincronizados a
una base de datos real. Las fases 0 a 3 están cerradas.

---

## 1. Por qué este camino y no otro

Querías una app para iPhone, solo para ti, y aprender mientras la construyes.
Había tres caminos:

| Camino | Qué implica | Veredicto |
|---|---|---|
| App nativa de iOS (Swift + Xcode) | Lenguaje nuevo, Xcode, y 99 USD/año a Apple para tenerla en tu teléfono más de 7 días | Demasiada fricción para arrancar |
| React Native / Expo | Instalar Node, cientos de archivos, dependencias que se rompen | Buen destino, mal punto de partida |
| **Web app instalable (PWA)** ← el elegido | **Un solo archivo. Se agrega a la pantalla de inicio y se ve igual que una app: ícono propio, pantalla completa, funciona sin internet** | **Empezaste el mismo día, gratis** |

Visto en retrospectiva, la apuesta salió bien: hoy tienes una app que usas a
diario, y aprendiste HTML, CSS, JavaScript, git y SQL en el proceso. Si algún día
quieres una app nativa, el 80% del conocimiento se traslada.

---

## 2. Dónde vive todo

| Sitio | Qué hay |
|---|---|
| `~/Desktop/habitos-app` | El código, en tu Mac. Aquí editas |
| `github.com/kewo1023/habitos-app` | El código publicado. De aquí sale la página |
| `kewo1023.github.io/habitos-app` | La app en vivo. Esta es la que abres |
| Supabase, proyecto `habitos_app` | Tus datos: hábitos y días marcados |

**Para probar cambios**: doble clic en `index.html` en el Mac. Se abre en el
navegador y funciona (sin sincronizar, porque falta el `https`). Para verla como
en el teléfono: clic derecho → Inspeccionar → modo de vista móvil.

**Para publicar**: commit + Sync en VS Code. Los pasos están en `PASOS-GIT.md`.

---

## 3. Cómo está hecha por dentro

Todo vive en `index.html`, dividido en tres bloques:

- **`<style>`** — cómo se ve. Los colores están todos juntos arriba, en `:root`.
  Cambia `--acento` y cambia toda la app.
- **`<body>`** — la estructura: cabecera, lista, botones, las dos ventanas
  emergentes (nuevo hábito y calendario).
- **`<script>`** — la lógica, en secciones con títulos en comentarios.

Al final del archivo hay un segundo `<script type="module">` de tres líneas: es
lo único que se baja de internet, la librería de Supabase. Si no carga, la app
funciona igual con los datos del teléfono.

### Los datos (aquí es donde tu SQL sirve)

En el teléfono se guarda un objeto con dos "tablas" y una cola:

```js
{
  habitos: [
    { id: "a3f...", nombre: "Leer 20 min", emoji: "📖", creado: "2026-08-01" }
  ],
  registros: {
    "2026-08-01": ["a3f...", "b7c..."],   // qué hábitos se marcaron ese día
    "2026-07-31": ["a3f..."]
  },
  pendientes: [ ... ]                     // cambios que faltan por subir
}
```

En Supabase, lo mismo pero de verdad:

```sql
CREATE TABLE habitos (
  id      uuid PRIMARY KEY,
  usuario uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  nombre  text, emoji text, creado date, orden int
);

CREATE TABLE registros (
  usuario   uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  habito_id uuid REFERENCES habitos(id) ON DELETE CASCADE,
  fecha     date,
  PRIMARY KEY (habito_id, fecha)
);
```

**La diferencia que más se nota:** en el teléfono guardas *"el 1 de agosto se
marcaron estos hábitos"*; en Postgres hay **una fila por cada marca**. Por eso
`filasARegistros()` existe: traduce de una forma a la otra. Es un `GROUP BY
fecha` escrito a mano.

Y esa `PRIMARY KEY (habito_id, fecha)` hace **imposible** marcar dos veces el
mismo día. No lo valida el código: lo impide la base de datos.

### Las dos ideas centrales del código

> **Los datos son la única verdad.** Cuando cambian, se vuelve a dibujar toda la
> pantalla desde cero.

Por eso casi toda función termina llamando a `guardar()` y `pintar()`. Es menos
"eficiente" que actualizar solo el pedacito que cambió, pero es imposible que la
pantalla quede desincronizada — y esa es la fuente número uno de bugs raros.

> **El teléfono manda; la nube va detrás.**

Marcar un hábito nunca espera a internet. El cambio se guarda local y se anota en
la cola de pendientes. Si hay señal, sube en un segundo; si no, espera. Y solo se
baja de la nube **cuando la cola está vacía**: bajar con cambios sin subir haría
que la nube pisara lo tuyo.

---

## 4. Verificar que nada se rompió

`pruebas.js` revisa toda la lógica pura: rachas, fechas, estadísticas, la cola de
sincronización, los traductores. Desde la Terminal, dentro de esta carpeta:

```
node pruebas.js
```

Son 129 pruebas y deben salir todas en ✅. Vale la pena correrlo cada vez que se
cambie la lógica.

---

## 5. Hoja de ruta

**Fase 0 — v0.1 ✅** Agregar hábitos, marcarlos, racha, historial, borrar.

**Fase 1 — En el teléfono ✅** GitHub Pages e instalada en la pantalla de inicio.
*Aprendiste: cómo se publica algo en internet.*

**Fase 2 — Agradable de usar a diario ✅** Exportar/importar, calendario mensual
con corrección de días pasados, estadísticas, reordenar y renombrar.
*Aprendiste: fechas, arrays, estructuras de datos, CSS grid.*

Las metas semanales quedaron aplazadas: todos tus hábitos son diarios.

**Fase 3 — Sincronizar ✅** Supabase (Postgres), login, y sincronización con cola
de pendientes para funcionar sin señal.
*Aprendiste: bases de datos, llaves primarias y foráneas, seguridad por filas,
autenticación, APIs.*

**Fase 4 — Opcional, si algún día quieres**
Recordatorios, app nativa con Capacitor (widgets, Apple Health), o reescribirla
en React para aprender un framework.

**Nada de esto hace falta.** La app está terminada en el sentido que importa: la
usas todos los días y tus datos están seguros.

---

## 6. Los otros archivos

| Archivo | Para qué |
|---|---|
| `COMO-EDITAR.md` | Manual de VS Code y ejercicios para editar el código tú mismo |
| `PASOS-GIT.md` | Publicar cambios con commit + Sync |
| `PASOS-FASE-1.md` | Cómo se montó GitHub Pages (histórico) |
| `PASOS-FASE-3.md` | Cómo se montó Supabase, y el anexo para cambiar el login |
| `BITACORA.md` | Qué se hizo en cada sesión y por qué |
| `CLAUDE.md` | Contexto para que yo retome sin que me lo repitas |

---

## 7. Cómo seguir trabajando conmigo

Esta carpeta vive en tu Escritorio y persiste entre conversaciones. En cualquier
sesión nueva, invoca `/habitos-app` o dime "sigamos con la app de hábitos" y
retomo desde donde quedamos. Pídeme cosas como:

- "Explícame qué hace `sincronizar()` línea por línea"
- "Rompí algo, mira el error"
- "Quiero agregar [lo que sea]"
- "¿Por qué decidimos [tal cosa] así?" — está en `BITACORA.md`
