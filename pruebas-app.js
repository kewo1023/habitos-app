/* ============================================================================
   PRUEBAS DE LA APP — la segunda capa
   ----------------------------------------------------------------------------
   `pruebas.js` prueba las fórmulas por separado, fuera de la app. Esto de aquí
   carga la app ENTERA en un navegador de mentira (`mini-dom.js`) y comprueba
   que las piezas encajen: que al cambiar de idioma se repinten los textos, que
   el saludo use tu nombre, que el botón de abajo diga lo que toca.

   Por qué hacen falta las dos capas: `pruebas.js` no habría visto ninguno de
   los errores que esta encontró, porque no eran errores de cálculo sino de
   conexión — una función que llama a otra con el nombre equivocado, un id de
   HTML que no existe. Eso solo aparece cuando todo corre junto.

   Correr con:  node pruebas-app.js
   ========================================================================== */

const fs = require('fs');
const { El, crearDocumento } = require('./mini-dom.js');

const html = fs.readFileSync(__dirname + '/index.html', 'utf8');

// ---------------------------------------------------------------------------
// El navegador de mentira
// ---------------------------------------------------------------------------
const cuerpo = html.slice(html.indexOf('<body>'), html.lastIndexOf('<script>'));
const doc = crearDocumento(cuerpo);

const almacen = {};
let temaDelSistemaEsOscuro = true;
let pideMenosMovimiento = false;   // el ajuste de Accesibilidad > Movimiento del teléfono

global.document = doc;
global.localStorage = {
  getItem: k => (k in almacen ? almacen[k] : null),
  setItem: (k, v) => { almacen[k] = String(v); },
  removeItem: k => { delete almacen[k]; }
};
global.crypto = require('crypto').webcrypto;
// storage imita la API de almacenamiento persistente: anota si la app lo pidió.
//
// Ojo con cómo se instala. Desde Node 21, Node trae su propio `navigator`, y
// `global.navigator = {...}` NO lo reemplaza: la asignación se ignora en
// silencio. Hasta la v19 este archivo creía tener su navigator de mentira y
// en realidad usaba el de Node; no se notaba porque nada lo miraba de cerca.
// defineProperty sí lo reemplaza.
let pidioPersistencia = false;
// setAppBadge / clearAppBadge anotan el último número que se puso en el ícono.
// Notification imita el permiso de iOS: arranca sin preguntar ('default').
let ultimaInsignia = null, permisoPedido = false;
global.Notification = {
  permission: 'default',
  requestPermission: async () => {
    permisoPedido = true;
    global.Notification.permission = 'granted';
    return 'granted';
  }
};
Object.defineProperty(globalThis, 'navigator', {
  configurable: true, writable: true,
  value: {
    onLine: true, serviceWorker: undefined,
    setAppBadge: async n => { ultimaInsignia = n; },
    clearAppBadge: async () => { ultimaInsignia = 0; },
    storage: {
      persisted: async () => false,
      persist: async () => { pidioPersistencia = true; return true; }
    }
  }
});
global.location = { protocol: 'file:' };
// matchMedia mira QUÉ se le pregunta. Antes respondía lo mismo a todo, y eso
// dejó de servir cuando la app empezó a preguntar también por
// prefers-reduced-motion: con el sistema en oscuro habría respondido "sí,
// reduce el movimiento" y el confeti no se habría probado nunca.
global.window = {
  addEventListener: () => {},
  matchMedia: consulta => ({
    get matches() {
      if (String(consulta).includes('prefers-color-scheme: dark')) return temaDelSistemaEsOscuro;
      if (String(consulta).includes('prefers-reduced-motion')) return pideMenosMovimiento;
      return false;
    },
    addEventListener: () => {}
  })
};
global.matchMedia = global.window.matchMedia;

// Los colores calculados. El navegador de mentira no calcula estilos, así que
// se leen las variables del bloque :root del tema activo directamente del
// <style>. Es suficiente para lo único que la app le pregunta: de qué color
// pintar el confeti.
global.getComputedStyle = () => ({
  getPropertyValue(nombre) {
    const tema = doc.documentElement.dataset.tema === 'claro' ? 'claro' : 'oscuro';
    const marca = tema === 'claro' ? ':root[data-tema="claro"]' : ':root, :root[data-tema="oscuro"]';
    const desde = html.indexOf(marca);
    if (desde === -1) return '';
    const bloque = html.slice(desde, html.indexOf('}', desde));
    const hallado = new RegExp(nombre + '\\s*:\\s*([^;]+);').exec(bloque);
    return hallado ? hallado[1].trim() : '';
  }
});

