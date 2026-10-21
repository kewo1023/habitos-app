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
    abrirCalendario, pintarStats, abrirFicha, agregarTarea, pintarSesion,
    celebrarDiaCompleto, coloresConfeti, moverTarea, alternarTarea, tareasOrdenadas,
    bajarTodo, estaHecho, hoy, cambiarPrioridad, tareasDe, exportar, celebrarHito,
    TRAZO_CHECK, PAUSA_TACHADO, cerrarCalendario, TOQUE_LARGO, borrarHabito, cerrarFicha,
    lanzarOla, irseSello, pintarFechas, abrirFecha, irAlDia, VISTAS
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
// Desde la v30 no hay "+" redondo en la barra: crear un hábito es el botón
// "+ Nuevo hábito" al final de la lista.
ok('ya no existe el botón redondo de la barra', $('btnAgregar') === null);
ok('"+ Nuevo hábito" arranca en español', $('btnNuevoHabito').textContent === '+ Nuevo hábito');

app.cambiarIdioma('en');
ok('cambiar a inglés traduce las pestañas', $('pestanaHabitos').textContent === 'Habits');
ok('traduce también "+ Nuevo hábito"', $('btnNuevoHabito').textContent === '+ New habit');
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
ok('y el texto guía del campo también', $('tareaNueva').placeholder === "What's on your list?");
ok('y la etiqueta de la barra de progreso', $('progresoEtiqueta').textContent === 'To-do');

app.cambiarVista('ideas');
ok('en Ideas el texto guía del campo está en inglés', $('tareaNueva').placeholder === 'What came to mind?');

app.cambiarVista('habitos');
ok('y su etiqueta "Today"', $('progresoEtiqueta').textContent === 'Today');

// cambiar de idioma ESTANDO en otra sección tiene que repintar esa sección
app.cambiarVista('ideas');
app.cambiarIdioma('es');
ok('cambiar de idioma dentro de Ideas repinta Ideas',
   $('tareaNueva').placeholder === '¿Qué se te ocurrió?');
app.cambiarVista('habitos');

// ===========================================================================
// 5b. La barra de abajo (v21)
// ===========================================================================
// v24: sin colores por hábito, y 7 puntos en vez de 14.
ok('ninguna tarjeta lleva tinte de color propio',
   $('lista').children.length > 0 && $('lista').children.every(c => !c.style['--tinte']));
ok('cada tarjeta muestra 7 puntos (la última semana)',
   $('lista').children.every(c => c.querySelectorAll('.dia').length === 7));

app.cambiarVista('ideas');
ok('la píldora viaja hasta la tercera pestaña', $('pestanas').style['--i'] === '2');
app.cambiarVista('habitos');
ok('y vuelve a la primera', $('pestanas').style['--i'] === '0');

// v30: sin el "+" redondo, salir del modo edición desde abajo es el botón
// "Listo" al final de los paneles (antes era el ✓ del "+").
$('btnEditar').click();
ok('arriba dice Listo', $('btnEditar').textContent === 'Listo');
ok('y abajo hay otro "Listo"', $('btnListoAbajo').textContent === 'Listo');
$('btnListoAbajo').onclick();
ok('tocar el Listo de abajo sale del modo edición', !doc.body.classList.contains('editando'));
ok('y el de arriba vuelve a decir Editar', $('btnEditar').textContent === 'Editar');
ok('sin abrir de paso la ventana de nuevo hábito', !$('modal').classList.contains('abierto'));

// Lo que hacía el "+" en cada sección, ahora en la sección misma.
$('btnNuevoHabito').onclick();
ok('en Hábitos, "+ Nuevo hábito" abre la ventana de crear', $('modal').classList.contains('abierto'));
$('btnCancelar').onclick();
['pendientes', 'ideas', 'compras'].forEach(lista => {
  app.cambiarVista(lista);
  ok(`en ${lista}, el campo de escribir (con su +) está a la vista`,
     $('listaTareas').hidden === false && !!$('formTarea') && !!$('btnAgregarTarea'));
});
app.cambiarVista('habitos');

// ===========================================================================
// 6. El calendario y las estadísticas, traducidos
// ===========================================================================
const idHabito = app.datos.habitos[0].id;
app.alternarHoy(idHabito);
app.abrirCalendario(idHabito);
ok('el calendario se abre', $('modalCal').classList.contains('abierto'));
ok('el resumen está en español', $('calResumen').textContent.endsWith('otra vez ✗ no logrado, otra vez vacío.'));
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

// El mapa (v21): doce bloques, uno por mes, cada uno con su nombre y sus días.
const cuadrosDelMapa = () => $('anioGrid').children.flatMap(b => b.children[1].children);
const cuadros = cuadrosDelMapa();
ok('el mapa del año tiene 12 meses', $('anioGrid').children.length === 12);
ok('cada mes lleva su nombre arriba',
   $('anioGrid').children.every(b => b.children[0].className === 'anio-mes-nombre' &&
                                     b.children[0].textContent.length > 0));
ok('el último mes es el de hoy',
   $('anioGrid').children[11].children[0].textContent ===
   new Date().toLocaleDateString('es-CO', { month: 'short' }));   // es-CO escribe "oct.", con punto
ok('el día de hoy (marcado arriba) sale en verde',
   cuadros.some(c => c.classList.contains('hecho')));
// .vacio ya es la clase del "todavía no hay hábitos", con 60px de padding.
// Un cuadrito con esa clase estira su fila hasta 120px (pasó en la v21).
ok('los huecos del mapa usan .relleno, nunca .vacio',
   cuadros.some(c => c.classList.contains('relleno')) &&
   !cuadros.some(c => c.classList.contains('vacio')));
ok('ningún cuadro del mapa es un botón: no se toca, solo se mira',
   cuadros.every(c => c.tagName !== 'BUTTON' && c.onclick === null));
