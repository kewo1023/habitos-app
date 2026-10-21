const fs = require('fs');
const html = fs.readFileSync(__dirname + '/index.html','utf8');

// Extraer solo el <script> grande. Ojo: al final del archivo hay un
// segundo <script type="module"> (la librería de Supabase), así que
// buscamos el cierre que viene DESPUÉS de la apertura, no el último.
const inicio = html.lastIndexOf('<script>');
const script = html.slice(inicio, html.indexOf('</script>', inicio));

// Secciones A-D (datos y consultas) + H (copia de seguridad) + M1
// (traducir errores). Nos saltamos todo lo que toca la pantalla o la
// red, porque aquí no hay ni pantalla ni red.
const trozo = (desde, hasta) => script.slice(script.indexOf(desde), script.indexOf(hasta));
const logica = trozo('/* ---------- A0.', '/* ---------- fin A0')
             + trozo('const CLAVE', '/* ---------- E.')
             + trozo('/* ---------- H. COPIA', '/* ---------- I.')
             + trozo('/* ---------- F0.', '/* ---------- fin F0')
             + trozo('/* ---------- M1.', '/* ---------- fin M1')
             + trozo('/* ---------- M5.', '/* ---------- fin M5');

// Shims mínimos
const store = {};
global.localStorage = { getItem:k=>store[k]??null, setItem:(k,v)=>store[k]=String(v) };
global.crypto = require('crypto').webcrypto;
global.pintar = () => {};        // en el test no dibujamos nada
global.pintarLista = () => {};   // lo mismo para pendientes e ideas
global.pintarFechas = () => {};  // y para las fechas importantes (v30)
global.habitoRecienMarcado = null;   // la marca de "anima este círculo"; aquí no hay círculo
global.habitoRecienFallado = null;   // lo mismo para el ✗ (v27)

// El confeti no se puede probar (no hay pantalla), pero sí se puede contar
// cuántas veces se pidió lanzarlo. Eso es lo que de verdad importa: que salga
// en el momento justo y no en cualquier otro.
global.confetisLanzados = 0;
global.celebrarDiaCompleto = () => { global.confetisLanzados++; };
// Lo mismo con la medalla del hito de racha: se anota cuál hito se pidió.
global.hitosCelebrados = [];
global.celebrarHito = (id, dias) => { global.hitosCelebrados.push(dias); };
let ultimaAlerta = null;
global.alert = m => { ultimaAlerta = m; };
global.confirm = () => true;     // por defecto decimos que sí a todo

const ctx = {};
eval(logica + '\n; Object.assign(ctx,{hoy,haceNDias,estaHecho,calcularRacha,alternarHoy,agregarHabito,borrarHabito,cargar,claveFecha,esCopiaValida,importar,nombreArchivo,claveDe,diasDelMes,columnaInicio,esFutura,contarMes,alternarFecha,fechasDe,totalDias,diasEntre,mejorRacha,fechaInicio,diasDeVida,porcentajeUltimos,renombrarHabito,moverHabito,mensajeDeError,habitoAFila,filasAHabitos,filasARegistros,textoPendientes,encolar,primerEmoji,cambiarEmoji,agregarTarea,alternarTarea,renombrarTarea,borrarTarea,limpiarHechas,tareasOrdenadas,contarTareas,tareasDe,moverALista,editarTarea,diaCompleto,moverTarea,tareaAFila,filasATareas,encolarTareasDesde,sePuedeAplicarLoBajado,esLista,LISTAS,cambiarPrioridad,siguientePrioridad,pesoPrioridad,PRIORIDADES,t,TEXTOS,IDIOMAS,TEMAS,localeFechas,PREFS_POR_DEFECTO,fuerzaHabito,FUERZA_ALFA,mesesHasta,textoUltimaCopia,celdaCSV,aCSV,nombreArchivoCSV,estadoInsignia,hitoDeRacha,HITOS,esFallo,ponerFallo,ciclarFecha,alternarFalloHoy,revisarCopia,aplicarCopia,notaAHtml,alternarCasilla,ordenarCasillas,notaEnTexto,aplicarFormatoTexto,escaparHtml,LARGO_NOTA,esFechaValida,ocurrenciaEnAnio,proximaOcurrencia,aniosQueCumple,caeEnDia,fechasDelDia,diasConFechas,agendaFechas,fechasPasadas,proximasFechas,textoFaltan,limpiarFecha,agregarFecha,editarFecha,borrarFecha,fechaAPendiente,REPITE,EMOJIS_FECHA,DIAS_PROXIMAS,seRepite,cadaDe,sumarDias,sumarMeses,mesesEntre,textoRepite,emojisParaFechas,ORDEN_REPITE,ocultarEmoji,mostrarEmoji,esOtroMes,PREFS_POR_DEFECTO}); Object.defineProperty(ctx,"datos",{get:()=>datos,set:v=>{datos=v}});');

let fallos = 0;
const ok = (nombre, cond) => { console.log((cond?'✅':'❌')+' '+nombre); if(!cond) fallos++; };

// --- formato de fecha
ok('claveFecha usa AAAA-MM-DD con ceros', ctx.claveFecha(new Date(2026,0,5)) === '2026-01-05');
ok('haceNDias(0) === hoy()', ctx.haceNDias(0) === ctx.hoy());

// --- agregar y marcar
ctx.agregarHabito('Leer','📖');
ctx.agregarHabito('Agua','💧');
const id = ctx.datos.habitos[0].id;
ok('se crearon 2 hábitos', ctx.datos.habitos.length === 2);
ok('los ids son distintos', ctx.datos.habitos[0].id !== ctx.datos.habitos[1].id);
ok('empieza sin marcar', ctx.estaHecho(id, ctx.hoy()) === false);

ctx.alternarHoy(id);
ok('marcar funciona', ctx.estaHecho(id, ctx.hoy()) === true);
ok('racha = 1 al marcar hoy', ctx.calcularRacha(id) === 1);
ctx.alternarHoy(id);
ok('desmarcar funciona', ctx.estaHecho(id, ctx.hoy()) === false);
ok('racha = 0 tras desmarcar', ctx.calcularRacha(id) === 0);

// --- rachas con historial
ctx.datos.registros = {};
for (let i=1;i<=5;i++){ ctx.datos.registros[ctx.haceNDias(i)] = [id]; }
ok('racha 5 (ayer→hace 5d) aunque hoy no esté marcado', ctx.calcularRacha(id) === 5);
ctx.datos.registros[ctx.hoy()] = [id];
ok('racha 6 al marcar hoy', ctx.calcularRacha(id) === 6);
delete ctx.datos.registros[ctx.haceNDias(3)];
ok('la racha se corta en el hueco (=3)', ctx.calcularRacha(id) === 3);

// --- persistencia real
const releido = ctx.cargar();
ok('los datos sobreviven al guardado/lectura', releido.habitos.length === 2);

// --- borrar limpia el historial
ctx.borrarHabito(id);
ok('el hábito se borró', ctx.datos.habitos.length === 1);
const restos = Object.values(ctx.datos.registros).flat().filter(x=>x===id);
ok('no quedan registros huérfanos', restos.length === 0);


// --- calendario: fechas
ok('claveDe arma la fecha con ceros', ctx.claveDe(2026, 3, 7) === '2026-03-07');
ok('enero tiene 31 días',   ctx.diasDelMes(2026, 1) === 31);
ok('abril tiene 30 días',   ctx.diasDelMes(2026, 4) === 30);
ok('febrero normal: 28',    ctx.diasDelMes(2026, 2) === 28);
ok('febrero bisiesto: 29',  ctx.diasDelMes(2024, 2) === 29);
ok('2100 no es bisiesto',   ctx.diasDelMes(2100, 2) === 28);

// 1 de agosto de 2026 cae sábado -> columna 5 contando desde lunes=0
ok('el mes arranca en la columna correcta (sábado)', ctx.columnaInicio(2026, 8) === 5);
// 1 de junio de 2026 cae lunes -> columna 0
ok('un mes que empieza en lunes va en la columna 0', ctx.columnaInicio(2026, 6) === 0);
// 1 de noviembre de 2026 cae domingo -> última columna
ok('un mes que empieza en domingo va en la columna 6', ctx.columnaInicio(2026, 11) === 6);

ok('hoy no es futuro',       ctx.esFutura(ctx.hoy()) === false);
ok('ayer no es futuro',      ctx.esFutura(ctx.haceNDias(1)) === false);
ok('mañana sí es futuro',    ctx.esFutura(ctx.haceNDias(-1)) === true);

// --- calendario: marcar días pasados y contar el mes
ctx.datos.habitos = [];
ctx.datos.registros = {};
ctx.agregarHabito('Correr','🏃');
const idCal = ctx.datos.habitos[0].id;

ok('marcar una fecha pasada funciona',
   ctx.alternarFecha(idCal, '2026-03-05') === true && ctx.estaHecho(idCal, '2026-03-05'));
ok('desmarcar esa fecha funciona',
   ctx.alternarFecha(idCal, '2026-03-05') === true && !ctx.estaHecho(idCal, '2026-03-05'));
ok('el día vacío no queda guardado', ctx.datos.registros['2026-03-05'] === undefined);

ctx.alternarFecha(idCal, '2026-03-01');
ctx.alternarFecha(idCal, '2026-03-15');
ctx.alternarFecha(idCal, '2026-04-02');
ok('contarMes solo cuenta su mes', ctx.contarMes(idCal, 2026, 3) === 2);
ok('contarMes cuenta el otro mes aparte', ctx.contarMes(idCal, 2026, 4) === 1);
ok('un mes sin nada cuenta 0', ctx.contarMes(idCal, 2026, 5) === 0);

const futura = ctx.haceNDias(-3);
ok('no deja marcar el futuro', ctx.alternarFecha(idCal, futura) === false);
ok('y no guardó nada del futuro', ctx.estaHecho(idCal, futura) === false);

ok('alternarHoy sigue funcionando igual',
   ctx.alternarHoy(idCal) === true && ctx.estaHecho(idCal, ctx.hoy()));
ctx.alternarHoy(idCal);

// --- estadísticas: distancia entre fechas
ok('diasEntre días seguidos = 1',      ctx.diasEntre('2026-08-03','2026-08-04') === 1);
ok('diasEntre la misma fecha = 0',     ctx.diasEntre('2026-08-04','2026-08-04') === 0);
ok('diasEntre cruzando de mes',        ctx.diasEntre('2026-01-31','2026-02-01') === 1);
ok('diasEntre cruzando de año',        ctx.diasEntre('2025-12-31','2026-01-01') === 1);
ok('diasEntre pasando por febrero bisiesto',
   ctx.diasEntre('2024-02-28','2024-03-01') === 2);
ok('diasEntre hacia atrás da negativo', ctx.diasEntre('2026-08-04','2026-08-01') === -3);

// --- estadísticas: fechas de un hábito y mejor racha
ctx.datos.habitos = [];
ctx.datos.registros = {};
ctx.agregarHabito('Meditar','🧘');
ctx.agregarHabito('Otro','📖');
const idA = ctx.datos.habitos[0].id;
const idB = ctx.datos.habitos[1].id;

ok('un hábito sin historial: 0 días',   ctx.totalDias(idA) === 0);
ok('un hábito sin historial: mejor racha 0', ctx.mejorRacha(idA) === 0);

// Bloque de 3 días, hueco, bloque de 5 días, hueco, 1 día suelto
['2026-03-01','2026-03-02','2026-03-03',
 '2026-03-10','2026-03-11','2026-03-12','2026-03-13','2026-03-14',
 '2026-03-20'].forEach(f => ctx.datos.registros[f] = [idA]);
// ruido: otro hábito el mismo día, no debe contarse
ctx.datos.registros['2026-03-01'].push(idB);

ok('fechasDe devuelve solo sus fechas', ctx.fechasDe(idA).length === 9);
ok('fechasDe las devuelve ordenadas',
   JSON.stringify(ctx.fechasDe(idA)) === JSON.stringify(ctx.fechasDe(idA).slice().sort()));
ok('fechasDe no mezcla hábitos',        ctx.fechasDe(idB).length === 1);
ok('totalDias cuenta bien',             ctx.totalDias(idA) === 9);
ok('mejorRacha toma el bloque más largo', ctx.mejorRacha(idA) === 5);
ok('mejorRacha de un solo día es 1',    ctx.mejorRacha(idB) === 1);

// un bloque que cruza de mes debe contarse seguido
ctx.datos.registros = {};
['2026-01-30','2026-01-31','2026-02-01','2026-02-02'].forEach(f => ctx.datos.registros[f] = [idA]);
ok('mejorRacha cruza el cambio de mes', ctx.mejorRacha(idA) === 4);

// --- estadísticas: porcentajes
ctx.datos.registros = {};
ctx.datos.habitos[0].creado = ctx.haceNDias(9);   // hábito de 10 días de vida
ok('diasDeVida cuenta hoy incluido', ctx.diasDeVida(idA) === 10);

// marcado 5 de esos 10 días
for (let i = 0; i < 5; i++) ctx.datos.registros[ctx.haceNDias(i)] = [idA];
ok('porcentaje sobre 30 se mide desde que existe (5 de 10 = 50%)',
   ctx.porcentajeUltimos(idA, 30) === 50);
ok('porcentaje sobre una ventana corta (5 de 5 = 100%)',
   ctx.porcentajeUltimos(idA, 5) === 100);

// si marca días anteriores a la creación, el inicio se corre hacia atrás
ctx.datos.registros['2020-01-01'] = [idA];
ok('fechaInicio toma la fecha más antigua de las dos',
   ctx.fechaInicio(idA) === '2020-01-01');
ok('el porcentaje nunca se pasa de 100', ctx.porcentajeUltimos(idA, 30) <= 100);

// un hábito de una copia vieja, sin campo "creado"
ctx.datos.registros = {};
ctx.datos.habitos = [{ id:'viejo', nombre:'Sin fecha', emoji:'❓' }];
ctx.datos.registros['2026-07-01'] = ['viejo'];
ok('sin campo creado usa su primer día marcado',
   ctx.fechaInicio('viejo') === '2026-07-01');

// --- renombrar
ctx.datos.habitos = [];
ctx.datos.registros = {};
ctx.agregarHabito('Leerr','📖');
const idR = ctx.datos.habitos[0].id;
ctx.datos.registros['2026-07-15'] = [idR];

ok('renombrar cambia el nombre',
   ctx.renombrarHabito(idR, 'Leer') === true && ctx.datos.habitos[0].nombre === 'Leer');
ok('el historial sobrevive al cambio de nombre', ctx.estaHecho(idR, '2026-07-15') === true);
ok('el id no cambia', ctx.datos.habitos[0].id === idR);
ok('renombrar quita espacios sobrantes',
   ctx.renombrarHabito(idR, '  Leer 20 min  ') === true &&
   ctx.datos.habitos[0].nombre === 'Leer 20 min');