let ultimaAlerta = null, ultimoConfirm = null, ultimoPrompt = null;
let respuestaPrompt = null, respuestaConfirm = true;
global.alert   = m => { ultimaAlerta = m; };
global.confirm = m => { ultimoConfirm = m; return respuestaConfirm; };
global.prompt  = m => { ultimoPrompt = m; return respuestaPrompt; };

// ---------------------------------------------------------------------------
// Cargar la app
// ---------------------------------------------------------------------------
const inicio = html.lastIndexOf('<script>');
const script = html.slice(inicio + '<script>'.length, html.indexOf('</script>', inicio));

const app = {};
eval(script + `
; Object.assign(app, {
    pintar, pintarLista, cambiarVista, cambiarIdioma, cambiarTema, aplicarTema,
    pintarAjustes, refrescarTodo, agregarHabito, alternarHoy, t, traducirEstaticos,
    abrirCalendario, pintarStats, abrirIdea, agregarTarea, pintarSesion,
    celebrarDiaCompleto, coloresConfeti, moverTarea, alternarTarea, tareasOrdenadas,
    bajarTodo, estaHecho, hoy, cambiarPrioridad, tareasDe, exportar
  });
  Object.defineProperty(app, 'datos',  { get: () => datos });
  Object.defineProperty(app, 'vista',  { get: () => vista });
  Object.defineProperty(app, 'nube',   { get: () => nube,   set: v => { nube = v; } });
  Object.defineProperty(app, 'sesion', { get: () => sesion, set: v => { sesion = v; } });
`);

let fallos = 0;
const ok = (nombre, cond) => { console.log((cond ? '✅' : '❌') + ' ' + nombre); if (!cond) fallos++; };
const $ = id => doc.getElementById(id);

// ===========================================================================
// 1. Que arranque sin romperse
// ===========================================================================
ok('la app arranca sin lanzar errores', true);   // si hubiera fallado, el eval habría explotado
ok('arranca en la sección de Hábitos', app.vista === 'habitos');
ok('los ajustes nacen con sus valores por defecto',
   app.datos.prefs.idioma === 'es' && app.datos.prefs.tema === 'auto');

// ===========================================================================
// 2. El tema
// ===========================================================================
ok('con el sistema en oscuro y tema Automático, la app queda oscura',
   doc.documentElement.dataset.tema === 'oscuro');

temaDelSistemaEsOscuro = false;
app.aplicarTema();
ok('si el sistema pasa a claro, la app lo sigue',
   doc.documentElement.dataset.tema === 'claro');
ok('y la barra de estado del iPhone cambia de color',
   doc._meta.getAttribute('content') === '#f4f5f7');

app.cambiarTema('oscuro');
ok('elegir Oscuro manda sobre el sistema', doc.documentElement.dataset.tema === 'oscuro');
ok('y se guarda en el teléfono', JSON.parse(almacen['habitos-app-v1']).prefs.tema === 'oscuro');

app.cambiarTema('claro');
ok('elegir Claro también manda', doc.documentElement.dataset.tema === 'claro');

app.cambiarTema('auto');
ok('volver a Automático devuelve el mando al sistema',
   doc.documentElement.dataset.tema === 'claro');   // el sistema sigue en claro

// el botón del tema elegido se marca como activo
const botonesTema = $('temas').children.map(b => b.textContent + ':' + b.className);
ok('el botón del tema activo se resalta', botonesTema.includes('Automático:activo'));

// ===========================================================================
// 3. El idioma
// ===========================================================================
ok('las pestañas arrancan en español', $('pestanaHabitos').textContent === 'Hábitos');
ok('el botón de abajo arranca en español', $('btnAgregar').textContent === '+ Nuevo hábito');