const ultimoDiaDelMes = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
ok('lo que falta de este mes sale apagado (futuro)',
   cuadros.filter(c => c.classList.contains('futuro')).length ===
   ultimoDiaDelMes - new Date().getDate());

// Tocar un día del mes también repinta el mapa (los dos salen de los mismos datos).
const antesVerdes = cuadros.filter(c => c.classList.contains('hecho')).length;
app.alternarHoy(idHabito);            // desmarcar hoy
app.abrirCalendario(idHabito);
ok('desmarcar hoy apaga su cuadro en el mapa',
   cuadrosDelMapa().filter(c => c.classList.contains('hecho')).length === antesVerdes - 1);
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
// 8b. No logrado (v23): se marca en el calendario y se ve en todas partes
// ===========================================================================
app.agregarHabito('Inglés', '🧠');
const idIngles = app.datos.habitos[app.datos.habitos.length - 1].id;
const diaHoy = String(new Date().getDate());
const celdaDeHoy = () => $('calGrid').children.find(c => c.textContent === diaHoy);

app.abrirCalendario(idIngles);
celdaDeHoy().click();                       // vacío → ✓
celdaDeHoy().click();                       // ✓ → ✗
ok('dos toques en el calendario dejan el día como no logrado',
   celdaDeHoy().classList.contains('fallo') && !celdaDeHoy().classList.contains('hecho'));
ok('el resumen del mes lo cuenta', $('calResumen').textContent.includes('1 sin lograr'));
ok('el mapa del año lo pinta',
   $('anioGrid').children.flatMap(b => b.children[1].children)
     .filter(c => c.classList.contains('fallo')).length === 1);

const tarjetaIngles = () => $('lista').children[$('lista').children.length - 1];
ok('en la lista, la tarjeta de hoy queda como no logrado', tarjetaIngles().classList.contains('fallo'));
// mini-dom no guarda el texto de lo que entra por innerHTML: se mira el HTML.
ok('y su círculo muestra la ✗', tarjetaIngles().innerHTML.includes('<div class="check">✗</div>'));
const puntosIngles = tarjetaIngles().querySelectorAll('.dia');
ok('el último puntito (hoy) es una ✗', puntosIngles[puntosIngles.length - 1].classList.contains('fallo'));
ok('y donde va la racha dice "No logrado" (v24)',
   tarjetaIngles().innerHTML.includes('<span class="racha fallo-texto">No logrado</span>'));

app.cambiarIdioma('en');
app.abrirCalendario(idIngles);
ok('el resumen se traduce', $('calResumen').textContent.includes('1 missed'));
app.cambiarIdioma('es');

tarjetaIngles().querySelector('.check').click();   // si al final lo hiciste...
ok('tocar el círculo de un no logrado lo marca hecho', app.estaHecho(idIngles, app.hoy()));
ok('la tarjeta pasa a verde (hecho)', tarjetaIngles().classList.contains('hecho'));
ok('y deja de estar en rojo', !tarjetaIngles().classList.contains('fallo') &&
   tarjetaIngles().innerHTML.includes('<div class="check">' + app.TRAZO_CHECK + '</div>'));
// Desde la v26 el ✓ es un trazo SVG y no una letra: la animación necesita
// algo que se pueda "dibujar". La ✗ sigue siendo letra.
ok('el ✓ es el trazo que se dibuja, no una letra',
   tarjetaIngles().innerHTML.includes('<div class="check"><svg'));
ok('y el trazo solo se anima en la que acabas de marcar',
   tarjetaIngles().querySelector('.check').classList.contains('celebrar'));

app.abrirCalendario(idIngles);
celdaDeHoy().click();                       // ✓ → ✗
celdaDeHoy().click();                       // ✗ → vacío
ok('el tercer toque lo deja vacío', !celdaDeHoy().classList.contains('fallo') &&
   !celdaDeHoy().classList.contains('hecho'));
ok('y sin no logrados, el resumen no los menciona', !$('calResumen').textContent.includes('sin lograr'));
app.cerrarCalendario && app.cerrarCalendario();

// ===========================================================================
// 9. El sello y la ola del día completo (v29; hasta la v28 era confeti)
//    Que se vea bonito no se puede probar aquí. Lo que sí: que el sello se
//    arme con su texto en el idioma de la app, que no quede lluvia de la
//    versión vieja, que tocarlo lo despida, que la ola llegue a todas las
//    tarjetas y que el ajuste de accesibilidad del teléfono lo apague.
// ===========================================================================
app.cambiarVista('habitos');
$('confeti').innerHTML = '';
app.celebrarDiaCompleto();
ok('el sello se hace visible', $('sello').classList.contains('visible'));
ok('con el fondo difuminado detrás', !!$('sello').querySelector('.sello-velo'));
ok('dice "Día completo"', $('sello').querySelector('.sello-titulo').textContent === 'Día completo');
const totalHabitos = app.datos.habitos.length;
ok('y cuántos hábitos completaste',
   $('sello').querySelector('.sello-cuenta').textContent === `${totalHabitos} de ${totalHabitos}`);
ok('ya no cae la lluvia de papelitos de la v28', $('confeti').children.length === 0);

app.cambiarIdioma('en');
app.celebrarDiaCompleto();
ok('en inglés dice "Day complete"', $('sello').querySelector('.sello-titulo').textContent === 'Day complete');
ok('y un segundo sello reemplaza al primero, no se apila',
   $('sello').querySelectorAll('.sello-figura').length === 1);
app.cambiarIdioma('es');

app.irseSello();
ok('tocarlo (o que pase el tiempo) lo manda hacia la barra', $('sello').classList.contains('vete'));