ok('no acepta nombre vacío',       ctx.renombrarHabito(idR, '') === false);
ok('no acepta solo espacios',      ctx.renombrarHabito(idR, '    ') === false);
ok('no acepta null (Cancelar)',    ctx.renombrarHabito(idR, null) === false);
ok('el nombre quedó intacto tras los rechazos', ctx.datos.habitos[0].nombre === 'Leer 20 min');
ok('el mismo nombre no cuenta como cambio', ctx.renombrarHabito(idR, 'Leer 20 min') === false);
ok('recorta a 40 caracteres',
   ctx.renombrarHabito(idR, 'x'.repeat(60)) === true &&
   ctx.datos.habitos[0].nombre.length === 40);
ok('renombrar un id inexistente no rompe', ctx.renombrarHabito('no-existe','Hola') === false);
ok('el nombre nuevo se guardó en disco', ctx.cargar().habitos[0].nombre.length === 40);

// --- reordenar
ctx.datos.habitos = [];
ctx.datos.registros = {};
ctx.agregarHabito('A','1️⃣');
ctx.agregarHabito('B','2️⃣');
ctx.agregarHabito('C','3️⃣');
const nombres = () => ctx.datos.habitos.map(h => h.nombre).join('');
const idPrimero = ctx.datos.habitos[0].id;
const idMedio   = ctx.datos.habitos[1].id;
const idUltimo  = ctx.datos.habitos[2].id;

ok('el orden inicial es el de creación', nombres() === 'ABC');
ok('bajar el primero',  ctx.moverHabito(idPrimero, 1) === true && nombres() === 'BAC');
ok('subir el del medio', ctx.moverHabito(idPrimero, -1) === true && nombres() === 'ABC');
ok('el primero no puede subir más', ctx.moverHabito(idPrimero, -1) === false);
ok('el último no puede bajar más',  ctx.moverHabito(idUltimo, 1) === false);
ok('un intento inválido no altera el orden', nombres() === 'ABC');
ok('mover un id inexistente no rompe', ctx.moverHabito('no-existe', 1) === false);
ok('mover no pierde hábitos', ctx.datos.habitos.length === 3);
ctx.moverHabito(idMedio, 1);
ok('el nuevo orden se guardó en disco', ctx.cargar().habitos.map(h=>h.nombre).join('') === 'ACB');

// --- copia de seguridad
ctx.datos.habitos = [];
ctx.datos.registros = {};
ok('el nombre del archivo lleva la fecha', ctx.nombreArchivo() === `habitos-${ctx.hoy()}.json`);

const copiaBuena = { version:1, habitos:[{id:'x1',nombre:'Correr',emoji:'🏃'}], registros:{'2026-07-30':['x1']} };
ok('acepta una copia bien formada', ctx.esCopiaValida(copiaBuena) === true);
ok('rechaza null',                  ctx.esCopiaValida(null) === false);
ok('rechaza un objeto vacío',       ctx.esCopiaValida({}) === false);
ok('rechaza habitos que no es lista', ctx.esCopiaValida({habitos:'x', registros:{}}) === false);
ok('rechaza registros que es lista',  ctx.esCopiaValida({habitos:[], registros:[]}) === false);
ok('rechaza un hábito sin nombre',    ctx.esCopiaValida({habitos:[{id:'a'}], registros:{}}) === false);
ok('rechaza un día que no es lista',  ctx.esCopiaValida({habitos:[], registros:{'2026-07-30':'x1'}}) === false);

ok('no importa texto que no es JSON', ctx.importar('esto no es json {{{') === false);
ok('avisa cuando el archivo no se puede leer', /no se puede leer/.test(ultimaAlerta));
ok('no importa un JSON con forma incorrecta', ctx.importar('{"cualquier":"cosa"}') === false);

ok('importa una copia válida', ctx.importar(JSON.stringify(copiaBuena)) === true);
ok('los datos quedaron reemplazados', ctx.datos.habitos.length === 1 && ctx.datos.habitos[0].nombre === 'Correr');
ok('el historial importado se lee bien', ctx.estaHecho('x1','2026-07-30') === true);
ok('la copia importada también se guardó', ctx.cargar().habitos[0].nombre === 'Correr');

// v28: restaurar va en dos pasos y entre los dos la pantalla pregunta.
// Revisar NO debe tocar nada: si respondes "no", tus datos siguen ahí.
const revisada = ctx.revisarCopia(JSON.stringify({version:1, habitos:[], registros:{}}));
ok('revisar una copia no cambia tus datos', ctx.datos.habitos.length === 1);
ok('y trae el resumen para la pregunta, con los números puestos',
   revisada && revisada.resumen.includes('0 hábito(s)') && !revisada.resumen.includes('%h'));
ok('una copia ilegible no llega a la pregunta', ctx.revisarCopia('{{{') === null);

// exportar -> importar debe devolver exactamente lo mismo (ida y vuelta)
const antes = JSON.stringify(ctx.datos);
ctx.importar(antes);
ok('exportar e importar no altera los datos', JSON.stringify(ctx.datos) === antes);

// ============================================================
//  EL FORMATO DE LA NOTA DE UNA IDEA (v28)
// ============================================================
const h = ctx.notaAHtml;
ok('una nota sin símbolos sale como un párrafo', h('Hola') === '<p>Hola</p>');
ok('dos líneas seguidas van en el mismo párrafo', h('uno\ndos') === '<p>uno<br>dos</p>');
ok('una línea vacía separa párrafos', h('uno\n\ndos') === '<p>uno</p><p>dos</p>');
ok('**negrita**', h('es **clave**') === '<p>es <strong>clave</strong></p>');
ok('*cursiva*', h('algo *suave*') === '<p>algo <em>suave</em></p>');
ok('# título', h('# Plan') === '<h3>Plan</h3>');
ok('- viñetas en una lista', h('- a\n- b') === '<ul><li>a</li><li>b</li></ul>');
ok('- [ ] casilla con su número de línea',
   h('Pasos\n- [ ] uno\n- [x] dos') ===
   '<p>Pasos</p><ul><li class="casilla" data-linea="1">uno</li><li class="casilla marcada" data-linea="2">dos</li></ul>');
ok('un enlace se vuelve tocable', h('ver https://uiverse.io/elements.').includes(
   '<a href="https://uiverse.io/elements" target="_blank" rel="noopener">https://uiverse.io/elements</a>.'));
ok('el HTML escrito en la nota NO se ejecuta: se muestra como texto',
   h('<img src=x onerror=alert(1)>') === '<p>&lt;img src=x onerror=alert(1)&gt;</p>');
ok('ni siquiera dentro de una negrita', !h('**<b>x</b>**').includes('<b>'));
ok('una nota vacía no dibuja nada', h('') === '' && h(undefined) === '');

ok('tocar una casilla la marca', ctx.alternarCasilla('a\n- [ ] b', 1) === 'a\n- [x] b');
ok('y tocarla otra vez la desmarca', ctx.alternarCasilla('- [x] b', 0) === '- [ ] b');
ok('una línea que no es casilla no cambia', ctx.alternarCasilla('- b', 0) === '- b');
ok('una línea que no existe tampoco', ctx.alternarCasilla('a', 7) === 'a');

// Las marcadas bajan al fondo de SU grupo (v33)
const oc = ctx.ordenarCasillas;
ok('una casilla marcada baja al final de su lista',
   oc('- [x] a\n- [ ] b\n- [ ] c') === '- [ ] b\n- [ ] c\n- [x] a');
ok('dentro de cada mitad se respeta el orden en que las escribiste',
   oc('- [x] a\n- [ ] b\n- [x] c\n- [ ] d') === '- [ ] b\n- [ ] d\n- [x] a\n- [x] c');
ok('una desmarcada vuelve arriba, justo después de las que faltan',
   oc('- [ ] b\n- [ ] a\n- [x] c') === '- [ ] b\n- [ ] a\n- [x] c');
ok('no cruza un título: cada lista se ordena por su lado',
   oc('# Mercado\n- [x] pan\n- [ ] leche\n# Ferretería\n- [x] clavos\n- [ ] tornillos') ===
   '# Mercado\n- [ ] leche\n- [x] pan\n# Ferretería\n- [ ] tornillos\n- [x] clavos');
ok('un párrafo en medio (con línea vacía) también corta el grupo',
   oc('- [x] a\n\nnota suelta\n- [ ] b') === '- [x] a\n\nnota suelta\n- [ ] b');
ok('las viñetas y el texto normal no se mueven',
   oc('hola\n- uno\n- dos') === 'hola\n- uno\n- dos');
ok('una nota vacía sigue vacía', oc('') === '' && oc(undefined) === '');
ok('lo de la captura: el marcado baja, y "Jueves" viaja con su casilla',
   oc('- [x] Enviar fotos de cheques\n- [ ] Pendiente enviar foto del cheque del\nJueves') ===
   '- [ ] Pendiente enviar foto del cheque del\nJueves\n- [x] Enviar fotos de cheques');
ok('una línea pegada debajo de una casilla es parte de ese renglón',
   h('- [ ] foto del cheque del\nJueves') ===
   '<ul><li class="casilla" data-linea="0">foto del cheque del<br>Jueves</li></ul>');
ok('lo mismo con una viñeta', h('- a\nsigue') === '<ul><li>a<br>sigue</li></ul>');
ok('con una línea vacía en medio ya es un párrafo aparte',
   h('- a\n\nsigue') === '<ul><li>a</li></ul><p>sigue</p>');

ok('el adelanto de la lista quita los símbolos',
   ctx.notaEnTexto('# Plan\n**ya**\n- [ ] uno\n- [x] dos\n- tres') === 'Plan  ya  ☐ uno  ☑ dos  • tres');

const f = ctx.aplicarFormatoTexto;
ok('B sin elegir nada deja el cursor entre los asteriscos',
   JSON.stringify(f('ab', 1, 1, 'negrita')) === JSON.stringify({ valor: 'a****b', cursor: 3 }));
ok('B con algo elegido lo envuelve',
   f('hola mundo', 5, 10, 'negrita').valor === 'hola **mundo**');
ok('• pone la viñeta al principio de la línea, no donde está el cursor',
   f('uno\ndos', 6, 6, 'vineta').valor === 'uno\n- dos');
ok('☐ pone una casilla', f('comprar', 3, 3, 'casilla').valor === '- [ ] comprar');

// --- mensajes de error de la nube
ok('sin error, mensaje vacío', ctx.mensajeDeError(null) === '');
ok('traduce credenciales inválidas',
   ctx.mensajeDeError({ message: 'Invalid login credentials' }) === 'Correo o contraseña incorrectos.');
ok('la traducción no depende de mayúsculas',
   ctx.mensajeDeError({ message: 'INVALID LOGIN CREDENTIALS' }) === 'Correo o contraseña incorrectos.');
ok('traduce correo sin confirmar',
   /sin confirmar/.test(ctx.mensajeDeError({ message: 'Email not confirmed' })));
ok('traduce fallo de red',
   /Sin conexión/.test(ctx.mensajeDeError({ message: 'Failed to fetch' })));
ok('traduce demasiados intentos',
   /Espera/.test(ctx.mensajeDeError({ message: 'Email rate limit exceeded' })));
ok('un error desconocido se muestra tal cual',
   ctx.mensajeDeError({ message: 'Algo raro' }) === 'No se pudo entrar: Algo raro');
ok('un error sin texto no rompe',
   ctx.mensajeDeError({}) === 'No se pudo entrar: error desconocido');

// --- traducir entre la app y la base de datos
ok('habitoAFila pone la posición como columna orden',
   ctx.habitoAFila({id:'a1',nombre:'Leer',emoji:'📖',creado:'2026-01-02'}, 3, 'u1').orden === 3);
ok('habitoAFila arrastra el usuario',
   ctx.habitoAFila({id:'a1',nombre:'Leer',emoji:'📖',creado:'2026-01-02'}, 0, 'u1').usuario === 'u1');
ok('habitoAFila inventa creado si falta',
   ctx.habitoAFila({id:'a1',nombre:'Leer',emoji:'📖'}, 0, 'u1').creado === ctx.hoy());

const filasH = [
  { id:'a1', usuario:'u1', nombre:'Leer', emoji:'📖', creado:'2026-01-02', orden:0, actualizado:'x' },
  { id:'a2', usuario:'u1', nombre:'Agua', emoji:'💧', creado:'2026-01-03', orden:1, actualizado:'x' }
];
ok('filasAHabitos respeta el orden recibido',
   ctx.filasAHabitos(filasH).map(h=>h.nombre).join('') === 'LeerAgua');
ok('filasAHabitos descarta las columnas que la app no usa',
   Object.keys(ctx.filasAHabitos(filasH)[0]).join(',') === 'id,nombre,emoji,creado');
ok('filasAHabitos con lista vacía', ctx.filasAHabitos([]).length === 0);
ok('filasAHabitos sin argumento no rompe', ctx.filasAHabitos().length === 0);

const filasR = [
  { habito_id:'a1', fecha:'2026-03-01' },
  { habito_id:'a2', fecha:'2026-03-01' },
  { habito_id:'a1', fecha:'2026-03-02' }
];
const agrupado = ctx.filasARegistros(filasR);
ok('filasARegistros agrupa por fecha', Object.keys(agrupado).length === 2);
ok('un día con dos hábitos', agrupado['2026-03-01'].length === 2);
ok('un día con uno solo',    agrupado['2026-03-02'].length === 1);
ok('filasARegistros no duplica si la fila viene repetida',
   ctx.filasARegistros([...filasR, {habito_id:'a1',fecha:'2026-03-01'}])['2026-03-01'].length === 2);
ok('filasARegistros sin argumento no rompe',
   Object.keys(ctx.filasARegistros()).length === 0);

// ida y vuelta: app -> base -> app
const idaVuelta = ctx.filasAHabitos(
  [{id:'z9',nombre:'Correr',emoji:'🏃',creado:'2026-02-02'}]
    .map((h,i) => ctx.habitoAFila(h, i, 'u1')));
ok('un hábito sobrevive el viaje de ida y vuelta',
   idaVuelta[0].id === 'z9' && idaVuelta[0].nombre === 'Correr' &&
   idaVuelta[0].emoji === '🏃' && idaVuelta[0].creado === '2026-02-02');

ok('textoPendientes en cero',  ctx.textoPendientes(0) === 'Todo sincronizado.');
// Ojo: estos textos cambiaron en la v17. Decían "esperando señal" siempre, y
// eso hacía que un rechazo de la nube pareciera un problema de internet.
ok('textoPendientes en uno',   ctx.textoPendientes(1) === '1 cambio sin subir.');
ok('textoPendientes en varios', ctx.textoPendientes(5) === '5 cambios sin subir.');