app.cambiarIdioma('en');
ok('cambiar a inglés traduce las pestañas', $('pestanaHabitos').textContent === 'Habits');
ok('traduce también el botón grande', $('btnAgregar').textContent === '+ New habit');
ok('traduce los botones del modo edición', $('btnEditar').textContent === 'Edit');
ok('traduce los textos guía de los campos', $('correo').placeholder === 'you@email.com');
ok('traduce el panel de copia', $('btnExportar').textContent === '↓ Save backup');
ok('traduce el panel de cuenta', $('btnEntrar').textContent === 'Sign in');
ok('cambia el idioma de la etiqueta <html>', doc.documentElement.lang === 'en');
ok('cambia el título de la página', doc.title === 'My Habits');
ok('las letras del calendario cambian',
   $('calNombres').children.map(s => s.textContent).join('') === 'MTWTFSS');
ok('el idioma se guarda en el teléfono',
   JSON.parse(almacen['habitos-app-v1']).prefs.idioma === 'en');

// los nombres de los idiomas NO se traducen: siempre en su propio idioma
ok('los idiomas se escriben siempre en su propio idioma',
   $('idiomas').children.map(b => b.textContent).join(',') === 'Español,English');

app.cambiarIdioma('es');
ok('volver a español deshace todo', $('pestanaHabitos').textContent === 'Hábitos');

// ===========================================================================
// 4. El saludo con tu nombre
// ===========================================================================
const titulo = doc.querySelector('.titulo');
const saludosEs = ['Buenos días', 'Buenas tardes', 'Buenas noches'];
ok('sin nombre, el saludo no termina en coma suelta',
   saludosEs.includes(titulo.textContent));

app.datos.prefs.nombre = 'Kev';
app.pintar();
ok('con nombre, el saludo lo incluye', /^Buen[oa]s .+, Kev$/.test(titulo.textContent));

app.cambiarIdioma('en');
ok('el saludo también se traduce', /^Good .+, Kev$/.test(titulo.textContent));
app.cambiarIdioma('es');

app.datos.prefs.nombre = '';
app.pintar();
ok('borrar el nombre vuelve al saludo solo', saludosEs.includes(titulo.textContent));

// ===========================================================================
// 5. Que el idioma llegue a TODAS las secciones
// ===========================================================================
app.agregarHabito('Leer', '📖');
ok('se creó un hábito', app.datos.habitos.length === 1);
ok('el progreso se escribe en español', $('progresoTexto').textContent === '0 de 1');

app.cambiarIdioma('en');
ok('el progreso se traduce', $('progresoTexto').textContent === '0 of 1');

app.cambiarVista('pendientes');
ok('en Pendientes el botón grande está en inglés', $('btnAgregar').textContent === '+ New to-do');
ok('y el texto guía del campo también', $('tareaNueva').placeholder === "What's on your list?");
ok('y la etiqueta de la barra de progreso', $('progresoEtiqueta').textContent === 'To-do');

app.cambiarVista('ideas');
ok('en Ideas el botón grande está en inglés', $('btnAgregar').textContent === '+ New idea');

app.cambiarVista('habitos');
ok('volver a Hábitos restaura su botón', $('btnAgregar').textContent === '+ New habit');
ok('y su etiqueta "Today"', $('progresoEtiqueta').textContent === 'Today');

// cambiar de idioma ESTANDO en otra sección tiene que repintar esa sección
app.cambiarVista('ideas');
app.cambiarIdioma('es');
ok('cambiar de idioma dentro de Ideas repinta Ideas',
   $('btnAgregar').textContent === '+ Nueva idea');
app.cambiarVista('habitos');

// ===========================================================================
// 6. El calendario y las estadísticas, traducidos
// ===========================================================================
const idHabito = app.datos.habitos[0].id;
app.alternarHoy(idHabito);
app.abrirCalendario(idHabito);
ok('el calendario se abre', $('modalCal').classList.contains('abierto'));
ok('el resumen está en español', /Toca un día para corregirlo\.$/.test($('calResumen').textContent));
ok('las estadísticas están en español',
   $('calStats').textContent.includes('Racha actual'));
ok('la ayuda por defecto está en español',
   $('calAyuda').textContent === 'Toca una estadística para ver qué mide exactamente.');

app.cambiarIdioma('en');
app.pintarStats();
ok('las estadísticas se traducen',
   $('calStats').textContent.includes('Current streak'));
