# Fase 3, etapa 1 — Montar la base de datos en Supabase

Al terminar esto tendrás una base de datos Postgres real en internet, vacía y
esperando. La app todavía no la usa: eso es la etapa 2.

Tiempo: unos 25 minutos. No hay nada que se pueda romper de lo que ya funciona.

---

## Qué es Supabase, en corto

Un servidor de **Postgres** (una base de datos SQL de verdad, la misma familia
que aprendiste hace años) con tres cosas encima que nos ahorran meses de trabajo:

- una **API web**, para que la app le hable desde el navegador sin servidor propio
- un sistema de **cuentas** para iniciar sesión
- un panel donde ves y editas tus tablas con el mouse

El plan gratuito sobra para esto: tus datos son unos pocos kilobytes.

Un detalle del plan gratuito: si el proyecto pasa **una semana entera sin recibir
una sola consulta**, lo pausan y hay que reactivarlo a mano desde el panel. Como
vas a abrir la app a diario, no debería pasar. Si algún día vuelves de un viaje
largo y la app no sincroniza, esa es la primera sospecha.

---

## Paso 1 — Crear la cuenta y el proyecto

1. Entra a **supabase.com** → **Start your project**
2. Regístrate. Lo más cómodo es **Continue with GitHub** — ya tienes cuenta.
   > Ojo con lo de siempre: que el navegador esté con **`kewo1023`**, no con la
   > cuenta vieja.
3. **New project**. Te pide:
   - **Name:** `habitos`
   - **Database Password:** genera una y **guárdala** en tus notas o llavero.
     No la vas a usar desde la app, pero es la llave maestra de la base de datos
     y no se puede volver a ver después.
   - **Region:** la más cercana a ti. `East US (North Virginia)` sirve bien
     desde Colombia.
4. **Create new project** y espera 2-3 minutos mientras lo construyen.

---

## Paso 2 — Crear las tablas con SQL

Aquí vuelve tu SQL. Vamos a crear **las mismas dos tablas que ya existen en tu
app**, solo que ahora de verdad. Compara:

| En `index.html` (hoy) | En Postgres (ahora) |
|---|---|
| `datos.habitos` — una lista de objetos | tabla `habitos` — una fila por hábito |
| `datos.registros` — fechas → lista de ids | tabla `registros` — una fila por (hábito, día) |

El cambio importante es el segundo. Hoy guardas *"el 4 de agosto se marcaron
estos tres hábitos"*. En Postgres se guarda al revés y más simple: **una fila por
cada marca**. `(hábito Leer, 4 de agosto)`. Es la forma normal de modelarlo en
SQL, y tiene una ventaja concreta para ti: si marcas algo en el Mac y otra cosa
en el iPhone, son filas distintas y **no se pisan**.

En el menú de la izquierda, ícono **SQL Editor** (`>_`). Pega todo esto de un
golpe y dale **Run**:

```sql
-- ============================================================
--  TABLA 1: los hábitos
-- ============================================================
create table habitos (
  id           uuid primary key,
  usuario      uuid not null references auth.users(id) on delete cascade,
  nombre       text not null,
  emoji        text not null,
  creado       date not null,
  orden        int  not null default 0,
  actualizado  timestamptz not null default now()
);

-- ============================================================
--  TABLA 2: cada día marcado
-- ============================================================
create table registros (
  usuario   uuid not null references auth.users(id) on delete cascade,
  habito_id uuid not null references habitos(id) on delete cascade,
  fecha     date not null,
  primary key (habito_id, fecha)
);

-- ============================================================
--  SEGURIDAD: que cada quien vea solo lo suyo
-- ============================================================
alter table habitos   enable row level security;
alter table registros enable row level security;

create policy "solo mis habitos" on habitos
  for all
  using      (auth.uid() = usuario)
  with check (auth.uid() = usuario);

create policy "solo mis registros" on registros
  for all
  using      (auth.uid() = usuario)
  with check (auth.uid() = usuario);
```