// --- la importancia de un pendiente (v18)
ok('el ciclo empieza en alta', ctx.siguientePrioridad(undefined) === 'alta');
ok('de alta pasa a media',     ctx.siguientePrioridad('alta')  === 'media');
ok('de media pasa a baja',     ctx.siguientePrioridad('media') === 'baja');
// Y da la vuelta entera: de baja se vuelve a "sin marcar", que es no tener
// campo. Si el ciclo se atascara en 'baja' no habría forma de quitarle la
// importancia a algo sin borrarlo y volverlo a escribir.
ok('de baja vuelve a sin marcar', ctx.siguientePrioridad('baja') === undefined);
ok('un valor raro no rompe el ciclo', ctx.siguientePrioridad('urgentísimo') === 'alta');

ok('alta pesa menos que media', ctx.pesoPrioridad('alta') < ctx.pesoPrioridad('media'));
ok('media pesa menos que baja', ctx.pesoPrioridad('media') < ctx.pesoPrioridad('baja'));
ok('sin marcar pesa más que todas',
   ctx.pesoPrioridad(undefined) > ctx.pesoPrioridad('baja'));

// El ciclo completo sobre una tarea de verdad
ctx.datos.tareas = [];
ctx.datos.pendientes = [];
ctx.agregarTarea('Llamar al banco', 'pendientes');
const idBanco = ctx.datos.tareas[0].id;
ok('un pendiente nace sin importancia',
   ('prioridad' in ctx.datos.tareas[0]) === false);

ctx.cambiarPrioridad(idBanco);
ok('un toque lo pone en alta', ctx.datos.tareas[0].prioridad === 'alta');
ctx.cambiarPrioridad(idBanco);
ctx.cambiarPrioridad(idBanco);
ok('tres toques lo dejan en baja', ctx.datos.tareas[0].prioridad === 'baja');
ctx.cambiarPrioridad(idBanco);
// Lo importante no es que valga undefined: es que el campo NO EXISTE. Un
// 'prioridad: undefined' colado en los datos se guardaría en la copia de
// seguridad y subiría a la nube como un estado que no significa nada.
ok('el cuarto toque borra el campo entero',
   ('prioridad' in ctx.datos.tareas[0]) === false);

// Las ideas no llevan importancia: no son deudas.
ctx.agregarTarea('Aprender a hacer pan', 'ideas');
const idPan = ctx.datos.tareas[1].id;
ok('una idea no acepta importancia', ctx.cambiarPrioridad(idPan) === false);
ok('y sigue sin el campo', ('prioridad' in ctx.datos.tareas[1]) === false);

// Ni una tarea ya hecha.
ctx.alternarTarea(idBanco);
ok('una tarea hecha tampoco', ctx.cambiarPrioridad(idBanco) === false);
ctx.alternarTarea(idBanco);

// --- el orden automático de Pendientes
ctx.datos.tareas = [];
ctx.datos.pendientes = [];
['Uno','Dos','Tres','Cuatro'].forEach(x => ctx.agregarTarea(x, 'pendientes'));
const porTexto = t => ctx.datos.tareas.find(x => x.texto === t).id;

ctx.cambiarPrioridad(porTexto('Tres'));                      // Tres -> alta
ctx.cambiarPrioridad(porTexto('Uno'));
ctx.cambiarPrioridad(porTexto('Uno'));                       // Uno  -> media
const orden1 = ctx.tareasOrdenadas('pendientes').map(x => x.texto).join(',');
ok('la importancia manda sobre el orden de llegada', orden1 === 'Tres,Uno,Dos,Cuatro');

// Dos con la misma importancia respetan quién llegó antes. Esto depende de que
// el sort de JavaScript sea estable; si algún día dejara de serlo, este test
// es el que se pondría rojo.
ctx.cambiarPrioridad(porTexto('Cuatro'));                    // Cuatro -> alta
const orden2 = ctx.tareasOrdenadas('pendientes').map(x => x.texto).join(',');
ok('a igual importancia manda la antigüedad', orden2 === 'Tres,Cuatro,Uno,Dos');

// Y las hechas siguen yéndose al final, pase lo que pase con la importancia.
ctx.alternarTarea(porTexto('Tres'));
const orden3 = ctx.tareasOrdenadas('pendientes').map(x => x.texto).join(',');
ok('lo hecho va al final aunque sea lo más importante',
   orden3 === 'Cuatro,Uno,Dos,Tres');

// Las ideas conservan SU orden, el que pusiste a mano con las flechas.
ctx.datos.tareas = [];
['Idea A','Idea B','Idea C'].forEach(x => ctx.agregarTarea(x, 'ideas'));
ok('las ideas mantienen el orden en que las escribiste',
   ctx.tareasOrdenadas('ideas').map(x => x.texto).join(',') === 'Idea A,Idea B,Idea C');
ctx.moverTarea(ctx.datos.tareas[2].id, -1);
ok('y siguen obedeciendo a las flechas',
   ctx.tareasOrdenadas('ideas').map(x => x.texto).join(',') === 'Idea A,Idea C,Idea B');

// --- la importancia en el viaje a la nube y de vuelta
const filaPrio = ctx.tareaAFila(
  { id:'t1', texto:'Pagar', hecha:false, lista:'pendientes', creada:'2026-08-18', prioridad:'alta' },
  0, 'u1');
ok('la importancia sube en su columna', filaPrio.prioridad === 'alta');
ok('sin marcar sube como null',
   ctx.tareaAFila({ id:'t2', texto:'X', lista:'pendientes' }, 1, 'u1').prioridad === null);
const vuelta = ctx.filasATareas([filaPrio, { id:'t2', texto:'X', lista:'pendientes', prioridad:null }]);
ok('la importancia vuelve entera de la nube', vuelta[0].prioridad === 'alta');
ok('y la que no tenía sigue sin el campo', ('prioridad' in vuelta[1]) === false);

// --- la regla de oro, ahora comprobable (v18)
// Bajar de la nube reemplaza lo local. Solo se puede hacer si la cola sigue
// vacía; si dejó de estarlo mientras la foto viajaba, esa foto es más vieja
// que lo que tienes en pantalla y aplicarla borraría tu último toque.
ok('con la cola vacía sí se aplica lo bajado',
   ctx.sePuedeAplicarLoBajado([]) === true);
ok('con un cambio sin subir NO se aplica',
   ctx.sePuedeAplicarLoBajado([{tipo:'marcar', id:'x', fecha:'2026-08-18'}]) === false);
ok('con varios cambios tampoco',
   ctx.sePuedeAplicarLoBajado([{tipo:'marcar'},{tipo:'desmarcar'}]) === false);
// Si la cola todavía no existe (arranque en frío) no hay nada que proteger.
ok('una cola que aún no existe no bloquea',
   ctx.sePuedeAplicarLoBajado(undefined) === true);

// --- la cola de pendientes
ctx.datos.habitos = [];
ctx.datos.registros = {};
ctx.datos.pendientes = [];

ctx.agregarHabito('Nadar','🏊');
const idN = ctx.datos.habitos[0].id;
ok('crear un hábito encola su subida',
   ctx.datos.pendientes.length === 1 && ctx.datos.pendientes[0].tipo === 'guardarHabito');

ctx.alternarFecha(idN, '2026-05-05');
ok('marcar encola "marcar"', ctx.datos.pendientes[1].tipo === 'marcar');
ok('el pendiente lleva la fecha', ctx.datos.pendientes[1].fecha === '2026-05-05');

ctx.alternarFecha(idN, '2026-05-05');
ok('desmarcar encola "desmarcar"', ctx.datos.pendientes[2].tipo === 'desmarcar');

ctx.renombrarHabito(idN, 'Nadar 30 min');
ok('renombrar encola una subida del hábito',
   ctx.datos.pendientes[3].tipo === 'guardarHabito' && ctx.datos.pendientes[3].id === idN);

ctx.alternarFecha(idN, ctx.haceNDias(-5));
ok('marcar el futuro no encola nada', ctx.datos.pendientes.length === 4);

ctx.borrarHabito(idN);
ok('borrar encola "borrarHabito"', ctx.datos.pendientes[4].tipo === 'borrarHabito');

ok('la cola sobrevive al guardado', ctx.cargar().pendientes.length === 5);

ctx.datos.habitos = [];
ctx.datos.registros = {};
ctx.datos.pendientes = [];
ctx.agregarHabito('A','1️⃣');
ctx.agregarHabito('B','2️⃣');
ctx.datos.pendientes = [];
ctx.moverHabito(ctx.datos.habitos[0].id, 1);
ok('reordenar encola los dos hábitos que se movieron',
   ctx.datos.pendientes.length === 2 &&
   ctx.datos.pendientes.every(p => p.tipo === 'guardarHabito'));

// una copia vieja, sin el campo pendientes, no debe romper nada
global.localStorage.setItem('habitos-app-v1',
  JSON.stringify({ version:1, habitos:[], registros:{} }));
ok('los datos viejos reciben una cola vacía', Array.isArray(ctx.cargar().pendientes));

// --- emojis
ok('un emoji simple pasa',            ctx.primerEmoji('😀') === '😀');
ok('quita los espacios de alrededor', ctx.primerEmoji('  🏃  ') === '🏃');
ok('si escribes varios, toma el primero', ctx.primerEmoji('🏃💧📖') === '🏃');
ok('un emoji con tono de piel no se parte', ctx.primerEmoji('👍🏽') === '👍🏽');
ok('una familia entera cuenta como uno',  ctx.primerEmoji('👨‍👩‍👧') === '👨‍👩‍👧');
ok('una bandera no se parte en dos',      ctx.primerEmoji('🇨🇴') === '🇨🇴');
ok('el emoji de teclado numérico pasa',   ctx.primerEmoji('1️⃣') === '1️⃣');
ok('una letra no es emoji',   ctx.primerEmoji('a') === '');
ok('un número no es emoji',   ctx.primerEmoji('7') === '');
ok('una palabra no es emoji', ctx.primerEmoji('correr') === '');
ok('texto vacío devuelve vacío', ctx.primerEmoji('') === '');
ok('solo espacios devuelve vacío', ctx.primerEmoji('   ') === '');
ok('null no rompe',      ctx.primerEmoji(null) === '');
ok('sin argumento no rompe', ctx.primerEmoji() === '');
ok('emoji después de letras no cuela', ctx.primerEmoji('x😀') === '');

// --- cambiar el emoji de un hábito
ctx.datos.habitos = [];
ctx.datos.registros = {};
ctx.datos.pendientes = [];
ctx.agregarHabito('Correr','🏃');
const idE = ctx.datos.habitos[0].id;
ctx.datos.registros['2026-06-01'] = [idE];
ctx.datos.pendientes = [];

ok('cambiar el emoji funciona',
   ctx.cambiarEmoji(idE, '🚴') === true && ctx.datos.habitos[0].emoji === '🚴');
ok('el historial sobrevive al cambio de emoji', ctx.estaHecho(idE, '2026-06-01') === true);
ok('cambiar el emoji encola su subida',
   ctx.datos.pendientes.length === 1 && ctx.datos.pendientes[0].tipo === 'guardarHabito');
ok('acepta un emoji con texto alrededor y se queda con el emoji',
   ctx.cambiarEmoji(idE, '  🧘  ') === true && ctx.datos.habitos[0].emoji === '🧘');
ok('rechaza texto que no es emoji', ctx.cambiarEmoji(idE, 'bici') === false);
ok('el emoji quedó intacto tras el rechazo', ctx.datos.habitos[0].emoji === '🧘');
ok('el mismo emoji no cuenta como cambio', ctx.cambiarEmoji(idE, '🧘') === false);
ok('un id inexistente no rompe', ctx.cambiarEmoji('no-existe', '🎸') === false);
ok('el emoji nuevo se guardó en disco', ctx.cargar().habitos[0].emoji === '🧘');


// ============================================================
// PENDIENTES E IDEAS (las dos listas de texto) — sección D2
// ============================================================

const P = 'pendientes', I = 'ideas';
ctx.datos.tareas = [];

// --- crear
ok('agregar un pendiente funciona', ctx.agregarTarea('Llamar al banco', P) === true);
ok('quedó una tarea', ctx.datos.tareas.length === 1);
ok('el texto se guardó bien', ctx.datos.tareas[0].texto === 'Llamar al banco');
ok('nace sin marcar', ctx.datos.tareas[0].hecha === false);
ok('guarda el día en que la escribiste', ctx.datos.tareas[0].creada === ctx.hoy());
ok('guarda a qué lista pertenece', ctx.datos.tareas[0].lista === P);
ok('sin decir la lista, cae en pendientes',
   ctx.agregarTarea('Sin lista') && ctx.datos.tareas[1].lista === P);
ok('una lista inventada cae en pendientes',
   ctx.agregarTarea('Rara', 'inventada') && ctx.datos.tareas[2].lista === P);
ok('quita los espacios de alrededor',
   ctx.agregarTarea('   Pagar arriendo   ', P) && ctx.datos.tareas[3].texto === 'Pagar arriendo');
ok('una tarea vacía no entra', ctx.agregarTarea('', P) === false);
ok('solo espacios tampoco entra', ctx.agregarTarea('     ', P) === false);
ok('null no rompe', ctx.agregarTarea(null, P) === false);
ok('sin argumento no rompe', ctx.agregarTarea() === false);
ok('siguen siendo 4 tareas', ctx.datos.tareas.length === 4);
ok('los ids son distintos', ctx.datos.tareas[0].id !== ctx.datos.tareas[1].id);
ok('el texto se corta a 120 caracteres',
   ctx.agregarTarea('x'.repeat(200), P) && ctx.datos.tareas[4].texto.length === 120);

// --- las dos listas no se mezclan
ctx.datos.tareas = [];
ctx.agregarTarea('Pendiente 1', P);
ctx.agregarTarea('Pendiente 2', P);
ctx.agregarTarea('Idea 1', I);
ok('tareasDe separa las listas', ctx.tareasDe(P).length === 2 && ctx.tareasDe(I).length === 1);
ok('la idea guardó su lista', ctx.tareasDe(I)[0].lista === I);
ok('una lista que no existe devuelve vacío', ctx.tareasDe('nada').length === 0);

// --- marcar y desmarcar
const idT = ctx.tareasDe(P)[0].id;
ok('marcar funciona', ctx.alternarTarea(idT) === true && ctx.tareasDe(P)[0].hecha === true);
ok('desmarcar funciona', ctx.alternarTarea(idT) === true && ctx.tareasDe(P)[0].hecha === false);
ok('un id que no existe devuelve false', ctx.alternarTarea('no-existe') === false);
ok('marcar un pendiente no toca las ideas', ctx.tareasDe(I)[0].hecha === false);

// --- el contador de cada lista es independiente (lo que pidió Kev)
ctx.datos.tareas = [];
ctx.agregarTarea('A', P); ctx.agregarTarea('B', P);
ctx.agregarTarea('Idea A', I); ctx.agregarTarea('Idea B', I); ctx.agregarTarea('Idea C', I);
ok('cuenta solo los pendientes', ctx.contarTareas(P).total === 2);
ok('cuenta solo las ideas', ctx.contarTareas(I).total === 3);
ok('las ideas NO suman al contador de pendientes', ctx.contarTareas(P).faltan === 2);
ctx.alternarTarea(ctx.tareasDe(I)[0].id);
ok('marcar una idea no cambia el contador de pendientes', ctx.contarTareas(P).faltan === 2);
ok('pero sí el suyo', ctx.contarTareas(I).hechas === 1 && ctx.contarTareas(I).faltan === 2);
ok('una lista vacía cuenta cero', ctx.contarTareas('nada').total === 0);