ok('y su ayuda también',
   $('calAyuda').textContent === 'Tap a stat to see exactly what it measures.');
app.cambiarIdioma('es');

// ===========================================================================
// 6b. Lo nuevo de la v20: Fuerza, el mapa del año y la última copia
// ===========================================================================
app.pintarStats();   // el bloque anterior las dejó pintadas en inglés
ok('las estadísticas ahora son cinco', $('calStats').querySelectorAll('.stat').length === 5);
ok('la quinta es la Fuerza', $('calStats').textContent.includes('Fuerza'));

const cuadros = $('anioGrid').children;
ok('el mapa del año tiene 53 semanas × 7 días', cuadros.length === 53 * 7);
ok('el día de hoy (marcado arriba) sale en verde',
   cuadros.some(c => c.classList.contains('hecho')));
ok('ningún cuadro del mapa es un botón: no se toca, solo se mira',
   cuadros.every(c => c.tagName !== 'BUTTON' && c.onclick === null));
const vaciosEsperados = 6 - ((new Date().getDay() + 6) % 7);   // lo que falta de esta semana
ok('los días que faltan de esta semana van vacíos',
   cuadros.filter(c => c.classList.contains('vacio')).length === vaciosEsperados);

// Tocar un día del mes también repinta el mapa (los dos salen de los mismos datos).
const antesVerdes = cuadros.filter(c => c.classList.contains('hecho')).length;
app.alternarHoy(idHabito);            // desmarcar hoy
app.abrirCalendario(idHabito);
ok('desmarcar hoy apaga su cuadro en el mapa',
   $('anioGrid').children.filter(c => c.classList.contains('hecho')).length === antesVerdes - 1);
app.alternarHoy(idHabito);            // y lo dejamos como estaba

app.cambiarIdioma('en');
app.pintarStats();
ok('la Fuerza se traduce', $('calStats').textContent.includes('Strength'));
app.cambiarIdioma('es');

ok('sin copias todavía, lo dice',
   $('ultimaCopia').textContent === 'Todavía no has guardado ninguna copia desde este teléfono.');
ok('el botón de Excel existe y está en español',
   $('btnExportarCSV').textContent === '↓ Tabla para Excel (.csv)');
app.cambiarIdioma('en');
ok('cambiar de idioma también traduce la línea de la última copia',
   $('ultimaCopia').textContent === "You haven't saved a backup from this phone yet.");
app.cambiarIdioma('es');

// ===========================================================================
// 6c. El número en el ícono (v20)
// ===========================================================================
ok('al arrancar sin pendientes, el ícono queda sin número', ultimaInsignia === 0);

app.agregarTarea('Llamar al banco', 'pendientes');
app.agregarTarea('Pagar el arriendo', 'pendientes');
ok('dos pendientes = un 2 en el ícono', ultimaInsignia === 2);

app.agregarTarea('Una idea suelta', 'ideas');
app.agregarTarea('Leche', 'compras');
ok('las ideas y las compras no suman al número', ultimaInsignia === 2);

const idBanco = app.tareasDe('pendientes').find(x => x.texto === 'Llamar al banco').id;
app.alternarTarea(idBanco);
ok('marcar uno como hecho baja el número a 1', ultimaInsignia === 1);
ok('y es el mismo número del puntito de la pestaña',
   String(ultimaInsignia) === $('contadorTareas').textContent);

// Se sacan las cuatro tareas de prueba: las secciones de abajo cuentan
// pendientes y esperan encontrar los suyos, no estos.
const dePrueba = ['Llamar al banco', 'Pagar el arriendo', 'Una idea suelta', 'Leche'];
for (let i = app.datos.tareas.length - 1; i >= 0; i--) {
  if (dePrueba.includes(app.datos.tareas[i].texto)) app.datos.tareas.splice(i, 1);
}
app.pintarLista();
ok('y al quedar sin pendientes, el número desaparece', ultimaInsignia === 0);

// El panel de Ajustes, en sus estados
ok('sin haber preguntado, sale el botón Activar', $('btnInsignia').hidden === false);
ok('y la explicación del permiso',
   $('insigniaEstado').textContent.startsWith('Muestra en el ícono'));

