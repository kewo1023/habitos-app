const fs = require('fs');
const html = fs.readFileSync(__dirname + '/index.html','utf8');

// Extraer solo las secciones A-D (lógica pura, sin DOM)
const script = html.slice(html.lastIndexOf('<script>'), html.lastIndexOf('</script>'));
// Secciones A-D (datos y consultas) + H (copia de seguridad).
// Nos saltamos E-G y J porque tocan la pantalla, y aquí no hay pantalla.
const trozo = (desde, hasta) => script.slice(script.indexOf(desde), script.indexOf(hasta));
const logica = trozo('const CLAVE', '/* ---------- E.')
             + trozo('/* ---------- H. COPIA', '/* ---------- I.');

// Shims mínimos
const store = {};
global.localStorage = { getItem:k=>store[k]??null, setItem:(k,v)=>store[k]=String(v) };
global.crypto = require('crypto').webcrypto;
global.pintar = () => {};        // en el test no dibujamos nada
let ultimaAlerta = null;
global.alert = m => { ultimaAlerta = m; };
global.confirm = () => true;     // por defecto decimos que sí a todo

const ctx = {};
eval(logica + '\n; Object.assign(ctx,{hoy,haceNDias,estaHecho,calcularRacha,alternarHoy,agregarHabito,borrarHabito,cargar,claveFecha,esCopiaValida,importar,nombreArchivo,claveDe,diasDelMes,columnaInicio,esFutura,contarMes,alternarFecha,fechasDe,totalDias,diasEntre,mejorRacha,fechaInicio,diasDeVida,porcentajeUltimos}); Object.defineProperty(ctx,"datos",{get:()=>datos});');

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

console.log(fallos === 0 ? '\n🎉 Todas las pruebas pasaron' : `\n⚠️ ${fallos} fallo(s)`);
process.exit(fallos ? 1 : 0);
