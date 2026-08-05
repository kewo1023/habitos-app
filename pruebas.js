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
const logica = trozo('const CLAVE', '/* ---------- E.')
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
let ultimaAlerta = null;
global.alert = m => { ultimaAlerta = m; };
global.confirm = () => true;     // por defecto decimos que sí a todo

const ctx = {};
eval(logica + '\n; Object.assign(ctx,{hoy,haceNDias,estaHecho,calcularRacha,alternarHoy,agregarHabito,borrarHabito,cargar,claveFecha,esCopiaValida,importar,nombreArchivo,claveDe,diasDelMes,columnaInicio,esFutura,contarMes,alternarFecha,fechasDe,totalDias,diasEntre,mejorRacha,fechaInicio,diasDeVida,porcentajeUltimos,renombrarHabito,moverHabito,mensajeDeError,habitoAFila,filasAHabitos,filasARegistros,textoPendientes,encolar,primerEmoji,cambiarEmoji,agregarTarea,alternarTarea,renombrarTarea,borrarTarea,limpiarHechas,tareasOrdenadas,contarTareas,tareasDe,moverALista,editarTarea}); Object.defineProperty(ctx,"datos",{get:()=>datos});');

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

// si el usuario cancela el confirm, no debe pasar nada
global.confirm = () => false;
ctx.importar(JSON.stringify({version:1, habitos:[], registros:{}}));
ok('cancelar la confirmación no borra nada', ctx.datos.habitos.length === 1);
global.confirm = () => true;

// exportar -> importar debe devolver exactamente lo mismo (ida y vuelta)
const antes = JSON.stringify(ctx.datos);
ctx.importar(antes);
ok('exportar e importar no altera los datos', JSON.stringify(ctx.datos) === antes);

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
ok('textoPendientes en uno',   ctx.textoPendientes(1) === '1 cambio esperando señal.');
ok('textoPendientes en varios', ctx.textoPendientes(5) === '5 cambios esperando señal.');

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
ok('la nota se recorta a 500 caracteres',
   ctx.editarTarea(idNota, undefined, 'y'.repeat(700)) && ctx.tareasDe(I)[0].nota.length === 500);
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

// --- los pendientes NO se encolan para la nube (viven solo aquí, por ahora)
ctx.datos.tareas = [];
ctx.datos.pendientes = [];
ctx.agregarTarea('No debe subir a la nube', P);
ctx.agregarTarea('Una idea tampoco', I);
ctx.alternarTarea(ctx.tareasDe(P)[0].id);
ctx.moverALista(ctx.tareasDe(I)[0].id, P);
ok('crear, marcar y mover no encola nada', ctx.datos.pendientes.length === 0);

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

console.log(fallos === 0 ? '\n🎉 Todas las pruebas pasaron' : `\n⚠️ ${fallos} fallo(s)`);
process.exit(fallos ? 1 : 0);