async function pruebasDeInsignia() {
  await $('btnInsignia').onclick();
  ok('al tocar Activar, se pidió el permiso', permisoPedido === true);
  ok('concedido: el botón desaparece', $('btnInsignia').hidden === true);
  ok('y el texto dice que está activado', $('insigniaEstado').textContent.startsWith('Activado'));

  Notification.permission = 'denied';
  app.pintarAjustes();
  ok('negado: explica cómo cambiarlo desde el iPhone',
     $('insigniaEstado').textContent.startsWith('El permiso quedó negado'));
  ok('y no ofrece un botón que no serviría', $('btnInsignia').hidden === true);

  app.cambiarIdioma('en');
  ok('el estado se traduce', $('insigniaEstado').textContent.startsWith('Permission was denied'));
  app.cambiarIdioma('es');
  Notification.permission = 'default';
  app.pintarAjustes();
}

// ===========================================================================
// 7. Los avisos de la nube
// ===========================================================================
app.pintarSesion();
ok('sin nube, el panel avisa en español',
   $('sesionEstado').textContent.startsWith('Sin conexión con la nube'));
app.cambiarIdioma('en');
app.pintarSesion();
ok('y en inglés cuando toca',
   $('sesionEstado').textContent.startsWith('No connection to the cloud'));
app.cambiarIdioma('es');

// ===========================================================================
// 8. Que nada de lo que ya funcionaba se haya roto
// ===========================================================================
app.cambiarVista('pendientes');
app.agregarTarea('Comprar café', 'pendientes');
app.pintarLista();
ok('un pendiente nuevo aparece en la lista',
   $('tareasCuerpo').textContent.includes('Comprar café'));
ok('el contador de la pestaña lo cuenta', $('contadorTareas').textContent === '1');

app.cambiarVista('ideas');
app.agregarTarea('App de propinas', 'ideas');
app.pintarLista();
ok('una idea aparece en Ideas', $('tareasCuerpo').textContent.includes('App de propinas'));
ok('y NO suma al contador de Pendientes', $('contadorTareas').textContent === '1');

app.cambiarVista('habitos');
app.pintar();
ok('el hábito sigue en su sitio', $('lista').textContent.includes('Leer'));
ok('y sigue marcado como hecho hoy', $('progresoTexto').textContent === '1 de 1');

// ===========================================================================
// 9. El confeti del día completo
//    Que se vea bonito no se puede probar aquí. Lo que sí: que se creen los
//    papelitos, que tengan color en los dos temas y que el ajuste de
//    accesibilidad del teléfono lo apague de verdad.
// ===========================================================================
app.celebrarDiaCompleto();
ok('el confeti crea papelitos', $('confeti').children.length > 0);
ok('cada papelito lleva su clase', $('confeti').children.every(p => p.className === 'papelito'));
ok('y sus tres variables de animación',
   $('confeti').children.every(p =>
     p.style['--dx'] && p.style['--giro'] && p.style['--dur']));

// Los colores salen de las variables de la app. Este test es el que atrapa el
// olvido más fácil: agregar un color al tema oscuro y no al claro.
app.cambiarTema('oscuro');
const enOscuro = app.coloresConfeti();
app.cambiarTema('claro');
const enClaro = app.coloresConfeti();
ok('hay tres colores de confeti en tema oscuro',
   enOscuro.length === 3 && enOscuro.every(Boolean));
ok('y tres en tema claro',
   enClaro.length === 3 && enClaro.every(Boolean));
ok('y no son los mismos: el claro tiene sus propios valores',
   enOscuro.join() !== enClaro.join());
app.cambiarTema('auto');

// El ajuste de Accesibilidad > Movimiento del teléfono.
$('confeti').innerHTML = '';
pideMenosMovimiento = true;
app.celebrarDiaCompleto();
ok('con "reducir movimiento" no se crea ni un papelito',
   $('confeti').children.length === 0);
pideMenosMovimiento = false;

// ===========================================================================
// 10. La importancia en pantalla, y el reordenar que quedó (v18)
// ---------------------------------------------------------------------------
// En la v18 las dos listas dejaron de comportarse igual a propósito:
// Pendientes se ordena sola por importancia y perdió las flechas; Ideas las
// conserva porque ahí el orden lo pone Kev a mano y no hay nada que lo calcule.
// ===========================================================================
app.cambiarVista('pendientes');
app.agregarTarea('Segundo', 'pendientes');
app.agregarTarea('Tercero', 'pendientes');
app.pintarLista();