app.lanzarOla();
const tarjetasOla = $('lista').querySelectorAll('.habito');
ok('la ola llega a todas las tarjetas', tarjetasOla.length > 0 &&
   tarjetasOla.every(tj => tj.classList.contains('ola')));
ok('cada una con su retraso, en orden', tarjetasOla.every((tj, i) => tj.style['--retraso'] === i * 70 + 'ms'));
ok('y la barra de progreso recibe su brillo', $('progresoFondo').classList.contains('ola'));

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
$('sello').classList.remove('visible');
$('sello').innerHTML = '';
pideMenosMovimiento = true;
app.celebrarDiaCompleto();
ok('con "reducir movimiento" no sale el sello', !$('sello').classList.contains('visible'));
pideMenosMovimiento = false;

// La etiqueta de la barra: con el día completo, "Hoy" dice "Día completo ✓".
// Es la parte de la celebración que no se mueve, así que es la que queda
// con "reducir movimiento" y la que lee VoiceOver.
app.cambiarVista('habitos');
app.datos.habitos.forEach(h => { if (!app.estaHecho(h.id, app.hoy())) app.alternarHoy(h.id); });
ok('con todo marcado, la barra dice "Día completo ✓"',
   $('progresoEtiqueta').textContent === 'Día completo ✓' && $('progresoEtiqueta').classList.contains('completo'));
app.cambiarVista('pendientes');
ok('al pasar a Pendientes, la etiqueta vuelve a ser la suya y sin verde',
   $('progresoEtiqueta').textContent !== 'Día completo ✓' && !$('progresoEtiqueta').classList.contains('completo'));
app.cambiarVista('habitos');
app.alternarHoy(app.datos.habitos[0].id);
ok('al desmarcar uno, vuelve a decir "Hoy"',
   $('progresoEtiqueta').textContent === 'Hoy' && !$('progresoEtiqueta').classList.contains('completo'));
app.alternarHoy(app.datos.habitos[0].id);
$('sello').classList.remove('visible', 'vete');
$('sello').innerHTML = '';

// ===========================================================================
// 9b. La medalla del hito de racha (v21)
//     Cuándo sale lo prueba pruebas.js. Aquí: que se arme bien, que hable el
//     idioma de la app y que "reducir movimiento" apague el adorno pero NO la
//     información.
// ===========================================================================
const idParaHito = app.datos.habitos[0].id;
$('confeti').innerHTML = '';
app.celebrarHito(idParaHito, 30);
ok('la medalla se hace visible', $('hito').classList.contains('visible'));
ok('muestra el número de días', $('hito').querySelector('.hito-numero').textContent === '30');
ok('y la etiqueta en español', $('hito').querySelector('.hito-etiqueta').textContent === 'días seguidos');
ok('y el nombre del hábito', $('hito').querySelector('.hito-nombre').textContent
   .includes(app.datos.habitos[0].nombre));
ok('el estallido lanza papelitos', $('confeti').children.length > 0 &&
   $('confeti').children.every(p => p.className === 'papelito estallido'));
ok('cada papelito del estallido trae su dirección (--dx y --dy)',
   $('confeti').children.every(p => p.style['--dx'] && p.style['--dy']));

app.cambiarIdioma('en');
app.celebrarHito(idParaHito, 7);
ok('en inglés la etiqueta cambia', $('hito').querySelector('.hito-etiqueta').textContent === 'days in a row');
ok('y una segunda medalla reemplaza a la primera, no se apila',
   $('hito').children.length === 1 && $('hito').querySelector('.hito-numero').textContent === '7');
app.cambiarIdioma('es');

$('confeti').innerHTML = '';
pideMenosMovimiento = true;
app.celebrarHito(idParaHito, 100);
ok('con "reducir movimiento" la medalla sale igual (tiene información)',
   $('hito').querySelector('.hito-numero').textContent === '100');
ok('pero sin estallido', $('confeti').children.length === 0);
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
// Con "reducir movimiento" para que marque en el acto: desde la v26, con
// movimiento normal hay una pausa para ver el tachado (se prueba en la
// sección 12, que puede esperar).
pideMenosMovimiento = true;
tarjetasCompras[0].querySelectorAll('.tarea-info')[0].click();
pideMenosMovimiento = false;
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

// ===========================================================================
// 12. Arrancar con los datos que ya tienes (v21)
// ---------------------------------------------------------------------------
// Todas las pruebas de arriba arrancan la app con el almacenamiento vacío. En
// la v21 eso escondió un error serio: cargar() usaba una constante declarada
// más abajo y, CON hábitos guardados, la app arrancaba vacía. Sin hábitos no
// se notaba. (El código de aquel error se quitó en la v24; la prueba se queda,
// porque arrancar con datos viejos es justo lo que pasa en el iPhone.)
// Aquí se arranca la app una segunda vez, con datos como los del iPhone.
// ===========================================================================
function pruebasDeArranque() {
  almacen['habitos-app-v1'] = JSON.stringify({
    version: 1, registros: {}, tareas: [], pendientes: [], prefs: {},
    habitos: [   // uno con el `color` de las v21-v23, dos de antes
      { id: 'v1', nombre: 'Leer',     emoji: '📖', creado: '2026-01-01', color: 2 },
      { id: 'v2', nombre: 'Agua',     emoji: '💧', creado: '2026-01-01' },
      { id: 'v3', nombre: 'Entrenar', emoji: '💪', creado: '2026-01-01' }
    ]
  });
  const errores = [];
  const errorDeVerdad = console.error;
  console.error = (...partes) => errores.push(partes.join(' '));
  // new Function corre el script entero en un espacio aparte, como una
  // segunda apertura de la app, sin chocar con la primera.
  const datosAlArrancar = new Function(script + '\n; return datos;')();
  console.error = errorDeVerdad;

  ok('arrancar con hábitos guardados no da errores al leerlos', errores.length === 0);
  ok('y no los pierde: siguen los tres', datosAlArrancar.habitos.length === 3);
  ok('y el campo `color` que ya no se usa queda limpio',
     datosAlArrancar.habitos.every(h => !('color' in h)));
}