// --- el orden: primero lo que falta, al final lo hecho
ctx.datos.tareas = [];
ctx.agregarTarea('A', P); ctx.agregarTarea('B', P); ctx.agregarTarea('C', P);
ctx.agregarTarea('Idea', I);
ctx.alternarTarea(ctx.tareasDe(P)[0].id);   // marcamos la A

const orden = ctx.tareasOrdenadas(P).map(t => t.texto);
ok('la hecha se va al final', orden.join('') === 'BCA');
ok('las que faltan conservan su orden original', orden[0] === 'B' && orden[1] === 'C');
ok('ordenar una lista no incluye la otra', orden.includes('Idea') === false);
ok('ordenar no cambia el array original',
   ctx.datos.tareas.slice(0,3).map(t => t.texto).join('') === 'ABC');

ctx.alternarTarea(ctx.tareasDe(P)[1].id);   // marcamos también la B
ok('dos hechas van al final en su orden',
   ctx.tareasOrdenadas(P).map(t => t.texto).join('') === 'CAB');
ok('todas hechas no rompe el orden',
   (ctx.alternarTarea(ctx.tareasDe(P)[2].id),
    ctx.tareasOrdenadas(P).map(t => t.texto).join('') === 'ABC'));
ok('una lista sin nada devuelve lista vacía', ctx.tareasOrdenadas('nada').length === 0);

// --- mover entre listas (la razón de tener un solo array)
ctx.datos.tareas = [];
ctx.agregarTarea('Pendiente viejo', P);
ctx.agregarTarea('Se me ocurrió algo', I);
const idIdea = ctx.tareasDe(I)[0].id;

ok('mover una idea a pendientes funciona', ctx.moverALista(idIdea, P) === true);
ok('ya no está en ideas', ctx.tareasDe(I).length === 0);
ok('ahora está en pendientes', ctx.tareasDe(P).length === 2);
ok('conserva el texto al moverse',
   ctx.tareasDe(P).some(t => t.texto === 'Se me ocurrió algo'));
ok('conserva el mismo id (no se recreó)',
   ctx.datos.tareas.some(t => t.id === idIdea));
ok('moverla a la lista en la que ya está devuelve false',
   ctx.moverALista(idIdea, P) === false);
ok('una lista inventada no mueve nada', ctx.moverALista(idIdea, 'inventada') === false);
ok('un id inexistente no rompe', ctx.moverALista('no-existe', I) === false);

// una idea marcada como hecha que se manda a pendientes vuelve a estar por hacer
ctx.datos.tareas = [];
ctx.agregarTarea('Idea hecha', I);
const idIH = ctx.tareasDe(I)[0].id;
ctx.alternarTarea(idIH);
ok('la idea estaba marcada', ctx.tareasDe(I)[0].hecha === true);
ctx.moverALista(idIH, P);
ok('al pasar a pendientes vuelve a estar por hacer', ctx.tareasDe(P)[0].hecha === false);

// --- cambiar el texto
ctx.datos.tareas = [];
ctx.agregarTarea('Original', P);
const idTexto = ctx.tareasDe(P)[0].id;
ok('renombrar funciona',
   ctx.renombrarTarea(idTexto, 'Corregido') === true && ctx.tareasDe(P)[0].texto === 'Corregido');
ok('un texto vacío no cambia nada',
   ctx.renombrarTarea(idTexto, '   ') === false && ctx.tareasDe(P)[0].texto === 'Corregido');
ok('el mismo texto no cuenta como cambio', ctx.renombrarTarea(idTexto, 'Corregido') === false);
ok('renombrar un id inexistente no rompe', ctx.renombrarTarea('no-existe', 'algo') === false);
ok('renombrar no cambia de lista', ctx.tareasDe(P)[0].lista === P);

// --- la nota de contexto de una idea
ctx.datos.tareas = [];
ctx.agregarTarea('App de propinas', I);
const idNota = ctx.tareasDe(I)[0].id;

ok('una idea nace sin nota', ctx.tareasDe(I)[0].nota === undefined);
ok('escribir la nota funciona',
   ctx.editarTarea(idNota, undefined, 'Calcular el split del turno') === true &&
   ctx.tareasDe(I)[0].nota === 'Calcular el split del turno');
ok('la nota no cambió el título', ctx.tareasDe(I)[0].texto === 'App de propinas');
ok('cambiar solo el título deja la nota intacta',
   ctx.editarTarea(idNota, 'App de propinas v2') === true &&
   ctx.tareasDe(I)[0].nota === 'Calcular el split del turno');
ok('cambiar los dos a la vez funciona',
   ctx.editarTarea(idNota, 'Propinas', 'Otra nota') === true &&
   ctx.tareasDe(I)[0].texto === 'Propinas' && ctx.tareasDe(I)[0].nota === 'Otra nota');
ok('guardar lo mismo no cuenta como cambio',
   ctx.editarTarea(idNota, 'Propinas', 'Otra nota') === false);
ok('la nota se recorta a 2000 caracteres (v28; eran 500)',
   ctx.LARGO_NOTA === 2000 &&
   ctx.editarTarea(idNota, undefined, 'y'.repeat(2500)) && ctx.tareasDe(I)[0].nota.length === 2000);
ok('la nota quita espacios de alrededor',
   ctx.editarTarea(idNota, undefined, '   con espacios   ') &&
   ctx.tareasDe(I)[0].nota === 'con espacios');
ok('vaciar la nota borra el campo, no lo deja vacío',
   ctx.editarTarea(idNota, undefined, '') === true && !('nota' in ctx.tareasDe(I)[0]));
ok('un título vacío no se acepta ni con nota',
   ctx.editarTarea(idNota, '   ', 'algo') === false);
ok('el título sobrevivió al intento', ctx.tareasDe(I)[0].texto === 'Propinas');
ok('editar un id inexistente no rompe', ctx.editarTarea('no-existe', 'x', 'y') === false);
ok('la nota sobrevive al guardado en disco',
   (ctx.editarTarea(idNota, undefined, 'para el disco'),
    ctx.cargar().tareas[0].nota === 'para el disco'));
ok('la nota sobrevive a mover la idea a pendientes',
   (ctx.moverALista(idNota, P), ctx.tareasDe(P)[0].nota === 'para el disco'));
ok('renombrarTarea sigue funcionando y no borra la nota',
   ctx.renombrarTarea(idNota, 'Propinas final') === true &&
   ctx.tareasDe(P)[0].nota === 'para el disco');

// --- borrar
ctx.datos.tareas = [];
ctx.agregarTarea('A', P); ctx.agregarTarea('B', P); ctx.agregarTarea('Idea', I);
const idBorrar = ctx.tareasDe(P)[1].id;
ok('borrar funciona', ctx.borrarTarea(idBorrar) === true);
ok('queda 1 pendiente', ctx.tareasDe(P).length === 1);
ok('la idea sigue intacta', ctx.tareasDe(I).length === 1);
ok('borrar un id inexistente devuelve false', ctx.borrarTarea('no-existe') === false);

// --- limpiar las hechas, lista por lista
ctx.datos.tareas = [];
ctx.agregarTarea('A', P); ctx.agregarTarea('B', P); ctx.agregarTarea('C', P);
ctx.agregarTarea('Idea A', I); ctx.agregarTarea('Idea B', I);
ctx.alternarTarea(ctx.tareasDe(P)[0].id);
ctx.alternarTarea(ctx.tareasDe(P)[2].id);
ctx.alternarTarea(ctx.tareasDe(I)[0].id);

ok('limpiar devuelve cuántas se llevó', ctx.limpiarHechas(P) === 2);
ok('solo queda el pendiente que faltaba',
   ctx.tareasDe(P).length === 1 && ctx.tareasDe(P)[0].texto === 'B');
ok('limpiar pendientes NO tocó las ideas hechas', ctx.tareasDe(I).length === 2);
ok('limpiar la otra lista sí se lleva la suya', ctx.limpiarHechas(I) === 1);
ok('y deja la idea que faltaba', ctx.tareasDe(I).length === 1);
ok('limpiar sin hechas devuelve 0', ctx.limpiarHechas(P) === 0);
ok('y no borra las que faltan', ctx.tareasDe(P).length === 1);

// --- todo sobrevive al guardado
ok('se guardan las dos listas en disco', ctx.cargar().tareas.length === 2);
ok('y conservan su columna lista',
   ctx.cargar().tareas.filter(t => t.lista === I).length === 1);

// --- migración: tareas viejas sin la columna "lista"
store['habitos-app-v1'] = JSON.stringify({
  version: 1, habitos: [], registros: {}, pendientes: [],
  tareas: [{ id:'a', texto:'De antes de las Ideas', hecha:false, creada:'2026-08-05' }]
});
const migrado = ctx.cargar();
ok('a una tarea vieja se le pone lista = pendientes', migrado.tareas[0].lista === 'pendientes');
ok('y no pierde su texto', migrado.tareas[0].texto === 'De antes de las Ideas');

// --- desde la v16 los pendientes y las ideas SÍ se encolan para la nube.
// Este test decía justo lo contrario hasta la v15; se cambió al llevarlas a
// Supabase. Un test que afirma una decisión vieja es peor que no tenerlo:
// hace que un cambio correcto se vea como un fallo.
ctx.datos.tareas = [];
ctx.datos.pendientes = [];
ctx.agregarTarea('Sube a la nube', P);
ctx.agregarTarea('Una idea también', I);
ctx.alternarTarea(ctx.tareasDe(P)[0].id);
ctx.moverALista(ctx.tareasDe(I)[0].id, P);
ok('crear, marcar y mover encolan un cambio cada uno', ctx.datos.pendientes.length === 4);
ok('y todos son del tipo guardarTarea',
   ctx.datos.pendientes.every(p => p.tipo === 'guardarTarea'));

// Borrar encola el borrado Y vuelve a subir las que se corrieron de sitio.
ctx.datos.tareas = [];
ctx.datos.pendientes = [];
ctx.agregarTarea('primera', P);
ctx.agregarTarea('segunda', P);
ctx.agregarTarea('tercera', P);
ctx.datos.pendientes = [];
ctx.borrarTarea(ctx.tareasDe(P)[0].id);
ok('borrar encola el borrado', ctx.datos.pendientes[0].tipo === 'borrarTarea');
ok('y vuelve a subir las dos que se corrieron',
   ctx.datos.pendientes.filter(p => p.tipo === 'guardarTarea').length === 2);

// Borrar la ÚLTIMA no corre a nadie: solo el borrado.
ctx.datos.pendientes = [];
ctx.borrarTarea(ctx.tareasDe(P)[1].id);
ok('borrar la última no obliga a resubir nada', ctx.datos.pendientes.length === 1);

// --- los traductores entre la app y la tabla "tareas"
const filaIdea = ctx.tareaAFila(
  { id:'i1', texto:'App de propinas', nota:'para el trabajo', hecha:false,
    creada:'2026-08-01', lista:'ideas' }, 3, 'usuario-1');
ok('tareaAFila guarda la posición como columna orden', filaIdea.orden === 3);
ok('y de quién es la fila',                            filaIdea.usuario === 'usuario-1');
ok('la nota viaja tal cual',                           filaIdea.nota === 'para el trabajo');

const filaSinNota = ctx.tareaAFila(
  { id:'p1', texto:'Comprar café', hecha:true, creada:'2026-08-02', lista:'pendientes' },
  0, 'usuario-1');
ok('una tarea sin nota sube como null, no como cadena vacía', filaSinNota.nota === null);
ok('hecha sube como booleano de verdad', filaSinNota.hecha === true);

const devueltas = ctx.filasATareas([
  { id:'p1', texto:'Comprar café', nota:null, hecha:true,  creada:'2026-08-02', lista:'pendientes', orden:0 },
  { id:'i1', texto:'App de propinas', nota:'para el trabajo', hecha:false, creada:'2026-08-01', lista:'ideas', orden:1 }
]);
ok('vuelven las dos tareas',              devueltas.length === 2);
ok('la que no tenía nota no la inventa',  !('nota' in devueltas[0]));
ok('la que sí tenía nota la conserva',    devueltas[1].nota === 'para el trabajo');
ok('y cada una vuelve a su lista',        devueltas[1].lista === 'ideas');
ok('una lista rara cae a pendientes',
   ctx.filasATareas([{ id:'x', texto:'?', lista:'inventada' }])[0].lista === 'pendientes');

// --- v19: la tercera lista (compras) y la trampa del ternario binario.
// Antes de la v19 había cuatro sitios con `lista === ideas ? ideas :
// pendientes`. Con dos listas era inofensivo; con tres, una compra se
// convertía en pendiente al subir y al bajar de la nube, SIN avisar. Estos
// tests existen para que eso no pueda volver a pasar. Se comprobó que fallan
// si se vuelve a poner el ternario viejo.
const C = 'compras';
ok('esLista reconoce las tres listas',
   ctx.esLista('pendientes') && ctx.esLista('ideas') && ctx.esLista(C));
ok('esLista rechaza lo que no existe',
   !ctx.esLista('inventada') && !ctx.esLista('') && !ctx.esLista(undefined) && !ctx.esLista(null));
ok('LISTAS y esLista dicen lo mismo',
   Object.values(ctx.LISTAS).every(ctx.esLista));

ctx.datos.tareas = [];
ctx.agregarTarea('Leche', C);
ok('agregar una compra la deja en compras, no en pendientes',
   ctx.tareasDe(C).length === 1 && ctx.tareasDe(P).length === 0);
ok('una lista inventada sigue cayendo a pendientes',
   (ctx.agregarTarea('Rara', 'inventada'), ctx.tareasDe(P).length === 1));

const filaCompra = ctx.tareaAFila(
  { id:'c1', texto:'Leche', hecha:false, creada:'2026-09-15', lista:C }, 0, 'usuario-1');
ok('una compra SUBE como compra (ida)', filaCompra.lista === C);
ok('y VUELVE como compra (vuelta)',
   ctx.filasATareas([{ id:'c1', texto:'Leche', hecha:false, creada:'2026-09-15', lista:C, orden:0 }])[0].lista === C);

ok('mover a compras es válido', ctx.moverALista(ctx.tareasDe(P)[0].id, C) === true);
ok('y la tarea llega a compras', ctx.tareasDe(C).length === 2);
ok('las compras no se ordenan por importancia',
   (ctx.cambiarPrioridad(ctx.tareasDe(C)[0].id) === false));
ok('el contador de compras no mezcla listas',
   ctx.contarTareas(C).total === 2 && ctx.contarTareas(P).total === 0);