const enPantalla = () => app.tareasOrdenadas('pendientes').map(x => x.texto).join(',');
ok('los tres pendientes están en orden de llegada',
   enPantalla() === 'Comprar café,Segundo,Tercero');

// Cada tarjeta de Pendientes trae su franja, y ninguna trae flechas.
const tarjetasPend = $('tareasCuerpo').children;
ok('cada pendiente tiene su franja de importancia',
   tarjetasPend.filter(x => x.querySelectorAll('.prio').length === 1).length === 3);
ok('y ninguno tiene ya flechas de reordenar',
   tarjetasPend.flatMap(x => x.querySelectorAll('.subir')).length === 0);
ok('la franja nace sin color, o sea sin marcar',
   tarjetasPend[0].querySelectorAll('.prio')[0].className.trim() === 'prio');

// Subirle la importancia al tercero debe mandarlo arriba del todo. Se hace
// TOCANDO la franja, no llamando a la función: lo que esta segunda capa existe
// para comprobar es justamente el cable entre el botón y la lógica. Llamando a
// cambiarPrioridad() directamente, un botón mal conectado seguiría en verde.
const tarjetaTercero = tarjetasPend.find(
  x => x.querySelectorAll('.tarea-texto')[0].textContent === 'Tercero');
tarjetaTercero.querySelectorAll('.prio')[0].click();
ok('tocar la franja sube algo importante en pantalla',
   enPantalla() === 'Tercero,Comprar café,Segundo');

// Sin repintar: cambiarPrioridad() ya dibujó, y pintarLista() borra la marca de
// "recién movida" después de usarla una vez — igual que hace el confeti con
// habitoRecienMarcado. Un repintado de más aquí y la animación desaparecería,
// que es justo lo que queremos que pase al cambiar de idioma o al sincronizar.
const primera = $('tareasCuerpo').children[0];
ok('y su franja se dibuja en rojo (clase alta)',
   primera.querySelectorAll('.prio')[0].className.includes('alta'));
ok('la tarjeta que saltó lleva la animación de aterrizaje',
   primera.className.includes('recien-movida'));

// Los cuatro colores existen en los dos temas. Es la regla firme de la v15: un
// color escrito suelto funciona en un tema y desaparece en el otro.
const bloqueOscuro = html.slice(html.indexOf(':root, :root[data-tema="oscuro"]'));
const bloqueClaro  = html.slice(html.indexOf(':root[data-tema="claro"]'));
['--prio-alta', '--prio-media', '--prio-baja', '--prio-ninguna'].forEach(nombre => {
  ok(`${nombre} está definido en los dos temas`,
     bloqueOscuro.slice(0, bloqueOscuro.indexOf('}')).includes(nombre) &&
     bloqueClaro.slice(0, bloqueClaro.indexOf('}')).includes(nombre));
});

// --- Ideas: conserva flechas y NO tiene franja
app.cambiarVista('ideas');
app.agregarTarea('Idea dos', 'ideas');
app.pintarLista();
const tarjetasIdeas = $('tareasCuerpo').children;
ok('las ideas no llevan franja de importancia',
   tarjetasIdeas.flatMap(x => x.querySelectorAll('.prio')).length === 0);
ok('pero conservan sus flechas de reordenar',
   tarjetasIdeas.flatMap(x => x.querySelectorAll('.subir')).length === 2);
ok('la primera idea tiene su flecha de subir apagada',
   tarjetasIdeas[0].querySelectorAll('.subir')[0].disabled === true);

const idIdeaDos = app.datos.tareas.find(x => x.texto === 'Idea dos').id;
app.moverTarea(idIdeaDos, -1);
ok('y las flechas siguen funcionando en Ideas',
   app.tareasOrdenadas('ideas').map(x => x.texto).join(',') === 'Idea dos,App de propinas');

app.cambiarVista('pendientes');