// ===========================================================================
// 13. Las animaciones de la v26
//     Que se vean bien no se puede probar aquí. Lo que sí: que se disparen
//     cuando toca, que NO se disparen cuando no toca, y que la app siga
//     haciendo lo correcto mientras duran.
// ===========================================================================
async function pruebasDeMovimiento() {
  // La sección 10 deja puesta una nube de mentira que solo sabe bajar datos.
  // Aquí hay esperas largas (el toque largo) y la cola alcanzaría a querer
  // subir contra ella. Se quita: estas pruebas son de pantalla, no de nube.
  app.nube = null;

  // --- La píldora de los selectores de Ajustes
  app.cambiarVista('habitos');
  app.cambiarTema('claro');
  ok('la píldora del tema está en "Claro" (segunda)', $('temas').style['--i'] === '1');
  app.cambiarTema('auto');
  ok('y viaja de vuelta a "Automático"', $('temas').style['--i'] === '0');
  ok('la del idioma marca "Español"', $('idiomas').style['--i'] === '0');

  // --- El número de arriba entra desde abajo cuando cambia
  const idPrimero = app.datos.habitos[0].id;
  $('progresoTexto').classList.remove('numero-cambia');
  app.alternarHoy(idPrimero);
  ok('marcar un hábito hace subir el número del progreso',
     $('progresoTexto').classList.contains('numero-cambia'));
  $('progresoTexto').classList.remove('numero-cambia');
  app.cambiarVista('pendientes');
  ok('cambiar de sección no lo anima: es otro número, no uno que cambió',
     !$('progresoTexto').classList.contains('numero-cambia'));
  app.cambiarVista('habitos');
  app.alternarHoy(idPrimero);   // se deja como estaba

  // --- Las ventanas bajan al cerrarse
  app.abrirCalendario(idPrimero);
  app.cerrarCalendario();
  ok('al cerrar, la ventana deja de estar abierta en el acto',
     !$('modalCal').classList.contains('abierto'));
  ok('pero sigue visible mientras baja', $('modalCal').classList.contains('cerrando'));
  app.abrirCalendario(idPrimero);
  ok('reabrirla mientras baja la deja abierta y quieta',
     $('modalCal').classList.contains('abierto') && !$('modalCal').classList.contains('cerrando'));
  app.cerrarCalendario();
  await new Promise(listo => setTimeout(listo, 230));
  ok('terminada la bajada, desaparece', !$('modalCal').classList.contains('cerrando'));
  pideMenosMovimiento = true;
  app.abrirCalendario(idPrimero);
  app.cerrarCalendario();
  ok('con "reducir movimiento" se cierra de golpe, como antes',
     !$('modalCal').classList.contains('cerrando'));
  pideMenosMovimiento = false;

  // --- v27: mantener oprimido el círculo = no logrado
  const espera = ms => new Promise(listo => setTimeout(listo, ms));
  const hab = app.datos.habitos[0];
  // Las tarjetas salen en el orden de datos.habitos: la primera es la suya.
  const circulo = () => $('lista').children[0].querySelector('.check');
  const fallaHoy = () => (app.datos.fallos[app.hoy()] || []).includes(hab.id);
  if (app.estaHecho(hab.id, app.hoy())) app.alternarHoy(hab.id);   // hoy vacío

  let el = circulo();
  el.dispatchEvent({ type: 'pointerdown', clientX: 0, clientY: 0 });
  ok('al apoyar el dedo empieza el anillo', el.classList.contains('sosteniendo'));
  el.dispatchEvent({ type: 'pointerup' });
  ok('soltar antes de tiempo lo apaga', !el.classList.contains('sosteniendo'));
  await espera(app.TOQUE_LARGO + 30);
  ok('y no marca nada: fue un toque normal', !fallaHoy());

  el = circulo();
  el.dispatchEvent({ type: 'pointerdown', clientX: 0, clientY: 0 });
  el.dispatchEvent({ type: 'pointermove', clientX: 2, clientY: 30 });   // empezó un scroll
  await espera(app.TOQUE_LARGO + 30);
  ok('si el dedo se mueve (scroll), no cuenta como toque largo', !fallaHoy());

  el = circulo();
  el.dispatchEvent({ type: 'pointerdown', clientX: 0, clientY: 0 });
  await espera(app.TOQUE_LARGO + 30);
  ok('sostenerlo el tiempo completo lo deja no logrado', fallaHoy());
  el.click();   // el "click" que el navegador manda al soltar el dedo
  ok('el click al soltar no convierte el ✗ en ✓',
     fallaHoy() && !app.estaHecho(hab.id, app.hoy()));
  ok('el ✗ recién puesto sacude el círculo', circulo().classList.contains('negar'));

  el = circulo();
  el.dispatchEvent({ type: 'pointerdown', clientX: 0, clientY: 0 });
  await espera(app.TOQUE_LARGO + 30);
  ok('sostenerlo otra vez quita el ✗', !fallaHoy() && !app.estaHecho(hab.id, app.hoy()));

  // --- v27: "Cerrar" también arriba en el calendario
  app.abrirCalendario(hab.id);
  $('calCerrarArriba').click();
  ok('el Cerrar de arriba cierra el calendario', !$('modalCal').classList.contains('abierto'));
  await espera(230);

  // --- v28: el cuadro de confirmar
  app.agregarHabito('Para borrar', '🗑️');
  const cuantos = app.datos.habitos.length;
  const ultima = () => $('lista').children[$('lista').children.length - 1];
  ultima().querySelector('.borrar').click();
  ok('borrar un hábito abre el cuadro propio', $('modalConfirmar').classList.contains('abierto'));
  ok('y pregunta por su nombre', $('confirmarTitulo').textContent === '¿Borrar "Para borrar"?');
  ok('el botón rojo dice Borrar', $('confirmarSi').textContent === 'Borrar');
  $('confirmarNo').click();
  await espera(0);
  ok('Cancelar no borra nada', app.datos.habitos.length === cuantos);
  ok('y cierra el cuadro', !$('modalConfirmar').classList.contains('abierto'));
  ultima().querySelector('.borrar').click();
  $('confirmarSi').click();
  await espera(0);
  ok('Borrar sí lo borra', app.datos.habitos.length === cuantos - 1);
  app.cambiarIdioma('en');
  $('lista').children[0].querySelector('.borrar').click();
  ok('el cuadro también habla inglés', $('confirmarTitulo').textContent.startsWith('Delete "'));
  $('confirmarNo').click();
  await espera(0);
  app.cambiarIdioma('es');
  await espera(230);

  // --- v28: la nota de una idea se lee con formato y se edita en crudo
  app.agregarTarea('Idea con nota', 'ideas');
  const idNotaIdea = app.datos.tareas.find(x => x.texto === 'Idea con nota').id;
  app.abrirFicha(idNotaIdea);
  ok('sin nota, la ficha abre directo para escribir',
     $('fichaNotaVista').hidden && !$('fichaNotaEditor').hidden);
  app.datos.tareas.find(x => x.id === idNotaIdea).nota = '- [ ] uno\n**dos**';
  app.abrirFicha(idNotaIdea);
  ok('con nota, la ficha abre mostrándola con formato',
     !$('fichaNotaVista').hidden && $('fichaNotaEditor').hidden);
  ok('y el formato está dibujado', $('fichaNotaVista').innerHTML.includes('<strong>dos</strong>') &&
     $('fichaNotaVista').innerHTML.includes('class="casilla"'));
  $('fichaNotaVista').click();
  ok('tocar la nota abre el editor', $('fichaNotaVista').hidden && !$('fichaNotaEditor').hidden);
  $('fichaNota').value = 'comprar';
  $('fichaNota').selectionStart = $('fichaNota').selectionEnd = 3;
  $('fichaCasilla').click();
  ok('el botón ☐ de la barra pone una casilla', $('fichaNota').value === '- [ ] comprar');
  app.cerrarFicha && app.cerrarFicha();
  await espera(230);

  // --- v33: tocar una casilla de la nota la marca y, al rato, la baja al
  // fondo. El navegador de mentira no sabe hacer closest(), así que el toque
  // se le da a mano: un "objetivo" que dice ser la casilla de la línea 0.
  const tocarCasilla = (idVista, linea) => $(idVista).onclick({
    target: { closest: sel => sel === '.casilla' ? { dataset: { linea: String(linea) } } : null }
  });
  app.datos.tareas.find(x => x.id === idNotaIdea).nota = '- [ ] uno\n- [ ] dos';
  app.abrirFicha(idNotaIdea);
  tocarCasilla('fichaNotaVista', 0);
  const notaIdea = () => app.datos.tareas.find(x => x.id === idNotaIdea).nota;
  ok('tocar una casilla de la nota la marca y la guarda en el acto',
     notaIdea() === '- [x] uno\n- [ ] dos');
  ok('pero todavía no se mueve: se tacha donde está', $('fichaNota').value.startsWith('- [x] uno'));
  await espera(app.PAUSA_TACHADO + 60);
  ok('y tras la pausa baja al fondo', notaIdea() === '- [ ] dos\n- [x] uno');
  ok('y la vista se redibuja con el nuevo orden',
     $('fichaNotaVista').innerHTML.indexOf('dos') < $('fichaNotaVista').innerHTML.indexOf('uno'));
  app.cerrarFicha();
  await espera(230);

  // --- v33: las compras tienen ficha, pero se abre en modo edición
  app.cambiarVista('compras');
  app.agregarTarea('Tenis', 'compras');
  const idTenis = app.datos.tareas.find(x => x.texto === 'Tenis').id;
  app.abrirFicha(idTenis);
  ok('la ficha de una compra se titula "Compra"', $('fichaTitulo').textContent === 'Compra');
  ok('y su nota se llama "Nota", no "Contexto"', $('fichaNotaEtiqueta').textContent === 'Nota');
  ok('y no ofrece mandarla a Pendientes', $('fichaMover').hidden === true);
  $('fichaNota').value = 'Talla 10 https://tienda.example/tenis';
  $('fichaGuardar').click();
  ok('guardar le pone la nota a la compra',
     app.datos.tareas.find(x => x.id === idTenis).nota === 'Talla 10 https://tienda.example/tenis');
  await espera(230);
  app.pintarLista();
  const tarjetaTenis = () => $('tareasCuerpo').children
    .find(x => x.querySelector('.tarea-texto').textContent.includes('Tenis'));
  ok('la nota se asoma debajo de la compra en la lista',
     tarjetaTenis().querySelectorAll('.tarea-nota').length === 1);
  ok('sin el subrayado de "tocar abre": en Compras tocar marca',
     !tarjetaTenis().className.includes('idea'));
  doc.body.classList.add('editando');
  tarjetaTenis().querySelectorAll('.tarea-info')[0].click();
  ok('en modo edición, tocar la compra abre su ficha',
     $('modalFicha').classList.contains('abierto') && $('fichaTexto').value === 'Tenis');
  ok('y no la marca', !app.datos.tareas.find(x => x.id === idTenis).hecha);
  app.cerrarFicha();
  doc.body.classList.remove('editando');
  await espera(230);

  // Y la ficha de una idea, abierta después, vuelve a ser de idea
  app.abrirFicha(idNotaIdea);
  ok('la ficha vuelve a decir "Idea" con una idea', $('fichaTitulo').textContent === 'Idea' &&
     $('fichaNotaEtiqueta').textContent === 'Contexto' && $('fichaMover').hidden === false);
  app.cerrarFicha();
  await espera(230);
  app.cambiarVista('pendientes');

  // --- El tachado: primero se tacha donde la tocaste, luego se va abajo
  app.cambiarVista('pendientes');
  app.agregarTarea('Tachar despacio');
  const tarjeta = () => $('tareasCuerpo').children
    .find(x => x.querySelector('.tarea-texto').textContent.includes('Tachar despacio'));
  const tarea = () => app.tareasDe('pendientes').find(x => x.texto === 'Tachar despacio');

  tarjeta().querySelector('.check').click();
  ok('al marcar, la tarjeta se tacha en el acto', tarjeta().classList.contains('tachando'));
  ok('y su círculo celebra', tarjeta().querySelector('.check').classList.contains('celebrar'));
  ok('pero todavía no se movió: el dato cambia después de la pausa', !tarea().hecha);

  await new Promise(listo => setTimeout(listo, app.PAUSA_TACHADO + 20));
  ok('pasada la pausa, queda marcada', tarea().hecha === true);
  ok('y la tarjeta nueva nace tachada, sin repetir la animación',
     tarjeta().classList.contains('hecha') && !tarjeta().classList.contains('tachando'));

  // Desmarcar no tiene pausa: no hay raya que mirar.
  tarjeta().querySelector('.check').click();
  ok('desmarcar es inmediato', tarea().hecha === false);
}