ctx.alternarTarea(ctx.tareasDe(C)[0].id);
ok('tareasOrdenadas(compras) manda la comprada al final',
   ctx.tareasOrdenadas(C).map(x => x.texto).join('') === 'RaraLeche');
ok('limpiar compras no toca las otras listas',
   (ctx.agregarTarea('Un pendiente', P), ctx.limpiarHechas(C), ctx.tareasDe(C).length === 1 && ctx.tareasDe(P).length === 1));

// --- copias de seguridad
ok('una copia con tareas es válida',
   ctx.esCopiaValida({ habitos: [], registros: {},
     tareas: [{ id:'1', texto:'algo', hecha:false, lista:'ideas' }] }) === true);
ok('una copia vieja SIN tareas sigue siendo válida',
   ctx.esCopiaValida({ habitos: [], registros: {} }) === true);
ok('una copia con tareas mal formadas se rechaza',
   ctx.esCopiaValida({ habitos: [], registros: {}, tareas: [{ id: 1 }] }) === false);
ok('tareas que no son lista se rechaza',
   ctx.esCopiaValida({ habitos: [], registros: {}, tareas: 'nop' }) === false);


// ============================================================================
// v15 — IDIOMAS Y AJUSTES
// ============================================================================

// --- las dos tablas de textos tienen que estar completas.
// Este es el test más valioso de todo el bloque: no comprueba una traducción
// concreta, comprueba que no falte NINGUNA. Sin él, el día que agregues una
// frase al español y se te olvide el inglés, la app sale mezclada y solo te
// enteras cuando la ves en el teléfono.
const clavesEs = Object.keys(ctx.TEXTOS.es).sort();
const clavesEn = Object.keys(ctx.TEXTOS.en).sort();
const faltanEnIngles = clavesEs.filter(c => !(c in ctx.TEXTOS.en));
const sobranEnIngles = clavesEn.filter(c => !(c in ctx.TEXTOS.es));
ok('no falta ninguna clave en inglés' +
   (faltanEnIngles.length ? ' -> faltan: ' + faltanEnIngles.join(', ') : ''),
   faltanEnIngles.length === 0);
ok('no sobra ninguna clave en inglés' +
   (sobranEnIngles.length ? ' -> sobran: ' + sobranEnIngles.join(', ') : ''),
   sobranEnIngles.length === 0);

// --- ningún texto puede quedar vacío: sería un botón sin palabra
const vacios = [];
['es','en'].forEach(idioma => {
  Object.entries(ctx.TEXTOS[idioma]).forEach(([clave, valor]) => {
    if (typeof valor === 'string' && valor.trim() === '') vacios.push(idioma + '.' + clave);
  });
});
ok('ningún texto está vacío' + (vacios.length ? ' -> ' + vacios.join(', ') : ''),
   vacios.length === 0);

// --- las letras de los días son siete en los dos idiomas
ok('el calendario tiene 7 letras en español', ctx.TEXTOS.es.letrasDias.length === 7);
ok('el calendario tiene 7 letras en inglés',  ctx.TEXTOS.en.letrasDias.length === 7);

// --- los huecos %h, %d y %n tienen que existir en las dos versiones, o al
// rellenarlos el número desaparecería en un idioma y no en el otro
ok('%n está en las dos versiones de "cambios esperando"',
   ctx.TEXTOS.es.cambiosEsperando.includes('%n') &&
   ctx.TEXTOS.en.cambiosEsperando.includes('%n'));
ok('%h y %d están en las dos versiones del aviso de importar',
   ['es','en'].every(l => ctx.TEXTOS[l].confirmImportar1.includes('%h') &&
                          ctx.TEXTOS[l].confirmImportar1.includes('%d')));

// --- t() responde al idioma activo
ctx.datos.prefs = { idioma: 'es', tema: 'auto', nombre: '' };
ok('t() en español',            ctx.t('guardar') === 'Guardar');
ok('textoPendientes en español', ctx.textoPendientes(0) === 'Todo sincronizado.');
ok('localeFechas en español',    ctx.localeFechas() === 'es-CO');

ctx.datos.prefs.idioma = 'en';
ok('t() en inglés',              ctx.t('guardar') === 'Save');
ok('textoPendientes en inglés',  ctx.textoPendientes(0) === 'Everything synced.');
ok('el plural rellena el número', ctx.textoPendientes(3) === '3 changes not uploaded.');
ok('localeFechas en inglés',     ctx.localeFechas() === 'en-US');
ok('mensajeDeError traduce al inglés',
   ctx.mensajeDeError({ message: 'Invalid login credentials' }) === 'Wrong email or password.');

// --- una clave que no existe no debe romper nada ni mostrar la clave cruda
ok('una clave inventada devuelve undefined, no la clave', ctx.t('noExiste') === undefined);

// --- un idioma desconocido cae al español en vez de dejar la app en blanco
ctx.datos.prefs.idioma = 'pt';
ok('un idioma que no tenemos cae al español', ctx.t('guardar') === 'Guardar');
ctx.datos.prefs.idioma = 'es';

// --- migración: los datos guardados antes de la v15 no traen prefs
store['habitos-app-v1'] = JSON.stringify({
  version: 1, habitos: [], registros: {}, tareas: [], pendientes: []
});
const sinPrefs = ctx.cargar();
ok('a los datos viejos se les ponen las prefs por defecto',
   sinPrefs.prefs.idioma === 'es' && sinPrefs.prefs.tema === 'auto' && sinPrefs.prefs.nombre === '');

// --- y si ya traen algunas, se conservan y solo se completan las que falten
store['habitos-app-v1'] = JSON.stringify({
  version: 1, habitos: [], registros: {}, tareas: [], pendientes: [],
  prefs: { idioma: 'en' }
});
const prefsAMedias = ctx.cargar();
ok('una preferencia guardada no se pisa',      prefsAMedias.prefs.idioma === 'en');
ok('las que faltaban entran con su valor de fábrica', prefsAMedias.prefs.tema === 'auto');

// --- restaurar una copia NO debe cambiarte el idioma del dispositivo
ctx.datos = {
  version: 1, habitos: [], registros: {}, tareas: [], pendientes: [],
  prefs: { idioma: 'en', tema: 'claro', nombre: 'Kev' }
};
ctx.importar(JSON.stringify({ habitos: [{ id:'x', nombre:'Leer' }], registros: {} }));
ok('importar respeta el idioma del dispositivo', ctx.datos.prefs.idioma === 'en');
ok('importar respeta el tema del dispositivo',   ctx.datos.prefs.tema === 'claro');
ok('importar respeta tu nombre',                 ctx.datos.prefs.nombre === 'Kev');
ok('pero sí trae los hábitos de la copia',       ctx.datos.habitos.length === 1);

// --- las listas de opciones que dibuja el panel de Ajustes
ok('hay dos idiomas', ctx.IDIOMAS.length === 2);
ok('los idiomas están escritos en su propio idioma',
   ctx.IDIOMAS.map(i => i.nombre).join(',') === 'Español,English');
ok('hay tres temas', ctx.TEMAS.length === 3);
ok('las claves de los temas existen en las dos tablas',
   ctx.TEMAS.every(tema => ctx.TEXTOS.es[tema.clave] && ctx.TEXTOS.en[tema.clave]));

// --- cada data-t / data-ph / data-aria del HTML tiene que existir en la tabla.
// Este test mira el HTML crudo, no el JavaScript. Cubre el error más fácil de
// cometer: marcar un elemento con data-t="cerrarTodo" y llamar a la clave
// "cerrarTodos" en TEXTOS. En pantalla eso sale como un botón sin texto.
// Se mira solo el trozo de HTML, no el <script>: ahí abajo hay un comentario
// que menciona data-t="clave" como ejemplo y lo daría por marca real.
const soloHtml = html.slice(html.indexOf('<body>'), html.lastIndexOf('<script>'));
const marcas = [...soloHtml.matchAll(/data-(?:t|ph|aria)="([^"]+)"/g)].map(m => m[1]);
const marcasHuerfanas = [...new Set(marcas)].filter(c => ctx.TEXTOS.es[c] === undefined);
ok(`las ${new Set(marcas).size} marcas del HTML existen en TEXTOS` +
   (marcasHuerfanas.length ? ' -> huérfanas: ' + marcasHuerfanas.join(', ') : ''),
   marcasHuerfanas.length === 0);