// ===========================================================================
// 11. La cuarta pestaña: Compras (v19)
// ---------------------------------------------------------------------------
// Compras es una lista más de datos.tareas, con sus propias reglas en
// TEXTOS_LISTA: sin franja de importancia, sin flechas, sin ficha, sin
// flecha →, con barra de progreso y sin contador en la pestaña. Lo que se
// comprueba aquí es que la TABLA de reglas manda de verdad sobre lo que se
// dibuja — si alguien vuelve a poner un `if (enIdeas)` suelto, esto se entera.
// ===========================================================================
// El idioma solo se cambia desde Ajustes, que vive en la vista de Hábitos
// (en las listas ese panel está escondido). Por eso se cambia de vista antes.
app.cambiarVista('habitos');
ok('la cuarta pestaña existe y arranca en español', $('pestanaCompras').textContent === 'Compras');
app.cambiarIdioma('en');
ok('y se traduce', $('pestanaCompras').textContent === 'Shopping');
app.cambiarIdioma('es');

app.cambiarVista('compras');
ok('cambiar a Compras la marca como activa', $('pestanaCompras').className.includes('activa'));
ok('y apaga las otras', !$('pestanaIdeas').className.includes('activa')
                       && !$('pestanaTareas').className.includes('activa'));
ok('el botón grande dice lo suyo', $('btnAgregar').textContent === '+ Agregar a la lista');
ok('y el texto guía del campo también', $('tareaNueva').placeholder === '¿Qué hay que comprar?');
ok('la lista vacía muestra su mensaje', $('tareasCuerpo').textContent.includes('Lista vacía'));

app.agregarTarea('Leche', 'compras');
app.agregarTarea('Huevos', 'compras');
app.pintarLista();
const tarjetasCompras = $('tareasCuerpo').children;
ok('las compras aparecen en su lista', $('tareasCuerpo').textContent.includes('Leche'));
ok('y NO en Pendientes', app.tareasDe('pendientes').every(x => x.texto !== 'Leche'));
// Hay 3 pendientes sin hacer del bloque anterior; con dos compras nuevas el
// número tiene que seguir en 3, no subir a 5.
ok('el contador de la pestaña NO las cuenta', $('contadorTareas').textContent === '3');
ok('una compra no lleva franja de importancia',
   tarjetasCompras.flatMap(x => x.querySelectorAll('.prio')).length === 0);
ok('ni flechas de reordenar',
   tarjetasCompras.flatMap(x => x.querySelectorAll('.subir')).length === 0);
ok('ni flecha → a Pendientes',
   tarjetasCompras.flatMap(x => x.querySelectorAll('.mover')).length === 0);
ok('ni el subrayado de "tocar abre la ficha"',
   tarjetasCompras.every(x => !x.className.includes('idea')));
ok('la barra de progreso sí se ve', $('cajaProgreso').style.visibility === 'visible');
ok('y dice cuánto falta', $('progresoTexto').textContent === '0 de 2');

// Tocar el TEXTO marca, como en Pendientes: en la tienda ese es el gesto.
tarjetasCompras[0].querySelectorAll('.tarea-info')[0].click();
ok('tocar el texto de una compra la marca', app.tareasDe('compras').filter(x => x.hecha).length === 1);
ok('y el progreso baja', $('progresoTexto').textContent === '1 de 2');
ok('el botón de limpiar habla de "compradas"',
   $('tareasCuerpo').textContent.includes('Limpiar 1 compradas'));

app.cambiarVista('pendientes');
ok('volver a Pendientes conserva su contador', $('contadorTareas').textContent === '3');

// ===========================================================================
// 12. La carrera entre tu dedo y la sincronización (v18)
// ---------------------------------------------------------------------------
// Este es el bug que se sentía como un fantasma: marcabas un hábito y un
// instante después se desmarcaba solo. La causa no era el marcado, era bajar
// de la nube: son tres viajes que tardan, y la app te deja seguir tocando
// mientras tanto. La foto llegaba de antes de tu toque y al aplicarla lo
// borraba.
//
// Aquí se reproduce a propósito con una nube de mentira que, justo mientras
// "viaja", ejecuta lo que tú harías con el dedo.
// ===========================================================================

let alBajar = null;   // lo que hace el usuario mientras la foto viene en camino

