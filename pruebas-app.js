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
global.navigator = { onLine: true, serviceWorker: undefined };
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
    celebrarDiaCompleto, coloresConfeti, moverTarea, alternarTarea, tareasOrdenadas
  });
  Object.defineProperty(app, 'datos', { get: () => datos });
  Object.defineProperty(app, 'vista', { get: () => vista });
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
// 10. Reordenar pendientes desde la pantalla
// ===========================================================================
app.cambiarVista('pendientes');
app.agregarTarea('Segundo', 'pendientes');
app.agregarTarea('Tercero', 'pendientes');
app.pintarLista();

const enPantalla = () => app.tareasOrdenadas('pendientes').map(x => x.texto).join(',');
ok('los tres pendientes están en orden', enPantalla() === 'Comprar café,Segundo,Tercero');

const idSegundo = app.datos.tareas.find(x => x.texto === 'Segundo').id;
app.moverTarea(idSegundo, -1);
ok('subir un pendiente lo mueve en pantalla', enPantalla() === 'Segundo,Comprar café,Tercero');
ok('la idea de la otra lista sigue intacta',
   app.tareasOrdenadas('ideas').map(x => x.texto).join(',') === 'App de propinas');

app.pintarLista();
const flechasApagadas = $('tareasCuerpo').children
  .flatMap(t => t.querySelectorAll('.subir'))
  .filter(b => b.disabled).length;
ok('la primera tarjeta tiene su flecha de subir apagada', flechasApagadas >= 1);

console.log(fallos === 0
  ? '\n🎉 La app entera funciona'
  : `\n⚠️ ${fallos} fallo(s)`);
process.exit(fallos ? 1 : 0);