// --- y al revés: ningún color escrito a mano en el CSS.
// La regla de la v15 es que todo color vive en las variables de :root. Un
// #ffffff suelto funciona en un tema y desaparece en el otro.
const css = html.slice(html.indexOf('<style>'), html.indexOf('</style>'));
const variables = css.slice(0, css.indexOf('/* ---------- 2. RESET'));
const cuerpoCss = css.slice(css.indexOf('/* ---------- 2. RESET'));
const coloresSueltos = [...cuerpoCss.matchAll(/(#[0-9a-fA-F]{3,8}\b|rgba?\([^)]*\))/g)]
  .map(m => m[0])
  .filter(c => !/^rgba?\(\s*0\s*,\s*0\s*,\s*0\s*,\s*0\s*\)$/.test(c));
ok('no quedan colores escritos a mano fuera de las variables' +
   (coloresSueltos.length ? ' -> ' + coloresSueltos.join(', ') : ''),
   coloresSueltos.length === 0);
// El "no logrado" del calendario (v29): rojo lleno como el verde, pero con
// el número tachado. Lo tachado es lo que lo distingue sin ver colores.
const reglaFallo = (/\.cal-dia\.fallo\s*\{([^}]*)\}/.exec(cuerpoCss) || [])[1] || '';
ok('en el calendario, el día no logrado va relleno de rojo',
   /background:\s*var\(--fallo\)/.test(reglaFallo) && /color:\s*var\(--sobre-fallo\)/.test(reglaFallo));
ok('y conserva el tachado (no depende solo del color)', reglaFallo.includes('line-through'));
ok('--sobre-fallo existe en los dos temas', (variables.match(/--sobre-fallo:/g) || []).length === 2);
ok('el mapa del año sigue con la ✗ sobre fondo vacío, sin relleno rojo',
   !/\.anio-dia\.fallo\s*\{[^}]*background:\s*var\(--fallo\)\s*;/.test(cuerpoCss));
// Los días con algo en Fechas (v30): teñidos de azul, no solo el puntito.
// Y el día elegido (azul lleno) tiene que ir DESPUÉS en el CSS: con la misma
// especificidad gana el último, y si no, un día elegido con evento se vería
// teñido en vez de lleno.
const reglaConFecha = (/#fechasGrid \.cal-dia\.con-fecha\s*\{([^}]*)\}/.exec(cuerpoCss) || [])[1] || '';
ok('en Fechas, un día con algo se tiñe de azul', /color-mix\(in srgb, var\(--acento\)/.test(reglaConFecha));
// Hoy en amarillo (v32), entre el teñido y el elegido.
const reglaHoyFechas = (/#fechasGrid \.cal-dia\.hoy\s*\{([^}]*)\}/.exec(cuerpoCss) || [])[1] || '';
ok('en Fechas, hoy lleva aro amarillo', /border:\s*2px solid var\(--celebrar\)/.test(reglaHoyFechas));
ok('y va después del teñido azul (si hoy tiene algo, se ve amarillo)',
   cuerpoCss.indexOf('#fechasGrid .cal-dia.hoy {') > cuerpoCss.indexOf('#fechasGrid .cal-dia.con-fecha {'));
ok('y antes del elegido (hoy elegido se rellena de azul)',
   cuerpoCss.indexOf('#fechasGrid .cal-dia.elegido {') > cuerpoCss.indexOf('#fechasGrid .cal-dia.hoy {'));
ok('y el día elegido le gana (va después en el CSS)',
   cuerpoCss.indexOf('#fechasGrid .cal-dia.elegido {') > cuerpoCss.indexOf('#fechasGrid .cal-dia.con-fecha {'));
ok('los dos temas definen las mismas variables',
   (variables.match(/--[a-z-]+:/g) || []).length % 2 === 0);


// ============================================================
//  DÍA COMPLETO Y CELEBRACIONES
//  La animación no se puede probar: no hay pantalla. Lo que sí se prueba es
//  la CONDICIÓN que la dispara, que es donde de verdad se puede uno equivocar.
// ============================================================

const limpio = () => {
  ctx.datos = { version:1, habitos: [], registros: {}, tareas: [], pendientes: [],
                prefs: { ...ctx.PREFS_POR_DEFECTO } };
  global.confetisLanzados = 0;
};

limpio();
ok('sin hábitos el día NO está completo', ctx.diaCompleto(ctx.hoy()) === false);

ctx.agregarHabito('Leer','📖');
ctx.agregarHabito('Agua','💧');
const [hA, hB] = ctx.datos.habitos.map(h => h.id);

ok('con nada marcado el día no está completo', ctx.diaCompleto(ctx.hoy()) === false);
ctx.alternarHoy(hA);
ok('con uno de dos marcado tampoco',           ctx.diaCompleto(ctx.hoy()) === false);
ok('todavía no hay confeti',                   global.confetisLanzados === 0);

ctx.alternarHoy(hB);
ok('con los dos marcados el día está completo', ctx.diaCompleto(ctx.hoy()) === true);
ok('el confeti salió una vez',                  global.confetisLanzados === 1);

// Volver a tocar algo de un día ya completo no debe repetir la celebración.
ctx.alternarHoy(hB);   // desmarcar
ok('desmarcar no lanza confeti', global.confetisLanzados === 1);
ok('y el día deja de estar completo', ctx.diaCompleto(ctx.hoy()) === false);

// Un hábito nuevo rompe el día completo aunque no hayas desmarcado nada.
limpio();
ctx.agregarHabito('Leer','📖');
const soloUno = ctx.datos.habitos[0].id;
ctx.alternarHoy(soloUno);
ok('un solo hábito marcado completa el día',  ctx.diaCompleto(ctx.hoy()) === true);
ok('y celebra',                               global.confetisLanzados === 1);
ctx.agregarHabito('Agua','💧');
ok('agregar un hábito rompe el día completo', ctx.diaCompleto(ctx.hoy()) === false);

// Corregir un día pasado desde el calendario NO es "quedar al día".
limpio();
ctx.agregarHabito('Leer','📖');
const idAyer = ctx.datos.habitos[0].id;
ctx.alternarFecha(idAyer, ctx.haceNDias(1));
ok('completar un día pasado no lanza confeti', global.confetisLanzados === 0);
ok('pero sí queda marcado',                    ctx.diaCompleto(ctx.haceNDias(1)) === true);

// La marca que le dice a pintar() qué círculo animar.
limpio();
ctx.agregarHabito('Leer','📖');
const idMarca = ctx.datos.habitos[0].id;
ctx.alternarHoy(idMarca);
ok('marcar anota el hábito para animarlo', global.habitoRecienMarcado === idMarca);
ctx.alternarHoy(idMarca);
ok('desmarcar no anota nada',              global.habitoRecienMarcado === null);

// ============================================================
//  REORDENAR PENDIENTES E IDEAS
//  Lo difícil aquí no es el intercambio: es que datos.tareas tiene las dos
//  listas mezcladas, así que "una posición arriba" en pantalla no es "un
//  sitio arriba" en el array.
// ============================================================

limpio();
ctx.agregarTarea('uno',  'pendientes');
ctx.agregarTarea('idea', 'ideas');        // se cuela en medio a propósito
ctx.agregarTarea('dos',  'pendientes');
ctx.agregarTarea('tres', 'pendientes');

const textos = lista => ctx.tareasOrdenadas(lista).map(x => x.texto).join(',');
const idDe   = texto => ctx.datos.tareas.find(x => x.texto === texto).id;

ok('orden inicial de pendientes', textos('pendientes') === 'uno,dos,tres');

ok('subir "dos" devuelve true', ctx.moverTarea(idDe('dos'), -1) === true);
ok('"dos" pasó al primer puesto saltándose la idea del array',
   textos('pendientes') === 'dos,uno,tres');
ok('la lista de ideas no se tocó', textos('ideas') === 'idea');

ok('bajar "dos" lo devuelve a su sitio', ctx.moverTarea(idDe('dos'), 1) === true);
ok('orden restaurado', textos('pendientes') === 'uno,dos,tres');

ok('el primero no puede subir',  ctx.moverTarea(idDe('uno'), -1) === false);
ok('el último no puede bajar',   ctx.moverTarea(idDe('tres'), 1) === false);
ok('y nada se movió',            textos('pendientes') === 'uno,dos,tres');

// Las hechas viven al final por definición: moverlas no significaría nada.
ctx.alternarTarea(idDe('uno'));
ok('una tarea hecha no se mueve', ctx.moverTarea(idDe('uno'), -1) === false);
ok('las hechas siguen al final',  textos('pendientes') === 'dos,tres,uno');
ok('y "dos" sí puede subir aunque haya una hecha en medio del array',
   ctx.moverTarea(idDe('tres'), -1) === true);
ok('el intercambio ignoró a la hecha', textos('pendientes') === 'tres,dos,uno');

// Las ideas se reordenan igual, con la misma función.
ctx.agregarTarea('idea2', 'ideas');
ok('subir una idea funciona',  ctx.moverTarea(idDe('idea2'), -1) === true);
ok('las ideas quedaron al revés', textos('ideas') === 'idea2,idea');
ok('y los pendientes no se enteraron', textos('pendientes') === 'tres,dos,uno');

ok('un id que no existe no rompe nada', ctx.moverTarea('no-existe', -1) === false);

// ============================================================
//  FUERZA DEL HÁBITO (v20)
//  El promedio que perdona un mal día. Se prueba lo que promete la
//  explicación que ves en pantalla: 80 al mes, 96 a los dos meses.
// ============================================================

// Marca un hábito en todos los días de [desde, hasta] (en "días atrás").
const marcarDias = (idH, desde, hasta) => {
  for (let i = desde; i >= hasta; i--) {
    const f = ctx.haceNDias(i);
    (ctx.datos.registros[f] = ctx.datos.registros[f] || []).push(idH);
  }
};

limpio();
ctx.agregarHabito('Entrenar', '🏋️');
let hf = ctx.datos.habitos[0];
ok('un hábito recién creado y sin marcar tiene fuerza 0', ctx.fuerzaHabito(hf.id) === 0);

hf.creado = ctx.haceNDias(29);
marcarDias(hf.id, 29, 0);                 // 30 días perfectos, hoy incluido
ok('un mes perfecto deja la fuerza en 80', ctx.fuerzaHabito(hf.id) === 80);

limpio();
ctx.agregarHabito('Entrenar', '🏋️');
hf = ctx.datos.habitos[0];
hf.creado = ctx.haceNDias(30);
marcarDias(hf.id, 30, 1);                 // 30 días perfectos, hoy SIN marcar
ok('hoy sin marcar no castiga: sigue en 80', ctx.fuerzaHabito(hf.id) === 80);

limpio();
ctx.agregarHabito('Entrenar', '🏋️');
hf = ctx.datos.habitos[0];
hf.creado = ctx.haceNDias(59);
marcarDias(hf.id, 59, 0);
ok('dos meses perfectos dejan la fuerza en 96', ctx.fuerzaHabito(hf.id) === 96);

// La razón de ser de la fuerza: fallar ayer rompe la racha, no la fuerza.
ctx.datos.registros[ctx.haceNDias(1)] = [];
ok('fallar ayer devuelve la racha a 1', ctx.calcularRacha(hf.id) === 1);
ok('pero la fuerza apenas se mueve (sigue por encima de 90)', ctx.fuerzaHabito(hf.id) > 90);
ok('aunque sí baja algo', ctx.fuerzaHabito(hf.id) < 96);

limpio();
ctx.agregarHabito('Entrenar', '🏋️');
hf = ctx.datos.habitos[0];
hf.creado = ctx.haceNDias(400);
marcarDias(hf.id, 400, 0);
ok('ni con más de un año perfecto pasa de 100', ctx.fuerzaHabito(hf.id) <= 100);

// Días marcados antes de crear el hábito (se puede, desde el calendario):
// cuentan desde el primero, igual que el porcentaje de 30 días.
limpio();
ctx.agregarHabito('Entrenar', '🏋️');
hf = ctx.datos.habitos[0];
marcarDias(hf.id, 29, 0);                 // creado hoy, pero con 30 días marcados
ok('los días marcados antes de crearlo también cuentan', ctx.fuerzaHabito(hf.id) === 80);

// ============================================================
//  EL MAPA DEL AÑO (v21): mesesHasta()
//  Hasta la v20 eran 53 semanas en columnas; ahora son 12 meses. La
//  pantalla solo pinta cuadritos; aquí se prueba que cada fecha caiga en
//  su mes y en su columna.
// ============================================================

let meses = ctx.mesesHasta('2026-10-13', 12);
ok('devuelve 12 meses', meses.length === 12);
ok('el último es el mes de la fecha', meses[11].anio === 2026 && meses[11].mes === 10);
ok('el primero es 11 meses antes, cruzando el año', meses[0].anio === 2025 && meses[0].mes === 11);
ok('van seguidos, sin saltarse ni repetir un mes',
   meses.every((m, i) => i === 0 ||
     (m.anio * 12 + m.mes) - (meses[i - 1].anio * 12 + meses[i - 1].mes) === 1));
ok('cada mes trae tantas fechas como días tiene',
   meses.every(m => m.celdas.filter(Boolean).length === ctx.diasDelMes(m.anio, m.mes)));
ok('y tantos huecos al principio como dice columnaInicio()',
   meses.every(m => m.celdas.indexOf(m.celdas.find(Boolean)) === ctx.columnaInicio(m.anio, m.mes)));
ok('octubre de 2026 empieza en jueves: 3 huecos (lunes, martes, miércoles)',
   meses[11].celdas.slice(0, 4).join() === ',,,2026-10-01');
ok('los huecos van solo al principio, nunca en medio',
   meses.every(m => m.celdas.slice(m.celdas.indexOf(m.celdas.find(Boolean))).every(Boolean)));
ok('los días que faltan de este mes SÍ vienen (el mes se dibuja entero)',
   meses[11].celdas.includes('2026-10-31'));

// Que no se salte ni repita ningún día en todo el año, incluido el cambio
// de horario de noviembre y el de marzo.
const seguidos = meses.flatMap(m => m.celdas.filter(Boolean));
ok('los días van seguidos, sin huecos ni repetidos (horario de verano incluido)',
   seguidos.every((f, i) => i === 0 || ctx.diasEntre(seguidos[i - 1], f) === 1));

meses = ctx.mesesHasta('2028-02-10', 1);
ok('un febrero bisiesto trae 29 días', meses[0].celdas.filter(Boolean).length === 29);
meses = ctx.mesesHasta('2027-01-05', 2);
ok('en enero, el mes anterior es diciembre del año pasado',
   meses[0].anio === 2026 && meses[0].mes === 12);

// ============================================================
//  ÚLTIMA COPIA (v20)
// ============================================================

ok('sin copia lo dice', ctx.textoUltimaCopia('', '2026-09-23') ===
   'Todavía no has guardado ninguna copia desde este teléfono.');
ok('copia de hoy', ctx.textoUltimaCopia('2026-09-23', '2026-09-23') === 'Última copia: hoy.');
ok('copia de ayer', ctx.textoUltimaCopia('2026-09-22', '2026-09-23') === 'Última copia: ayer.');
ok('copia de hace 12 días', ctx.textoUltimaCopia('2026-09-11', '2026-09-23') ===
   'Última copia: hace 12 días.');
ok('cruzando meses también cuenta bien', ctx.textoUltimaCopia('2026-08-30', '2026-09-02') ===
   'Última copia: hace 3 días.');
ctx.datos.prefs.idioma = 'en';
ok('y en inglés', ctx.textoUltimaCopia('2026-09-11', '2026-09-23') === 'Last backup: 12 days ago.');
ctx.datos.prefs.idioma = 'es';
ok('la preferencia nace vacía', ctx.PREFS_POR_DEFECTO.ultimaCopia === '');

// ============================================================
//  LA TABLA PARA EXCEL (v20)
// ============================================================

ok('una celda normal va tal cual', ctx.celdaCSV('Leer') === 'Leer');
ok('un número va tal cual', ctx.celdaCSV(1) === '1');
ok('una coma obliga a poner comillas', ctx.celdaCSV('Leer, 20 min') === '"Leer, 20 min"');
ok('las comillas de adentro se duplican', ctx.celdaCSV('Dijo "ya"') === '"Dijo ""ya"""');
ok('un salto de línea también va entre comillas', ctx.celdaCSV('a\nb') === '"a\nb"');

limpio();
ok('sin hábitos queda solo el encabezado', ctx.aCSV() === 'fecha,habito,hecho');

ctx.agregarHabito('Leer, 20 min', '📖');
ctx.agregarHabito('Agua', '💧');
const [hLeer, hAgua] = ctx.datos.habitos;
hLeer.creado = ctx.haceNDias(2);
hAgua.creado = ctx.hoy();
ctx.datos.registros[ctx.haceNDias(1)] = [hLeer.id];

const lineas = ctx.aCSV().split('\r\n');
ok('encabezado + una fila por hábito y por día (3 de Leer + 1 de Agua)', lineas.length === 5);
ok('los días sin marcar salen con 0',
   lineas.includes(`${ctx.haceNDias(2)},"📖 Leer, 20 min",0`));
ok('los marcados salen con 1',
   lineas.includes(`${ctx.haceNDias(1)},"📖 Leer, 20 min",1`));
ok('el hábito nuevo solo tiene la fila de hoy',
   lineas.filter(l => l.includes('Agua')).length === 1 &&
   lineas.includes(`${ctx.hoy()},💧 Agua,0`));

// Un hábito borrado no deja filas huérfanas en la tabla.
ctx.borrarHabito(hLeer.id);
ok('un hábito borrado desaparece de la tabla', !ctx.aCSV().includes('Leer'));

ctx.datos.prefs.idioma = 'en';
ok('el encabezado se traduce', ctx.aCSV().startsWith('date,habit,done'));
ctx.datos.prefs.idioma = 'es';
ok('el archivo se llama habitos-FECHA.csv (y .gitignore lo cubre)',
   ctx.nombreArchivoCSV() === `habitos-${ctx.hoy()}.csv`);

// ============================================================
//  EL NÚMERO EN EL ÍCONO (v20): estadoInsignia()
// ============================================================

ok('sin soporte (Safari o iOS viejo) dice que no se puede',
   ctx.estadoInsignia(false, 'granted') === 'insigniaNoDisponible');
ok('con permiso, está activa', ctx.estadoInsignia(true, 'granted') === 'insigniaActiva');
ok('con el permiso negado, está bloqueada', ctx.estadoInsignia(true, 'denied') === 'insigniaBloqueada');
ok('sin haber preguntado, está apagada (y ahí sale el botón)',
   ctx.estadoInsignia(true, 'default') === 'insigniaApagada');
ok('las cuatro claves existen en los dos idiomas',
   ['insigniaNoDisponible','insigniaActiva','insigniaBloqueada','insigniaApagada']
     .every(k => typeof ctx.TEXTOS.es[k] === 'string' && typeof ctx.TEXTOS.en[k] === 'string'));

// ============================================================
//  HITOS DE RACHA (v21): hitoDeRacha()
//  Lo que se prueba es el CRUCE: llegar a 7, no estar en 7.
// ============================================================

ok('los hitos son 7, 30, 100 y 365', ctx.HITOS.join() === '7,30,100,365');
ok('de 6 a 7 días es un hito',     ctx.hitoDeRacha(6, 7) === 7);
ok('de 29 a 30 también',           ctx.hitoDeRacha(29, 30) === 30);
ok('y de 364 a 365',               ctx.hitoDeRacha(364, 365) === 365);
ok('de 7 a 8 ya no: estar pasado el hito no es llegar a él', ctx.hitoDeRacha(7, 8) === 0);
ok('de 0 a 1 no es ningún hito',   ctx.hitoDeRacha(0, 1) === 0);
ok('bajar de 7 a 6 (desmarcar) no celebra', ctx.hitoDeRacha(7, 6) === 0);
ok('quedarse igual tampoco',       ctx.hitoDeRacha(7, 7) === 0);

// Ya dentro de la app: alternarFecha() decide cuál de las dos celebraciones sale.
const limpioHitos = () => { limpio(); global.hitosCelebrados = []; };

limpioHitos();
ctx.agregarHabito('Leer', '📖');
let hHito = ctx.datos.habitos[0].id;
marcarDias(hHito, 6, 1);                      // de hace 6 días hasta ayer: 6 seguidos
ctx.alternarHoy(hHito);                       // hoy es el séptimo
ok('marcar el séptimo día celebra el hito de 7',
   global.hitosCelebrados.join() === '7');
ok('y como el hito gana, NO sale además el confeti del día completo',
   global.confetisLanzados === 0 && ctx.diaCompleto(ctx.hoy()) === true);

ctx.alternarHoy(hHito);                       // desmarcar
ok('desmarcar no celebra nada', global.hitosCelebrados.length === 1);

limpioHitos();
ctx.agregarHabito('Leer', '📖');
hHito = ctx.datos.habitos[0].id;
marcarDias(hHito, 7, 1);                      // ya llevaba 7 hasta ayer
ctx.alternarHoy(hHito);                       // hoy son 8
ok('el día 8 no es hito, así que sale el confeti normal',
   global.hitosCelebrados.length === 0 && global.confetisLanzados === 1);

// Corregir el pasado en el calendario no es "llegar" a nada hoy.
limpioHitos();
ctx.agregarHabito('Leer', '📖');
hHito = ctx.datos.habitos[0].id;
marcarDias(hHito, 7, 2);                      // de hace 7 a hace 2: falta ayer
ctx.alternarHoy(hHito);                       // hoy: racha de 1
ctx.alternarFecha(hHito, ctx.haceNDias(1));   // rellenar ayer: la racha salta a 8
ok('rellenar un hueco del pasado no lanza la medalla',
   global.hitosCelebrados.length === 0);

// Con dos hábitos, el hito sale aunque el día no quede completo.
limpioHitos();
ctx.agregarHabito('Leer', '📖');
ctx.agregarHabito('Agua', '💧');
hHito = ctx.datos.habitos[0].id;
marcarDias(hHito, 29, 1);
ctx.alternarHoy(hHito);
ok('llegar a 30 con otro hábito sin marcar celebra igual',
   global.hitosCelebrados.join() === '30' && !ctx.diaCompleto(ctx.hoy()));

// ============================================================
//  EL COLOR DE CADA HÁBITO: quitado en la v24
// ============================================================

// Los datos de las v21 a v23 traen un campo `color` que ya nada usa.
store['habitos-app-v1'] = JSON.stringify({ version: 1, registros: {},
  habitos: [{ id: 'a', nombre: 'Leer', emoji: '📖', color: 3 }] });
const sinColor = ctx.cargar();
ok('al cargar, el color viejo se borra', !('color' in sinColor.habitos[0]));
ok('y el hábito sigue ahí', sinColor.habitos[0].nombre === 'Leer');
limpio();
ctx.agregarHabito('Leer', '📖');
ok('un hábito nuevo ya no lleva color', !('color' in ctx.datos.habitos[0]));

// ============================================================
//  NO LOGRADO (v23): ciclarFecha()
//  vacío → ✓ → ✗ → vacío. Un fallo es "no hecho" para todas las fórmulas.
// ============================================================

limpio();
ctx.agregarHabito('Inglés', '🧠');
const hIng = ctx.datos.habitos[0].id;
const ayer = ctx.haceNDias(1);

ctx.ciclarFecha(hIng, ayer);
ok('primer toque: hecho', ctx.estaHecho(hIng, ayer) && !ctx.esFallo(hIng, ayer));
ctx.ciclarFecha(hIng, ayer);
ok('segundo toque: no logrado (y ya no hecho)', !ctx.estaHecho(hIng, ayer) && ctx.esFallo(hIng, ayer));
ctx.ciclarFecha(hIng, ayer);
ok('tercer toque: vacío otra vez', !ctx.estaHecho(hIng, ayer) && !ctx.esFallo(hIng, ayer));
ok('y el día vacío no deja una lista vacía guardada', !(ayer in ctx.datos.fallos));

ok('el futuro no se toca', ctx.ciclarFecha(hIng, '2999-01-01') === false &&
   !ctx.esFallo(hIng, '2999-01-01'));

// Nunca las dos cosas a la vez: marcar desde la lista gana sobre el fallo.
ctx.ciclarFecha(hIng, ctx.hoy());
ctx.ciclarFecha(hIng, ctx.hoy());                 // hoy: no logrado
ok('hoy quedó no logrado', ctx.esFallo(hIng, ctx.hoy()));
ctx.alternarHoy(hIng);                             // el círculo de la lista
ok('tocar el círculo lo marca como hecho', ctx.estaHecho(hIng, ctx.hoy()));
ok('y borra el no logrado: un día no es las dos cosas', !ctx.esFallo(hIng, ctx.hoy()));

// --- v27: mantener oprimido el círculo = alternarFalloHoy()
// vacío o ✓ → ✗, y ✗ → vacío. Nunca pasa por el ✓.
limpio();
ctx.agregarHabito('Correr', '🏃');
const hLargo = ctx.datos.habitos[0].id;
ctx.alternarFalloHoy(hLargo);
ok('mantener oprimido un hábito vacío lo deja no logrado', ctx.esFallo(hLargo, ctx.hoy()));
ctx.alternarFalloHoy(hLargo);
ok('otra vez lo deja vacío, no en ✓', !ctx.esFallo(hLargo, ctx.hoy()) && !ctx.estaHecho(hLargo, ctx.hoy()));
ctx.alternarHoy(hLargo);                           // ✓ con el toque corto
ctx.alternarFalloHoy(hLargo);                      // y luego mantener oprimido
ok('sobre un ✓ lo cambia a ✗', ctx.esFallo(hLargo, ctx.hoy()));
ok('y quita el ✓: un día no es las dos cosas', !ctx.estaHecho(hLargo, ctx.hoy()));
ok('quitar el ✓ se encola para la nube, igual que desmarcar',
   ctx.datos.pendientes.some(x => x.tipo === 'desmarcar' && x.id === hLargo));
marcarDias(hLargo, 4, 1);                          // 4 seguidos hasta ayer
ok('con hoy en ✗ la racha es 0 (regla de la v25)', ctx.calcularRacha(hLargo) === 0);
ctx.alternarFalloHoy(hLargo);
ok('al quitar el ✗ la racha vuelve a contar hasta ayer', ctx.calcularRacha(hLargo) === 4);

// Un fallo rompe la racha igual que un día vacío: ninguna fórmula cambia.
limpio();
ctx.agregarHabito('Inglés', '🧠');
const hRacha = ctx.datos.habitos[0].id;
marcarDias(hRacha, 5, 1);                          // 5 seguidos hasta ayer
ok('con 5 seguidos la racha es 5', ctx.calcularRacha(hRacha) === 5);
ctx.ciclarFecha(hRacha, ctx.haceNDias(3));         // ✓ → ✗ hace 3 días
ok('un no logrado en medio corta la racha', ctx.calcularRacha(hRacha) === 2);
// v25: un ✗ HOY pone la racha en 0 en el acto (antes contaba hasta ayer).
ctx.ponerFallo(hRacha, ctx.hoy(), true);
ok('un no logrado hoy pone la racha en 0 en el momento', ctx.calcularRacha(hRacha) === 0);
ctx.alternarHoy(hRacha);                           // al final sí lo hizo
ok('y si al final lo marcas hecho, la racha vuelve (y suma hoy)', ctx.calcularRacha(hRacha) === 3);
ctx.alternarHoy(hRacha);                           // lo dejamos como estaba
ok('hoy vacío (sin ✗) sigue contando hasta ayer, como siempre', ctx.calcularRacha(hRacha) === 2);
const conFallo = [ctx.porcentajeUltimos(hRacha, 30), ctx.fuerzaHabito(hRacha),
                  ctx.mejorRacha(hRacha), ctx.totalDias(hRacha)];
ctx.ciclarFecha(hRacha, ctx.haceNDias(3));         // ✗ → vacío
const vacio = [ctx.porcentajeUltimos(hRacha, 30), ctx.fuerzaHabito(hRacha),
               ctx.mejorRacha(hRacha), ctx.totalDias(hRacha)];
ok('porcentaje, fuerza, mejor racha y total dan lo mismo con ✗ que con vacío',
   conFallo.join() === vacio.join());

// Pasar de ✓ a ✗ sí avisa a la nube (se desmarcó); el fallo en sí no viaja.
limpio();
ctx.agregarHabito('Inglés', '🧠');
const hCola = ctx.datos.habitos[0].id;
ctx.ciclarFecha(hCola, ayer);
ctx.datos.pendientes.length = 0;
ctx.ciclarFecha(hCola, ayer);                      // ✓ → ✗
ok('pasar de ✓ a ✗ encola un "desmarcar" para la nube',
   ctx.datos.pendientes.length === 1 && ctx.datos.pendientes[0].tipo === 'desmarcar');
ctx.ciclarFecha(hCola, ayer);                      // ✗ → vacío
ok('y de ✗ a vacío no manda nada (los fallos no viajan todavía)',
   ctx.datos.pendientes.length === 1);

// Marcar desde el calendario sigue celebrando lo que tocaba celebrar.
limpio();
ctx.agregarHabito('Inglés', '🧠');
ctx.ciclarFecha(ctx.datos.habitos[0].id, ctx.hoy());
ok('completar hoy desde el calendario lanza el confeti', global.confetisLanzados === 1);

// Borrar el hábito se lleva también sus días no logrados.
limpio();
ctx.agregarHabito('Inglés', '🧠');
ctx.agregarHabito('Agua', '💧');
const [hBorrar, hQueda] = ctx.datos.habitos.map(h => h.id);
ctx.ponerFallo(hBorrar, ayer, true);
ctx.ponerFallo(hQueda, ayer, true);
ctx.borrarHabito(hBorrar);
ok('borrar un hábito borra sus no logrados', !ctx.esFallo(hBorrar, ayer));
ok('pero no los de los demás', ctx.esFallo(hQueda, ayer));

// Datos de antes de la v23, copias y datos armados sin el campo.
store['habitos-app-v1'] = JSON.stringify({ version: 1, habitos: [], registros: {} });
ok('los datos de antes arrancan con fallos vacíos', JSON.stringify(ctx.cargar().fallos) === '{}');
ctx.datos = { version: 1, habitos: [], registros: {}, tareas: [], pendientes: [],
              prefs: { ...ctx.PREFS_POR_DEFECTO } };   // sin "fallos"
ok('sin el campo, esFallo responde que no (no se rompe)', ctx.esFallo('x', ayer) === false);
ctx.importar(JSON.stringify({ habitos: [{ id: 'a', nombre: 'Leer' }], registros: {},
                              fallos: { [ayer]: ['a'] } }));
ok('importar una copia trae sus no logrados', ctx.esFallo('a', ayer));
ctx.importar(JSON.stringify({ habitos: [{ id: 'a', nombre: 'Leer' }], registros: {} }));
ok('y una copia vieja, sin ellos, entra con la lista vacía',
   JSON.stringify(ctx.datos.fallos) === '{}');


// ============================================================
//  FECHAS IMPORTANTES (v30)
//  La pregunta central es "¿cuándo es la próxima vez?". Se prueba con un
//  `desde` fijo, no con hoy(): así las pruebas dan lo mismo el día que sea.
// ============================================================
{
  const anual = (fecha) => ({ fecha, repite: 'anual' });
  const unica = (fecha) => ({ fecha, repite: 'no' });

  ok('esFechaValida acepta un día real', ctx.esFechaValida('2026-10-17'));
  ok('y rechaza el 30 de febrero', !ctx.esFechaValida('2026-02-30'));
  ok('y el 29 de febrero de un año no bisiesto', !ctx.esFechaValida('2027-02-29'));
  ok('pero acepta el de un bisiesto', ctx.esFechaValida('2028-02-29'));
  ok('y rechaza cualquier otra forma', !ctx.esFechaValida('17/10/2026') && !ctx.esFechaValida(''));

  ok('un cumpleaños que aún no llega este año cae este año',
     ctx.proximaOcurrencia(anual('1996-12-03'), '2026-10-17') === '2026-12-03');
  ok('uno que ya pasó este año cae el año que viene',
     ctx.proximaOcurrencia(anual('1996-03-14'), '2026-10-17') === '2027-03-14');
  ok('si es hoy, es hoy (no el año que viene)',
     ctx.proximaOcurrencia(anual('1996-10-17'), '2026-10-17') === '2026-10-17');
  ok('el 31 de diciembre mirado desde el 1 de enero no se salta el año',
     ctx.proximaOcurrencia(anual('2000-12-31'), '2026-01-01') === '2026-12-31');
  ok('el 29 de febrero se celebra el 28 en un año no bisiesto',
     ctx.proximaOcurrencia(anual('2000-02-29'), '2026-10-17') === '2027-02-28');
  ok('y el 29 en uno bisiesto',
     ctx.proximaOcurrencia(anual('2000-02-29'), '2027-10-17') === '2028-02-29');
  // Ojo con esta prueba: con una fecha del año que viene (2027) daría lo
  // mismo con o sin el arreglo, porque "el próximo 1 de junio" ES ese. Hace
  // falta una a dos años para ver la diferencia. Se comprobó rompiendo el
  // arreglo a propósito: con 2027 seguía en verde.
  ok('un aniversario que empieza dentro de dos años no aparece antes',
     ctx.proximaOcurrencia(anual('2028-06-01'), '2026-10-17') === '2028-06-01');
  ok('una fecha única que no ha llegado cae ese día',
     ctx.proximaOcurrencia(unica('2026-11-05'), '2026-10-17') === '2026-11-05');
  ok('una fecha única que ya pasó no tiene próxima vez',
     ctx.proximaOcurrencia(unica('2026-10-01'), '2026-10-17') === null);

  ok('cumple 30 en 2026 quien nació en 1996',
     ctx.aniosQueCumple(anual('1996-12-03'), '2026-12-03') === 30);
  ok('una fecha única no cumple años', ctx.aniosQueCumple(unica('2026-11-05'), '2026-11-05') === 0);

  ok('una anual cae en su día de cualquier año posterior', ctx.caeEnDia(anual('1996-12-03'), '2031-12-03'));
  ok('pero no en años anteriores a la original', !ctx.caeEnDia(anual('1996-12-03'), '1990-12-03'));
  ok('una única solo cae en su día exacto',
     ctx.caeEnDia(unica('2026-11-05'), '2026-11-05') && !ctx.caeEnDia(unica('2026-11-05'), '2027-11-05'));

  const lista = [
    { id: 'a', titulo: 'Cumple Ana', fecha: '1996-12-03', repite: 'anual' },
    { id: 'b', titulo: 'Pagar seguro', fecha: '2026-10-20', repite: 'no' },
    { id: 'c', titulo: 'Cita médica', fecha: '2026-10-01', repite: 'no' },
    { id: 'd', titulo: 'Aniversario', fecha: '2020-10-17', repite: 'anual' },
    { id: 'e', titulo: 'Vuelo', fecha: '2026-10-20', repite: 'no' },
  ];
  const agenda = ctx.agendaFechas(lista, '2026-10-17');
  ok('la agenda va de lo más cercano a lo más lejano',
     agenda.map(f => f.fecha.id).join() === 'd,b,e,a');
  ok('a igual día respeta el orden en que se agregaron (seguro antes que vuelo)',
     agenda[1].fecha.id === 'b' && agenda[2].fecha.id === 'e');
  ok('la agenda no trae lo que ya pasó', !agenda.some(f => f.fecha.id === 'c'));
  ok('cada fila sabe cuántos días faltan', agenda[0].faltan === 0 && agenda[1].faltan === 3);
  ok('y cuántos años cumple', agenda[0].anios === 6 && agenda[3].anios === 30);
  ok('las pasadas son solo las únicas que ya fueron',
     ctx.fechasPasadas(lista, '2026-10-17').map(f => f.id).join() === 'c');
  ok('la franja muestra solo lo de los próximos 3 días',
     ctx.proximasFechas(lista, '2026-10-17').map(f => f.fecha.id).join() === 'd,b,e');
  ok('el puntito del mes marca los días que tienen algo',
     [...ctx.diasConFechas(lista, 2026, 10)].join() === '1,17,20');
  ok('y fechasDelDia trae las de ese día', ctx.fechasDelDia(lista, '2026-10-20').length === 2);

  ok('faltan 0 dice "Hoy"', ctx.textoFaltan(0) === 'Hoy');
  ok('faltan 1 dice "Mañana"', ctx.textoFaltan(1) === 'Mañana');
  ok('faltan 12 dice "12 días"', ctx.textoFaltan(12) === '12 días');

  // Guardar, editar, borrar
  ctx.datos.fechas = [];
  ok('sin título no se guarda', ctx.agregarFecha({ titulo: '  ', fecha: '2026-12-03' }) === null);
  ok('con una fecha que no existe tampoco', ctx.agregarFecha({ titulo: 'X', fecha: '2026-02-30' }) === null);
  const idF = ctx.agregarFecha({ titulo: '  Cumple Ana ', fecha: '1996-12-03', repite: 'anual', emoji: '🎂', nota: '' });
  const f = ctx.datos.fechas.find(x => x.id === idF);
  ok('con título y fecha sí se guarda', !!f);
  ok('el título llega sin espacios de sobra', f.titulo === 'Cumple Ana');
  ok('una nota vacía no se guarda como ""', !('nota' in f));
  ok('un emoji desconocido cae en 📌',
     ctx.limpiarFecha({ titulo: 'X', fecha: '2026-01-01', emoji: '<b>' }).emoji === '📌');
  ok('un "repite" desconocido NO se vuelve anual',
     ctx.limpiarFecha({ titulo: 'X', fecha: '2026-01-01', repite: 'quincenal' }).repite === 'no');
  ok('editar cambia los campos y conserva el id',
     ctx.editarFecha(idF, { titulo: 'Cumple de Ana', fecha: '1996-12-04', repite: 'anual', emoji: '🎂', nota: 'Le gusta el café' })
     && ctx.datos.fechas[0].id === idF && ctx.datos.fechas[0].fecha === '1996-12-04' && ctx.datos.fechas[0].nota === 'Le gusta el café');
  ctx.editarFecha(idF, { titulo: 'Cumple de Ana', fecha: '1996-12-04', repite: 'anual', emoji: '🎂', nota: '' });
  ok('y borrar la nota la quita del todo', !('nota' in ctx.datos.fechas[0]));
  ok('editar con un título vacío no cambia nada',
     !ctx.editarFecha(idF, { titulo: '', fecha: '1996-12-04' }) && ctx.datos.fechas[0].titulo === 'Cumple de Ana');

  const tareasAntes = ctx.datos.tareas.length;
  ok('una fecha se puede mandar a Pendientes', ctx.fechaAPendiente(idF, '2026-10-17'));
  const nueva = ctx.datos.tareas[ctx.datos.tareas.length - 1];
  ok('y llega como pendiente con su emoji y su título',
     ctx.datos.tareas.length === tareasAntes + 1 && nueva.lista === 'pendientes' && nueva.texto.startsWith('🎂 Cumple de Ana · '));

  ok('borrar la quita', ctx.borrarFecha(idF) && ctx.datos.fechas.length === 0);
  ok('borrar algo que no existe devuelve false', ctx.borrarFecha('no-existe') === false);

  // Los datos viejos y las copias
  localStorage.setItem('habitos-app-v1', JSON.stringify({ version: 1, habitos: [], registros: {} }));
  ok('unos datos de antes de la v30 cargan con la lista de fechas vacía',
     Array.isArray(ctx.cargar().fechas) && ctx.cargar().fechas.length === 0);
  ctx.aplicarCopia({ habitos: [], registros: {} });
  ok('una copia vieja, sin fechas, entra con la lista vacía', Array.isArray(ctx.datos.fechas) && ctx.datos.fechas.length === 0);
  ctx.aplicarCopia({ habitos: [], registros: {}, fechas: [{ id: 'z', titulo: 'Vuelo', fecha: '2026-11-05', repite: 'no', emoji: '✈️' }] });
  ok('y una copia nueva trae sus fechas', ctx.datos.fechas.length === 1 && ctx.datos.fechas[0].titulo === 'Vuelo');
}

// ============================================================
//  FECHAS QUE SE REPITEN Y EMOJI PROPIO (v31)
//  Mismo truco que arriba: un `desde` fijo. La regla que más fácil se
//  rompe es el día que no existe (31 en abril, 29 de febrero).
// ============================================================
{
  const semanal = (fecha, cada) => ({ fecha, repite: 'semanal', ...(cada ? { cada } : {}) });
  const mensual = (fecha, cada) => ({ fecha, repite: 'mensual', ...(cada ? { cada } : {}) });
  const anual   = (fecha, cada) => ({ fecha, repite: 'anual',   ...(cada ? { cada } : {}) });

  // Las piezas
  ok('sumarDias corre una semana', ctx.sumarDias('2026-10-17', 7) === '2026-10-24');
  ok('sumarDias cruza el cambio de hora de noviembre sin perder un día',
     ctx.sumarDias('2026-10-30', 7) === '2026-11-06');
  ok('sumarDias cruza el año', ctx.sumarDias('2026-12-29', 7) === '2027-01-05');
  ok('sumarMeses: el 31 de enero más un mes cae el 28 de febrero', ctx.sumarMeses('2026-01-31', 1) === '2026-02-28');
  ok('y en un año bisiesto, el 29', ctx.sumarMeses('2028-01-31', 1) === '2028-02-29');
  ok('sumarMeses cruza el año', ctx.sumarMeses('2026-11-15', 3) === '2027-02-15');
  ok('mesesEntre no mira el día', ctx.mesesEntre('2026-03-31', '2026-10-01') === 7);
  ok('cadaDe sin campo es 1', ctx.cadaDe({}) === 1 && ctx.cadaDe({ cada: 0 }) === 1 && ctx.cadaDe({ cada: 'x' }) === 1);

  // Semanal
  ok('una semanal que empezó un sábado cae el sábado siguiente',
     ctx.proximaOcurrencia(semanal('2026-10-03'), '2026-10-15') === '2026-10-17');
  ok('si hoy le toca, es hoy', ctx.proximaOcurrencia(semanal('2026-10-03'), '2026-10-17') === '2026-10-17');
  ok('cada 2 semanas se salta una',
     ctx.proximaOcurrencia(semanal('2026-10-03', 2), '2026-10-04') === '2026-10-17');
  ok('y no cae en la semana que se salta', !ctx.caeEnDia(semanal('2026-10-03', 2), '2026-10-10'));
  ok('una semanal que todavía no empieza cae el primer día',
     ctx.proximaOcurrencia(semanal('2026-11-01'), '2026-10-17') === '2026-11-01');
  ok('una semanal no cae antes de empezar', !ctx.caeEnDia(semanal('2026-10-17'), '2026-10-10'));
  ok('el mes con una semanal tiene sus 5 sábados',
     [...ctx.diasConFechas([semanal('2026-10-03')], 2026, 10)].join() === '3,10,17,24,31');

  // Mensual
  ok('una mensual del 5 mirada el 17 cae el 5 del mes siguiente',
     ctx.proximaOcurrencia(mensual('2026-03-05'), '2026-10-17') === '2026-11-05');
  ok('una mensual del 20 mirada el 17 cae este mes',
     ctx.proximaOcurrencia(mensual('2026-03-20'), '2026-10-17') === '2026-10-20');
  ok('un pago del 31 cae el 30 en noviembre',
     ctx.proximaOcurrencia(mensual('2026-01-31'), '2026-11-01') === '2026-11-30');
  ok('y vuelve al 31 en diciembre (no se queda en 30)',
     ctx.proximaOcurrencia(mensual('2026-01-31'), '2026-12-01') === '2026-12-31');
  ok('cada 2 meses: de marzo, mirado en octubre, cae en noviembre',
     ctx.proximaOcurrencia(mensual('2026-03-05', 2), '2026-10-01') === '2026-11-05');
  ok('cada 2 meses: el día ya pasado del mes que toca salta 2 meses, no 1',
     ctx.proximaOcurrencia(mensual('2026-03-05', 2), '2026-11-06') === '2027-01-05');
  ok('cada 3 meses no cae en los meses de en medio',
     ctx.caeEnDia(mensual('2026-01-10', 3), '2026-04-10') && !ctx.caeEnDia(mensual('2026-01-10', 3), '2026-03-10'));

  // Anual (la v30 sigue igual) y cada N años
  ok('una anual sin "cada" sigue como en la v30',
     ctx.proximaOcurrencia(anual('1996-03-14'), '2026-10-17') === '2027-03-14');
  ok('cada 2 años se salta uno',
     ctx.proximaOcurrencia(anual('2024-03-14', 2), '2026-10-17') === '2028-03-14');

  // Lo que se dice y lo que sale en la franja
  ok('textoRepite dice "cada semana"', ctx.textoRepite(semanal('2026-10-03')) === 'cada semana');
  ok('y "cada 3 meses"', ctx.textoRepite(mensual('2026-10-03', 3)) === 'cada 3 meses');
  ok('una anual de cada año no dice nada (ya dice los años)', ctx.textoRepite(anual('1996-10-03')) === '');
  ok('una única no dice nada', ctx.textoRepite({ fecha: '2026-10-03', repite: 'no' }) === '');
  const conSemanal = [
    { id: 's', fecha: '2026-10-03', repite: 'semanal' },   // le toca el 17 y el 24
    { id: 'm', fecha: '2026-09-19', repite: 'mensual' },   // le toca el 19
  ];
  ok('la semanal sale en la franja el mismo día',
     ctx.proximasFechas(conSemanal, '2026-10-17').map(f => f.fecha.id).join() === 's,m');
  // Ojo: el día de esta prueba tiene que estar a 3 días o menos de la
  // semanal. Primero se escribió con el 18 (a 6 días del 24) y seguía en
  // verde aunque se quitara la regla: ahí no sale con regla ni sin ella.
  ok('pero no los días antes (a 2 días del sábado 24 no sale)',
     ctx.proximasFechas(conSemanal, '2026-10-22').length === 0);
  ok('la mensual sí avisa días antes',
     ctx.proximasFechas(conSemanal, '2026-11-17').map(f => f.fecha.id).join() === 'm');
  ok('las que se repiten nunca están en "Ya pasaron"',
     ctx.fechasPasadas(conSemanal, '2026-12-01').length === 0);

  // Guardar
  const limpia = (c) => ctx.limpiarFecha({ titulo: 'X', fecha: '2026-01-01', ...c });
  ok('semanal y mensual se guardan', limpia({ repite: 'semanal' }).repite === 'semanal' && limpia({ repite: 'mensual' }).repite === 'mensual');
  ok('cada 1 no se guarda', !('cada' in limpia({ repite: 'mensual', cada: 1 })));
  ok('cada 2 sí', limpia({ repite: 'mensual', cada: 2 }).cada === 2);
  ok('"cada" llega como texto del campo y se entiende', limpia({ repite: 'semanal', cada: '3' }).cada === 3);
  ok('un "cada" raro no se guarda', !('cada' in limpia({ repite: 'mensual', cada: 0 }))
     && !('cada' in limpia({ repite: 'mensual', cada: 2.5 })) && !('cada' in limpia({ repite: 'mensual', cada: 100 })));
  ok('una fecha única nunca lleva "cada"', !('cada' in limpia({ repite: 'no', cada: 4 })));
  ctx.datos.fechas = [];
  const idC = ctx.agregarFecha({ titulo: 'Gimnasio', fecha: '2026-10-03', repite: 'semanal', cada: 2, emoji: '📌' });
  ctx.editarFecha(idC, { titulo: 'Gimnasio', fecha: '2026-10-03', repite: 'semanal', cada: 1, emoji: '📌' });
  ok('al editar a "cada 1" el "cada" viejo se borra', !('cada' in ctx.datos.fechas[0]));

  // Emoji propio
  ok('un emoji que no está en la lista se guarda', limpia({ emoji: '🎓' }).emoji === '🎓');
  ok('una bandera también (son dos piezas pegadas)', limpia({ emoji: '🇨🇴' }).emoji === '🇨🇴');
  ok('si escribes varios, se queda el primero', limpia({ emoji: '🐶🐱' }).emoji === '🐶');
  ok('una letra no es un emoji: cae en 📌', limpia({ emoji: 'a' }).emoji === '📌');
  const usadas = [{ emoji: '🎂' }, { emoji: '🎓' }, { emoji: '🐶' }, { emoji: '🎓' }];
  ok('la lista trae los seis y detrás los propios en uso, sin repetir',
     ctx.emojisParaFechas(usadas).join() === ctx.EMOJIS_FECHA.concat(['🎓', '🐶']).join());
  ok('sin fechas, la lista son los seis', ctx.emojisParaFechas([]).length === 6);
  ctx.datos.fechas = [];
}

// ============================================================
//  QUITAR EMOJIS Y VOLVER A HOY (v32)
// ============================================================
{
  const usadas = [{ emoji: '🎓' }, { emoji: '🐶' }];
  ok('un emoji oculto no sale en la lista',
     ctx.emojisParaFechas(usadas, ['🏥', '🎓']).join() === '📌,🎂,💍,💳,✈️,🐶');
  ok('sin ocultos, la lista es la de la v31', ctx.emojisParaFechas(usadas).length === 8);

  ctx.datos.prefs = { ...ctx.PREFS_POR_DEFECTO };
  ok('ocultar uno lo anota', ctx.ocultarEmoji('🏥') && ctx.datos.prefs.emojisOcultos.join() === '🏥');
  ok('ocultarlo dos veces no lo repite', !ctx.ocultarEmoji('🏥') && ctx.datos.prefs.emojisOcultos.length === 1);
  // La trampa de la copia superficial: si ocultarEmoji hiciera push, la
  // lista "por defecto" también tendría el 🏥 y cualquier dato nuevo
  // arrancaría con él escondido.
  ok('la lista por defecto no se toca', ctx.PREFS_POR_DEFECTO.emojisOcultos.length === 0);
  ok('mostrarlo lo devuelve', ctx.mostrarEmoji('🏥') && ctx.datos.prefs.emojisOcultos.length === 0);
  ok('mostrar uno que no estaba oculto no hace nada', !ctx.mostrarEmoji('🎂'));
  ok('se guarda en el teléfono', JSON.parse(localStorage.getItem('habitos-app-v1')).prefs.emojisOcultos.length === 0);

  ok('esOtroMes: el mismo mes no es otro', !ctx.esOtroMes({ anio: 2026, mes: 10 }, '2026-10-17'));
  ok('otro mes del mismo año sí', ctx.esOtroMes({ anio: 2026, mes: 12 }, '2026-10-17'));
  ok('el mismo mes de otro año también', ctx.esOtroMes({ anio: 2027, mes: 10 }, '2026-10-17'));
}

console.log(fallos === 0 ? '\n🎉 Todas las pruebas pasaron' : `\n⚠️ ${fallos} fallo(s)`);
process.exit(fallos ? 1 : 0);