Debe responder **Success. No rows returned**. Es lo esperado: crear tablas no
devuelve filas.

### Qué dice ese SQL, línea por línea

**`id uuid primary key`** — el mismo id que ya generas con `crypto.randomUUID()`.
Se reutiliza tal cual, así que tus hábitos actuales conservan su identidad al
subirlos.

**`usuario uuid references auth.users(id)`** — de quién es esta fila.
`auth.users` es una tabla que Supabase crea sola para las cuentas. El
`references` es una **llave foránea**: Postgres se niega a guardar una fila cuyo
usuario no exista.

**`on delete cascade`** — si se borra el usuario, se borran sus hábitos en
cascada. Y en `registros`, si se borra un hábito, se van sus marcas. Eso que hoy
haces a mano en `borrarHabito()` recorriendo todas las fechas, la base de datos
lo hace sola.

**`primary key (habito_id, fecha)`** — una **llave primaria compuesta**: la
identidad de una fila son sus dos columnas juntas. Traducido: *un hábito no puede
tener dos marcas el mismo día*. Es imposible duplicar una marca, no por cuidado
del código sino porque la base de datos no lo permite. Esa es la diferencia entre
validar y garantizar.

**`orden int`** — la posición en la lista, para que el reordenar de ayer
sobreviva. Hoy el orden es la posición en el array; un array tiene orden, una
tabla no. Toca guardarlo explícitamente.

**`enable row level security`** + las dos `policy`** — lo más importante de todo.
RLS significa "seguridad a nivel de fila": Postgres filtra cada consulta según
quién pregunta. `auth.uid()` es el id del usuario conectado.

Traducción de la política: *para cualquier operación, esta fila solo existe si es
tuya*. El `using` controla lo que puedes leer y borrar; el `with check`, lo que
puedes escribir — sin él, alguien podría insertar filas a nombre de otro.

Esto importa porque la llave que va dentro de `index.html` es **pública**:
cualquiera que mire el código fuente de tu página la ve. Sin RLS, esa llave
dejaría leer toda la tabla. Con RLS, la llave sola no sirve para nada: hay que
haber iniciado sesión, y solo se ven las filas propias.

> Puedes ver las tablas creadas en **Table Editor**, en el menú de la izquierda.
> Están vacías; es lo correcto.

---

## Paso 3 — Crear tu usuario, con correo y contraseña

### Por qué así y no con código por correo

El plan original era un código de 6 dígitos por correo. Se cayó por dos motivos
que descubrimos al intentarlo:

1. Desde **junio de 2026**, los proyectos nuevos del plan gratuito **no pueden
   editar las plantillas de correo** sin montar un servidor de correo propio
   (SMTP). Es el aviso *"Set up custom SMTP to edit templates"* que te apareció.
2. Peor: el correo por defecto de Supabase está limitado a **2 correos por
   hora**. Probando el login tres veces quedarías bloqueado una hora.

Correo y contraseña no manda ningún correo, así que ninguno de los dos límites
aplica. Y como todo ocurre dentro de la app, **el problema de iOS desaparece
solo**: nunca hay un enlace que abra Safari.

> **Queda la puerta abierta.** Al final de este archivo está lo que habría que
> hacer para volver al código por correo con Resend. El código de la app va a
> separar "cómo entras" del resto, así que cambiarlo después es tocar una
> función, no reescribir la sincronización.

### Lo que hay que configurar

**a) Revisar el proveedor de correo**

Menú izquierdo → **Authentication** → **Sign In / Providers** → **Email**:

- **Email** activado
- **Confirm email**: **desactivado**. Si queda activo, Supabase te mandaría un
  correo de confirmación al crear la cuenta y volveríamos al límite de 2 por hora.

**b) Crear tu usuario a mano**

En vez de escribir una pantalla de registro que vas a usar una sola vez en la
vida, creamos el usuario desde el panel:

1. **Authentication** → **Users** → botón **Add user** → **Create new user**
2. Tu correo y una contraseña. **Genérala con el llavero de macOS** y guárdala
   ahí mismo; no la vas a escribir a mano casi nunca.
3. Marca **Auto Confirm User** para que quede lista sin correo de por medio
4. **Create user**

**c) Cerrar la puerta a nuevos registros**

De vuelta en **Sign In / Providers → Email**, apaga **"Allow new users to sign
up"**.

Esto vale la pena entenderlo. La llave que va dentro de tu `index.html` es
pública: cualquiera que abra el código fuente de tu página la ve. Con los
registros abiertos, esa llave le permitiría a un desconocido **crear una cuenta**
en tu proyecto. No vería tus datos — el RLS del paso 2 lo impide — pero estaría
consumiendo tu plan gratuito.

Con los registros cerrados, la única cuenta que existe es la tuya y ya no se
pueden crear más. Es la diferencia entre "no puede ver mis datos" y "ni siquiera
puede entrar".

Son **dos cerrojos distintos y los dos hacen falta**:

| Cerrojo | Qué impide |
|---|---|
| RLS (paso 2) | Que alguien con sesión vea filas que no son suyas |
| Registros cerrados | Que alguien consiga una sesión, para empezar |

---

## Paso 4 — Copiar las dos credenciales

Menú izquierdo → **Project Settings** (el engranaje) → **API Keys**.

Copia dos cosas a un archivo de notas:

1. **Project URL** — algo como `https://abcdefghijk.supabase.co`
2. **anon public** — un texto largo que empieza por `eyJ...`

La segunda se llama *anon* de anónima, y es **pública a propósito**: va dentro
del HTML de tu página. No es un secreto. Lo que protege tus datos es el RLS del
paso 2, no esconder la llave.

> Junto a ella vas a ver una **`service_role`**. Esa **sí** es secreta y **se
> salta el RLS por completo**. No va en `index.html` nunca, ni en GitHub, ni en
> un mensaje. No la vamos a necesitar.

---

## Cuando termines

Mándame las dos credenciales del paso 4 y seguimos con la etapa 2: la pantalla
para entrar a tu cuenta desde la app.

Si algo falla en el camino, cópiame el mensaje de error completo.

---

## Lo que viene después (para que sepas a dónde vamos)

**Etapa 2 — Entrar.** Un panel de sesión junto al de copia de seguridad: correo,
contraseña, y dentro. La sesión se guarda, así que es una sola vez por
dispositivo. Ese panel va a llamar a **una sola función** para entrar; el día que
quieras pasarte al código por correo, se cambia esa función y nada más.

**Etapa 3 — Sincronizar.** El plan:

- `localStorage` **sigue siendo** lo que la app dibuja. Marcar un hábito seguirá
  siendo instantáneo y funcionará sin internet. Eso no se negocia.
- Cada cambio, además de guardarse local, se anota en una **cola de pendientes**
  y se intenta enviar a Supabase.
- Sin internet, la cola se acumula. Al volver la señal, se vacía sola.
- Al abrir la app se baja lo que haya en la nube y se mezcla con lo local.

En otras palabras: Supabase no reemplaza a `localStorage`, se pone detrás. Si
Supabase está caído o no hay señal, la app sigue funcionando igual que hoy.

---

## Paso 5 — La tabla de Pendientes e Ideas (v16, agosto de 2026)

Esto llega después. Cuando se construyeron Pendientes e Ideas se decidió a
propósito dejarlas **solo en el teléfono** hasta usarlas unos días. Ya se
usaron, así que ahora se les da su tabla.

> **Verificado el 8 de agosto de 2026** contra la documentación de Supabase
> (la página de RLS se actualizó el 7 de agosto). Los nombres de las secciones
> del panel — **SQL Editor**, **Table Editor** — siguen siendo esos. Si ves
> algo distinto, mándame una captura antes de improvisar.

### El SQL

Menú de la izquierda → **SQL Editor** (el ícono `>_`). Pega esto y dale **Run**:

```sql
-- ============================================================
--  TABLA 3: pendientes e ideas
--  Una sola tabla para las dos listas, igual que en la app hay
--  un solo array. Lo que las separa es la columna "lista".
-- ============================================================
create table tareas (
  id      uuid primary key,
  usuario uuid not null references auth.users(id) on delete cascade,
  texto   text not null,
  nota    text,
  hecha   boolean not null default false,
  lista   text not null default 'pendientes'
          check (lista in ('pendientes', 'ideas')),
  creada  date not null,
  orden   int  not null default 0
);

-- ============================================================
--  SEGURIDAD
-- ============================================================
alter table tareas enable row level security;

create policy "solo mis tareas" on tareas
  for all
  to authenticated
  using      ((select auth.uid()) = usuario)
  with check ((select auth.uid()) = usuario);

-- Un índice sobre la columna por la que filtra la política. Sin él,
-- Postgres revisa fila por fila si es tuya.
create index tareas_usuario on tareas (usuario);
```

Debe responder **Success. No rows returned**.

### Qué dice ese SQL, y en qué se diferencia del de las otras dos tablas

**`nota text`** — sin `not null`, a diferencia de las demás columnas. Una tarea
sin nota guarda `null`, que en SQL significa "aquí no hay nada". La app hace lo
mismo: si no escribes nota, el campo ni existe. Guardar una cadena vacía sería
inventarse un tercer estado ("existe pero está vacía") que no significa nada.

**`check (lista in ('pendientes', 'ideas'))`** — un **CHECK constraint**: la
base de datos se niega a guardar una fila con cualquier otro valor. En el
código de la app eso mismo lo cuida `LISTAS`, pero eso es una promesa del
código; esto es una garantía de la base. Si mañana un error escribe
`lista = 'pendintes'`, aquí revienta en vez de perderse la tarea en silencio.

**`orden int`** — la posición en la lista, lo mismo que ya hace `habitos`. Un
array tiene orden por sí mismo; una tabla no. Sin esta columna, tus pendientes
te llegarían barajados al otro dispositivo.

**`to authenticated` y `(select auth.uid())`** — dos detalles que las políticas
de `habitos` y `registros` no tienen, porque se escribieron antes.

- `to authenticated` corta la evaluación para quien no ha iniciado sesión, en
  vez de calcular la condición y descubrir que no.
- `(select auth.uid())` hace que Postgres calcule tu id **una vez** por
  consulta en vez de una vez por fila.

Las dos son recomendaciones actuales de Supabase y solo afectan velocidad, no
seguridad. Con tu volumen de datos no vas a notar la diferencia; se escriben
así porque es la forma correcta y no cuesta nada. Si algún día quieres, las
políticas viejas se pueden reescribir igual — pero no corre prisa.

**Antes de correr nada: confirma en qué proyecto estás.** La URL del navegador
debe contener **`wfqhtnxhxjtdsvjzxaks`**, y en **Table Editor** deben verse
`habitos` y `registros`. No basta con leer el nombre del proyecto arriba: el
8 de agosto de 2026 el SQL de este paso se corrió entero en un proyecto
llamado `habitos_apps` —con `s`— en vez de `habitos_app`. La tabla quedó
perfecta, con su RLS y sus permisos, en la base equivocada; la app tardó una
hora en poder explicarlo.

**Los `GRANT`.** Corre también esto:

```sql
grant select, insert, update, delete on public.tareas to authenticated;
grant select, insert, update, delete on public.tareas to service_role;

notify pgrst, 'reload schema';
```

> Nota honesta: la primera versión de esta guía decía que estos `GRANT` no
> hacían falta, razonando que `habitos` y `registros` funcionan sin ellos. Eso
> era una **deducción**, no una comprobación. Resultó que Supabase sí los pone
> solo — el problema del 8 de agosto era el proyecto equivocado, no los
> permisos. Se dejan escritos igual porque la documentación los recomienda
> para tablas creadas desde el SQL Editor, no cuestan nada y hacen explícito
> lo que si no queda dependiendo de un valor por defecto.