// ===========================================================================
// 15. Fechas importantes (v30)
//     La lógica (próxima vez, 29 de febrero, agenda) la prueba pruebas.js.
//     Aquí: que la quinta pestaña lleve a su sección, que el + abra la
//     ventana correcta, que guardar dibuje la fecha en el mes y en la agenda,
//     que la franja de Hábitos aparezca solo cuando toca, y que borrar
//     pregunte con el cuadro propio.
// ===========================================================================
async function pruebasDeFechas() {
  app.datos.fechas = [];
  app.cambiarVista('habitos');
  ok('hay una quinta pestaña, "Fechas"', $('pestanaFechas') && $('pestanaFechas').textContent === 'Fechas');
  ok('y "fechas" es la quinta sección de la lista', app.VISTAS.indexOf('fechas') === 4);
  ok('sin fechas, la franja de Hábitos no se ve', $('franjaFechas').hidden === true);

  $('pestanaFechas').onclick();
  ok('tocar la pestaña muestra Fechas', app.vista === 'fechas' && $('vistaFechas').hidden === false);
  ok('y esconde los hábitos y las listas', $('lista').hidden && $('listaTareas').hidden);
  ok('la pestaña se ilumina y la píldora viaja a la quinta',
     $('pestanaFechas').classList.contains('activa') && $('pestanas').style['--i'] === '4');
  ok('el body sabe que está en Fechas (el CSS esconde "Editar" y la barra de progreso)',
     doc.body.classList.contains('vista-fechas'));
  ok('vacía, explica cómo agregar la primera', $('fechasAgenda').innerHTML.includes('+ Agregar'));
  ok('el mes tiene sus días', $('fechasGrid').children.filter(c => !c.classList.contains('relleno')).length >= 28);
  ok('y hoy está marcado y elegido',
     $('fechasGrid').children.some(c => c.classList.contains('hoy') && c.classList.contains('elegido')));
  $('fechasAgregarDia').onclick();
  ok('"+ Agregar" (junto al día) abre la ventana de una fecha nueva',
     $('modalFecha').classList.contains('abierto') && $('fechaVentanaTitulo').textContent === 'Nueva fecha');
  ok('con hoy ya puesto como día', $('fechaDia').value === app.hoy());
  ok('y sin "Borrar" ni "A Pendientes": todavía no existe', $('fechaAcciones').hidden === true);

  $('fechaGuardar').onclick();
  ok('sin título no se guarda y la ventana sigue abierta',
     app.datos.fechas.length === 0 && $('modalFecha').classList.contains('abierto'));

  $('fechaNombre').value = 'Cumple de <b>Ana</b>';
  $('fechaGuardar').onclick();
  ok('con título se guarda y la ventana se cierra',
     app.datos.fechas.length === 1 && !$('modalFecha').classList.contains('abierto'));
  ok('el día queda con su puntito en el mes',
     $('fechasGrid').children.some(c => c.classList.contains('hoy') && c.classList.contains('con-fecha')));
  const filas = () => $('fechasAgenda').querySelectorAll('.fecha-fila');
  ok('y aparece en la agenda', filas().length === 1);
  ok('el título entra como texto, no como HTML',
     filas()[0].querySelector('.fecha-titulo').textContent === 'Cumple de <b>Ana</b>');
  ok('como es hoy, lleva el chip "Hoy"', filas()[0].querySelector('.fecha-faltan').textContent === 'Hoy');

  // Plegar la agenda (v30): un ajuste de este teléfono.
  ok('"Próximas" muestra cuántas hay', $('fechasCuenta').textContent === '1');
  ok('y arranca desplegada', $('fechasAgenda').hidden === false &&
     $('fechasPlegar').getAttribute('aria-expanded') === 'true');
  $('fechasPlegar').onclick();
  ok('tocar "Próximas" la pliega', $('fechasAgenda').hidden === true &&
     $('fechasPlegar').getAttribute('aria-expanded') === 'false');
  ok('plegada, la cuenta sigue a la vista', $('fechasCuenta').textContent === '1');
  ok('y se recuerda en el teléfono', JSON.parse(almacen['habitos-app-v1']).prefs.proximasPlegadas === true);
  app.cambiarVista('habitos'); app.cambiarVista('fechas');
  ok('al volver a Fechas sigue plegada', $('fechasAgenda').hidden === true);
  $('fechasPlegar').onclick();
  ok('tocarla otra vez la despliega', $('fechasAgenda').hidden === false);

  app.cambiarVista('pendientes');
  ok('en Pendientes la franja no se ve', $('franjaFechas').hidden === true);
  app.cambiarVista('habitos');
  ok('en Hábitos, con algo hoy, la franja aparece', $('franjaFechas').hidden === false);
  ok('y dice qué es', $('franjaFechas').querySelector('.franja-titulo').textContent === 'Cumple de <b>Ana</b>');
  $('franjaFechas').onclick();
  ok('tocarla lleva a Fechas', app.vista === 'fechas');

  // Una fecha que ya existe: se abre para leer, con sus acciones.
  const id = app.datos.fechas[0].id;
  app.abrirFecha(id);
  ok('una fecha que existe abre con su título', $('fechaVentanaTitulo').textContent === 'Fecha' &&
     $('fechaNombre').value === 'Cumple de <b>Ana</b>');
  ok('y con sus acciones', $('fechaAcciones').hidden === false);

  // v33: la nota de una fecha se lee con formato, igual que la de una idea
  ok('sin nota, la fecha abre el campo para escribir',
     $('fechaNotaVista').hidden && !$('fechaNotaEditor').hidden);
  app.datos.fechas.find(x => x.id === id).nota = '- [ ] regalo\n- [ ] **torta**';
  app.abrirFecha(id);
  ok('con nota, la fecha la muestra con formato',
     !$('fechaNotaVista').hidden && $('fechaNotaVista').innerHTML.includes('<strong>torta</strong>'));
  $('fechaNotaVista').onclick({ target: { closest: sel => sel === '.casilla' ? { dataset: { linea: '0' } } : null } });
  ok('tocar una casilla de la fecha la marca y la guarda',
     app.datos.fechas.find(x => x.id === id).nota === '- [x] regalo\n- [ ] **torta**');
  ok('sin tocar el resto de la fecha', app.datos.fechas.find(x => x.id === id).titulo === 'Cumple de <b>Ana</b>');
  $('fechaNotaVista').click();
  ok('tocar fuera de una casilla abre el editor', !$('fechaNotaEditor').hidden);
  $('fechaNota').value = 'pastel';
  $('fechaNota').selectionStart = $('fechaNota').selectionEnd = 0;
  $('fechaCasilla').click();
  ok('y la barra de formato también está en Fechas', $('fechaNota').value === '- [ ] pastel');
  app.abrirFecha(id);   // abrir otra vez descarta lo que no guardaste
  const tareasAntes = app.datos.tareas.length;
  $('fechaPendiente').onclick();
  ok('"A Pendientes" crea el pendiente', app.datos.tareas.length === tareasAntes + 1);
  ok('y el botón avisa y se apaga', $('fechaPendiente').textContent === '✓ En Pendientes' && $('fechaPendiente').disabled);

  // Borrar pregunta con el cuadro propio, encima de la ficha.
  respuestaConfirm = true;
  const borrando = $('fechaBorrar').onclick();
  ok('borrar pregunta antes', $('modalConfirmar').classList.contains('abierto') &&
     $('confirmarTitulo').textContent === '¿Borrar esta fecha?');
  $('confirmarSi').onclick();
  await borrando;
  ok('al decir que sí se borra y la ficha se cierra',
     app.datos.fechas.length === 0 && !$('modalFecha').classList.contains('abierto'));

  // Una fecha lejana no sale en la franja.
  app.datos.fechas = [{ id: 'lejos', titulo: 'Vuelo', fecha: '2099-01-01', repite: 'no', emoji: '✈️' }];
  app.cambiarVista('habitos');
  ok('algo dentro de mucho no sale en la franja', $('franjaFechas').hidden === true);

  // Repeticiones (v31). mini-dom no lee los botones escritos en el HTML,
  // así que se prueba abriendo una fecha que ya trae su repetición.
  app.datos.fechas = [{ id: 'pago', titulo: 'Seguro', fecha: '2026-01-05', repite: 'mensual', cada: 3, emoji: '💳' }];
  app.cambiarVista('fechas');
  ok('una mensual dice en su fila cada cuánto vuelve',
     $('fechasAgenda').querySelector('.fecha-sub').textContent.includes('cada 3 meses'));
  app.abrirFecha('pago');
  ok('al abrirla, la línea "Cada" se ve con su número', $('fechaCadaFila').hidden === false && $('fechaCada').value === '3');
  ok('y la unidad va en plural', $('fechaCadaUnidad').textContent === 'meses');
  $('fechaCada').value = '1';
  $('fechaCada').dispatchEvent({ type: 'input' });
  ok('con 1, en singular', $('fechaCadaUnidad').textContent === 'mes');
  $('fechaGuardar').onclick();
  ok('guardar con 1 quita el "cada"', !('cada' in app.datos.fechas[0]) && app.datos.fechas[0].repite === 'mensual');
  app.abrirFecha(null);
  ok('una nueva arranca en "Una vez", sin la línea "Cada"', $('fechaCadaFila').hidden === true);

  // La casilla "+" del emoji propio (v31).
  const casilla = $('fechaEmojiPropio');
  let cerroTeclado = false;
  casilla.blur = () => { cerroTeclado = true; };   // mini-dom no trae blur
  const botonesEmoji = () => $('fechaEmojisLista').children;
  ok('la ventana trae los seis emojis de siempre', botonesEmoji().length === 6);
  ok('y la casilla "+" vacía, sin marcar', casilla.value === '' && !casilla.classList.contains('elegido'));
  casilla.value = 'a';
  casilla.dispatchEvent({ type: 'input' });
  ok('una letra en la casilla se borra sola', casilla.value === '' && !cerroTeclado);
  casilla.value = '🎓';
  casilla.dispatchEvent({ type: 'input' });
  ok('un emoji en la casilla queda marcado y cierra el teclado',
     casilla.value === '🎓' && casilla.classList.contains('elegido') && cerroTeclado);
  ok('y ningún botón de la lista queda marcado', !botonesEmoji().some(b => b.classList.contains('elegido')));
  $('fechaNombre').value = 'Graduación';
  $('fechaGuardar').onclick();
  ok('la fecha se guarda con el emoji propio', app.datos.fechas.some(f => f.titulo === 'Graduación' && f.emoji === '🎓'));
  app.abrirFecha(null);
  ok('la próxima vez, el 🎓 ya está en la lista', botonesEmoji().length === 7 && botonesEmoji()[6].textContent === '🎓');
  ok('y la casilla vuelve a ser un "+"', casilla.value === '' && !casilla.classList.contains('elegido'));
  casilla.value = '🎂';
  casilla.dispatchEvent({ type: 'input' });
  ok('escribir uno que ya está en la lista marca su botón, no la casilla',
     casilla.value === '' && botonesEmoji().find(b => b.textContent === '🎂').classList.contains('elegido'));
  // Quitar emojis de la fila (v32).
  $('fechaEmojisEditar').onclick();
  ok('"Editar" pone la fila en modo quitar',
     botonesEmoji().every(b => b.classList.contains('quitable')) && $('fechaEmojisEditar').textContent === 'Listo');
  ok('y esconde la casilla "+"', casilla.hidden === true);
  ok('cada ✕ dice qué quita', botonesEmoji()[0].getAttribute('aria-label') === 'Quitar 📌');
  const elegidoAntes = botonesEmoji().length;
  botonesEmoji().find(b => b.textContent === '🏥').onclick();
  ok('tocar un emoji lo quita de la fila', botonesEmoji().length === elegidoAntes - 1 &&
     !botonesEmoji().some(b => b.textContent === '🏥'));
  ok('y queda anotado en el teléfono', JSON.parse(almacen['habitos-app-v1']).prefs.emojisOcultos.includes('🏥'));
  botonesEmoji().find(b => b.textContent === '📌').onclick();
  $('fechaEmojisEditar').onclick();
  ok('"Listo" vuelve a elegir, con la casilla de nuevo', casilla.hidden === false &&
     botonesEmoji().every(b => !b.classList.contains('quitable')) && $('fechaEmojisEditar').textContent === 'Editar');
  ok('quitar el elegido de una fecha nueva elige el primero que queda',
     botonesEmoji()[0].textContent === '🎂' && botonesEmoji()[0].classList.contains('elegido'));
  casilla.value = '🏥';
  casilla.dispatchEvent({ type: 'input' });
  ok('escribir uno que quitaste lo devuelve a la fila', botonesEmoji().some(b => b.textContent === '🏥' && b.classList.contains('elegido'))
     && !app.datos.prefs.emojisOcultos.includes('🏥'));
  $('fechaCancelar').onclick();
  app.abrirFecha(null);
  ok('una fecha nueva arranca sin el 📌 quitado', botonesEmoji()[0].textContent === '🎂' &&
     botonesEmoji()[0].classList.contains('elegido'));
  const graduacion = app.datos.fechas.find(f => f.emoji === '🎓');
  $('fechaEmojisEditar').onclick();
  botonesEmoji().find(b => b.textContent === '🎓').onclick();
  $('fechaCancelar').onclick();
  app.abrirFecha(graduacion.id);
  ok('una fecha que usa un emoji quitado lo conserva, en la casilla', graduacion.emoji === '🎓' &&
     casilla.value === '🎓' && casilla.classList.contains('elegido'));
  ok('y abre fuera del modo quitar', $('fechaEmojisEditar').textContent === 'Editar');
  app.datos.prefs.emojisOcultos = [];

  // Hoy en amarillo y el botón "Hoy" (v32).
  // Lo de arriba guardó el seguro mensual y la app quedó parada en su
  // próxima vez, en noviembre: ahí el botón SÍ debe verse. Se parte de hoy.
  ok('parada en otro mes (el del seguro), "Hoy" se ve', $('fechasVolverHoy').hidden === false);
  app.irAlDia(app.hoy());
  ok('en el mes de hoy no hay botón "Hoy"', $('fechasVolverHoy').hidden === true);
  $('fechasAdelante').onclick();
  ok('al ir a otro mes aparece', $('fechasVolverHoy').hidden === false);
  ok('y hoy no está en la cuadrícula de ese mes', !$('fechasGrid').children.some(c => c.classList.contains('hoy')));
  $('fechasVolverHoy').onclick();
  ok('tocarlo vuelve al mes de hoy y lo elige', $('fechasVolverHoy').hidden === true &&
     $('fechasGrid').children.some(c => c.classList.contains('hoy') && c.classList.contains('elegido')));

  $('fechaCancelar').onclick();
  // De vuelta a Hábitos: el cambio de idioma solo retraduce las pestañas
  // desde ahí (límite conocido de la v19, ver CLAUDE.md).
  app.cambiarVista('habitos');

  app.cambiarIdioma('en');
  ok('en inglés la pestaña dice "Dates"', $('pestanaFechas').textContent === 'Dates');
  app.cambiarIdioma('es');
  app.datos.fechas = [];
  app.cambiarVista('habitos');
}

pruebasDeInsignia().then(pruebasDeCopia).then(pruebasDeCarrera).then(pruebasDeMovimiento)
  .then(pruebasDeFechas).then(pruebasDeArranque).then(() => {
  console.log(fallos === 0
    ? '\n🎉 La app entera funciona'
    : `\n⚠️ ${fallos} fallo(s)`);
  process.exit(fallos ? 1 : 0);
});
