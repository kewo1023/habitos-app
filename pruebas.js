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
eval(logica + '\n; Object.assign(ctx,{hoy,haceNDias,estaHecho,calcularRacha,alternarHoy,agregarHabito,borrarHabito,cargar,claveFecha,esCopiaValida,importar,nombreArchivo,claveDe,diasDelMes,columnaInicio,esFutura,contarMes,alternarFecha}); Object.defineProperty(ctx,"datos",{get:()=>datos});');

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

// --- copia de seguridad
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