Por qué importan más de lo que parece: PostgREST **solo mete en su mapa de
tablas las que los roles de la API pueden tocar**. Si `authenticated` no tiene
permisos sobre `tareas`, PostgREST no la incluye — y el error que ves no es
"permiso denegado" sino `Could not find the table 'public.tareas' in the schema
cache`, que suena a que la tabla no existe. Dos causas muy distintas, el mismo
mensaje.

`anon` no necesita nada: la app exige haber entrado, y el RLS bloquea a `anon`
de todos modos. Menos permisos de los que sobran.

### Después de crear la tabla, avisa a PostgREST

**Este paso parece de sobra y no lo es.** Pasó de verdad el 8 de agosto de 2026
y costó un rato largo de diagnóstico.

Corre esto en el **SQL Editor**, justo después del `create table`:

```sql
NOTIFY pgrst, 'reload schema';
```

Debe responder **Success. No rows returned**.

**Por qué.** Entre tu app y Postgres hay una pieza intermedia, **PostgREST**:
es la que convierte `nube.from('tareas')` en una consulta SQL. Para no leer la
estructura de la base en cada petición, guarda un **mapa de las tablas en
memoria**. Cuando creas una tabla, Postgres le manda un aviso para que lo
recargue — y a veces ese aviso no llega.

El resultado es desconcertante: la tabla **existe**, pero la app dice
`Could not find the table 'public.tareas' in the schema cache`. Y si la
verificas desde el SQL Editor, aparece perfecta, porque el SQL Editor habla con
Postgres directamente y se salta a PostgREST. **Estás preguntándole a dos cosas
distintas.**

Si el `NOTIFY` no bastara: **Project Settings → General → Restart project**.
Tarda un minuto, no borra nada, y PostgREST reconstruye el mapa al arrancar.

> La lección que vale más allá de Supabase: cuando dos comprobaciones se
> contradicen, casi nunca es que una mienta. Es que están mirando capas
> distintas del mismo sistema. La pregunta útil no es "¿cuál tiene razón?"
> sino "¿qué hay entre las dos?".

### Comprobar que quedó

En **Table Editor** debe aparecer `tareas` junto a `habitos` y `registros`,
vacía. Al abrir la app y entrar con tu cuenta, tus pendientes e ideas de hoy se
suben solos y la tabla se llena.

> **Ojo con el orden de las cosas:** publica la `v16` **después** de correr este
> SQL. Si la app intenta subir tareas a una tabla que no existe, la cola de
> pendientes se atasca reintentando y el panel de Cuenta se queda diciendo
> "N cambios esperando". No se pierde nada — para eso está la cola — pero es
> confuso. Primero la tabla, después la app.

---

## Anexo — Si algún día quieres el código por correo

No hace falta ahora. Queda escrito para no volver a investigarlo.

Lo que se necesita es un servidor de correo propio; el de Supabase no sirve por
los dos límites de arriba. El más simple es **Resend**:

1. Cuenta gratis en **resend.com** → crear una **API Key**
2. En Supabase: **Authentication → Emails → SMTP Settings**, activar *Enable
   Custom SMTP* y poner los datos de Resend (host `smtp.resend.com`, puerto
   `465`, usuario `resend`, contraseña = la API Key)
3. Con SMTP propio ya se **desbloquea la edición de plantillas**. Entonces sí:
   plantilla **Magic Link** → cambiar `{{ .ConfirmationURL }}` por `{{ .Token }}`
4. En la app, cambiar la función de entrar por dos llamadas:
   `signInWithOtp({ email })` para pedir el código, y
   `verifyOtp({ email, token, type: 'email' })` para validarlo

**La advertencia importante:** mientras no verifiques un dominio propio en
Resend, su modo de prueba **solo entrega correos a la dirección con la que te
registraste**. Para ti alcanza, porque eres el único usuario, pero es la razón
por la que este camino no es el predeterminado.
