# Mis Hábitos — guía del proyecto

Proyecto personal de Kev. Una app de seguimiento de hábitos, construida desde cero,
pensada para durar años y para ir aprendiendo programación en el camino.

---

## 1. Por qué este camino y no otro

Querías una app para iPhone, solo para ti, y aprender mientras la construyes.
Hay tres caminos posibles:

| Camino | Qué implica | Veredicto |
|---|---|---|
| App nativa de iOS (Swift + Xcode) | Aprender un lenguaje nuevo, Xcode, y pagar 99 USD/año a Apple para tenerla en tu teléfono más de 7 días | Demasiada fricción para arrancar |
| React Native / Expo | Instalar Node, un proyecto con cientos de archivos, dependencias que se rompen | Buen destino, mal punto de partida |
| **Web app instalable (PWA)** ← el elegido | **Un solo archivo. Se abre en Safari, se agrega a la pantalla de inicio y se ve igual que una app: ícono propio, pantalla completa, funciona sin internet** | **Empiezas hoy, gratis, sin instalar nada** |

Lo importante: aprendes HTML, CSS y JavaScript, que son la base de casi todo lo
demás. Si algún día quieres una app nativa de verdad, el 80% del conocimiento se
traslada.

---

## 2. Cómo probarla ahora mismo (en el Mac)

Haz doble clic en `index.html`. Se abre en tu navegador y ya funciona.
Para verla como se verá en el teléfono: clic derecho → Inspeccionar → activa el
modo de vista móvil.

Los datos se guardan en tu navegador. Si la abres en el Mac y en el iPhone, cada
uno tendrá su propia información (por ahora — eso lo resolvemos en la Fase 3).

---

## 3. Cómo llevarla al iPhone (Fase 1, el próximo paso)

Para agregarla a la pantalla de inicio, el iPhone necesita una dirección web.
La forma gratuita es GitHub Pages: subes el archivo a GitHub y él te da una URL.
Toma unos 20 minutos la primera vez, y de ahí en adelante actualizar es
cuestión de segundos.

Cuando quieras hacerlo, dime **"vamos con la Fase 1"** y te guío paso a paso.

---

## 4. Cómo está hecha por dentro

Todo vive en `index.html`, dividido en tres bloques:

- **`<style>`** — cómo se ve. Los colores están todos juntos arriba, en `:root`.
  Cambia `--acento` y cambia toda la app.
- **`<body>`** — la estructura: la cabecera, la lista vacía, los botones.
- **`<script>`** — la lógica, ordenada en secciones A hasta H con comentarios.

### Los datos (aquí es donde tu SQL sirve)

Guardamos un solo objeto con dos "tablas":

```js
{
  habitos: [
    { id: "a3f...", nombre: "Leer 20 min", emoji: "📖", creado: "2026-08-01" }
  ],
  registros: {
    "2026-08-01": ["a3f...", "b7c..."],   // qué hábitos se marcaron ese día
    "2026-07-31": ["a3f..."]
  }
}
```

Si esto fuera SQL, sería:

```sql
CREATE TABLE habitos   (id TEXT PRIMARY KEY, nombre TEXT, emoji TEXT, creado DATE);
CREATE TABLE registros (habito_id TEXT, fecha DATE, PRIMARY KEY (habito_id, fecha));
```

Es exactamente el mismo modelo, solo que guardado como texto en el teléfono en
vez de en un motor de base de datos. Cuando lleguemos a la Fase 3 y quieras
sincronizar entre dispositivos, migraremos a Postgres y ese `CREATE TABLE` de
arriba será literalmente lo que escribamos.

### La idea central del código

> Los datos son la única verdad. Cuando cambian, se vuelve a dibujar toda la
> pantalla desde cero.

Por eso casi toda función termina llamando a `guardar()` y `pintar()`. Es menos
"eficiente" que actualizar solo el pedacito que cambió, pero es imposible que la
pantalla quede desincronizada de los datos — y esa es la fuente número uno de
bugs raros en apps.

---

## 5. Cosas que puedes cambiar tú mismo hoy

Buenos primeros experimentos. Guarda el archivo y recarga el navegador:

1. **Cambiar el color principal** — línea `--acento: #5b8def;` en `<style>`.
2. **Agregar emojis a la lista** — busca `const EMOJIS = [...]` y mete los tuyos.
3. **Cambiar el texto vacío** — busca `"Aún no tienes hábitos"`.
4. **Mostrar 14 días en vez de 7** — en la sección E, busca `for (let i = 6; i >= 0; i--)`
   y cámbialo por `13`.

Si rompes algo: el navegador te lo dice. Clic derecho → Inspeccionar → pestaña
"Console". Los errores en rojo casi siempre dicen la línea exacta.

---

## 6. Verificar que nada se rompió

El archivo `pruebas.js` revisa que la lógica de rachas, marcado y guardado
funcione bien. Desde la Terminal, dentro de esta carpeta:

```
node pruebas.js
```

Debe salir todo en ✅. Vale la pena correrlo cada vez que cambiemos la lógica.

---

## 7. Hoja de ruta

**Fase 0 — v0.1 ✅ (hecho)**
Agregar hábitos, marcarlos, ver racha y últimos 7 días, borrar. Datos guardados
localmente.

**Fase 1 — En el teléfono**
Subirla a GitHub Pages e instalarla en la pantalla de inicio del iPhone.
Aprendes: Git, GitHub, cómo se publica algo en internet.

**Fase 2 — Que sea agradable de usar a diario**
Vista de calendario mensual, estadísticas (% de cumplimiento), hábitos con meta
("3 veces por semana"), reordenar, notas del día, exportar los datos a un archivo.
Aprendes: manejo de fechas, arrays, estructuras de datos.

**Fase 3 — Sincronizar entre dispositivos**
Base de datos real en la nube (Supabase es gratis y usa Postgres). Ahí vuelve tu
SQL de verdad: tablas, joins, consultas.
Aprendes: bases de datos, autenticación, APIs.

**Fase 4 — Si quieres ir más lejos**
Convertirla en app nativa con Capacitor (widgets, notificaciones push, Apple
Health), o reescribirla en React para aprender un framework moderno.

No hay prisa. La Fase 1 sola ya te deja una app que usas todos los días.

---

## 8. Cómo seguir trabajando conmigo

Esta carpeta vive en tu Escritorio y persiste entre conversaciones. En cualquier
sesión nueva puedes decirme "abre el proyecto de hábitos en el Escritorio" y
retomo desde donde quedamos. Pídeme cosas como:

- "Explícame qué hace la función `calcularRacha` línea por línea"
- "Quiero agregar una vista de calendario"
- "Rompí algo, mira el error"
- "Vamos con la Fase 1"