function nubeDeMentira(filasPorTabla) {
  return {
    from(tabla) {
      const respuesta = Promise.resolve().then(() => {
        if (alBajar) { const hacerlo = alBajar; alBajar = null; hacerlo(); }
        return { data: filasPorTabla[tabla] || [], error: null };
      });
      // La app encadena .order('orden') en dos de las tres consultas. Aquí no
      // hay nada que ordenar, así que devuelve la misma promesa.
      respuesta.order = () => respuesta;
      return { select: () => respuesta };
    }
  };
}


// ===========================================================================
// 9. Guardar una copia anota el día (y pedir almacenamiento persistente)
// ===========================================================================
async function pruebasDeCopia() {
  // El permiso se pide con promesas: hay que dejar que terminen antes de mirar.
  await new Promise(listo => setTimeout(listo, 0));
  ok('al arrancar, la app pidió almacenamiento persistente', pidioPersistencia === true);

  // En el computador no hay menú Compartir: exportar() baja el archivo.
  await app.exportar();
  ok('guardar la copia anota el día de hoy', app.datos.prefs.ultimaCopia === app.hoy());
  ok('y la línea lo dice', $('ultimaCopia').textContent === 'Última copia: hoy.');
  ok('queda guardado en el teléfono',
     JSON.parse(almacen['habitos-app-v1']).prefs.ultimaCopia === app.hoy());

  // Si cancelas el menú Compartir, no hubo copia: no se anota nada.
  app.datos.prefs.ultimaCopia = '';
  navigator.canShare = () => true;
  navigator.share = async () => { const e = new Error('cancelado'); e.name = 'AbortError'; throw e; };
  await app.exportar();
  ok('cancelar el menú Compartir no cuenta como copia', app.datos.prefs.ultimaCopia === '');
  delete navigator.canShare; delete navigator.share;
}

async function pruebasDeCarrera() {
  app.sesion = { user: { id: 'u1', email: 'kev@ejemplo.com' } };
  app.datos.pendientes.length = 0;
  app.agregarHabito('Meditar', '🧘');
  const idMeditar = app.datos.habitos[app.datos.habitos.length - 1].id;
  const filaMeditar = { id: idMeditar, nombre: 'Meditar', emoji: '🧘', creado: app.hoy(), orden: 0 };

  // Caso tranquilo: nadie toca nada mientras baja. Debe aplicarse.
  app.datos.pendientes.length = 0;
  app.nube = nubeDeMentira({ habitos: [filaMeditar], registros: [], tareas: [] });
  alBajar = null;
  ok('con nadie tocando, lo bajado se aplica', (await app.bajarTodo()) === true);

  // Caso de la carrera: marcas justo mientras los datos viajan. La nube trae
  // una foto sin esa marca; si se aplicara, el hábito se vería desmarcarse
  // solo. Lo correcto es tirar la foto entera.
  app.datos.pendientes.length = 0;
  alBajar = () => app.alternarHoy(idMeditar);
  const seAplico = await app.bajarTodo();

  ok('marcar mientras baja hace que la foto vieja se descarte', seAplico === false);
  ok('y tu marca sigue puesta, no se desmarca sola',
     app.estaHecho(idMeditar, app.hoy()) === true);
  ok('el cambio queda en la cola para subirse después',
     app.datos.pendientes.length === 1);

  // Y al revés, que es el otro síntoma: desmarcas mientras baja y la nube
  // todavía lo tenía marcado. Sin la guarda, te lo volvería a marcar.
  app.datos.pendientes.length = 0;
  app.nube = nubeDeMentira({
    habitos: [filaMeditar],
    registros: [{ habito_id: idMeditar, fecha: app.hoy() }],
    tareas: []
  });
  alBajar = () => app.alternarHoy(idMeditar);   // ahora esto DESmarca
  const seAplico2 = await app.bajarTodo();

  ok('desmarcar mientras baja también descarta la foto', seAplico2 === false);
  ok('y no te lo vuelve a marcar solo',
     app.estaHecho(idMeditar, app.hoy()) === false);
}

pruebasDeInsignia().then(pruebasDeCopia).then(pruebasDeCarrera).then(() => {
  console.log(fallos === 0
    ? '\n🎉 La app entera funciona'
    : `\n⚠️ ${fallos} fallo(s)`);
  process.exit(fallos ? 1 : 0);
});
