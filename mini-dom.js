/* ============================================================================
   MINI-DOM — un navegador de mentira, en unas 150 líneas
   ----------------------------------------------------------------------------
   `pruebas.js` comprueba la LÓGICA: que la racha cuente bien, que las fechas
   no se corran un día, que las dos tablas de textos estén completas. Todo eso
   se puede probar sin pantalla.

   Lo que NO puede probar es la APP: que al cambiar de idioma se repinte todo,
   que el saludo use tu nombre, que el botón de abajo diga lo que toca en cada
   sección. Para eso hace falta un navegador, y node no trae uno.

   Lo normal sería usar `jsdom`, pero no está disponible en el entorno donde se
   escribe este proyecto (el mismo problema que en la app de propinas, de donde
   viene este archivo). Así que aquí hay una imitación mínima: solo lo que la
   app usa de verdad — getElementById, createElement, classList, appendChild,
   querySelector por clase y poco más.

   Lo que NO es: no calcula estilos, no hace layout y solo entiende del HTML
   que le metas por `innerHTML` las etiquetas y sus clases, no el texto suelto.
   Sirve para probar comportamiento, no apariencia. Lo visual se prueba
   mirando el teléfono, y no hay atajo.

   No hace falta tocarlo. Se usa desde `pruebas-app.js`.
   ========================================================================== */

const sinTags = s => String(s).replace(/<[^>]*>/g, ' ');

class El {
  constructor(tag) {
    this.tagName = (tag || 'div').toUpperCase();
    this.children = [];       // los que se añaden con appendChild
    this._hijosHtml = [];     // los que salen de parsear un innerHTML
    this._value = ''; this.style = {}; this.dataset = {};
    this._text = ''; this._html = ''; this._classes = new Set();
    this._lis = {}; this.onclick = null; this.onchange = null; this.onsubmit = null;
    this.type = ''; this.disabled = false; this.hidden = false;
    this.placeholder = ''; this._attrs = {};
  }

  // El navegador convierte a texto cualquier cosa que se asigne a .value.
  get value() { return this._value; }
  set value(v) { this._value = v === null || v === undefined ? '' : String(v); }

  get classList() {
    const c = this._classes;
    return {
      add: (...n) => n.forEach(x => c.add(x)),
      remove: (...n) => n.forEach(x => c.delete(x)),
      contains: n => c.has(n),
      toggle: (n, f) => { const on = f === undefined ? !c.has(n) : f;
                          on ? c.add(n) : c.delete(n); return on; }
    };
  }
  get className() { return [...this._classes].join(' '); }
  set className(v) { this._classes = new Set(String(v).split(/\s+/).filter(Boolean)); }

  set textContent(v) {
    this._text = String(v); this._html = '';
    this.children = []; this._hijosHtml = [];
  }
  get textContent() {
    return this._text + sinTags(this._html)
         + [...this.children, ...this._hijosHtml].map(c => c.textContent).join(' ');
  }

  /* Al escribir innerHTML, el navegador de verdad construye elementos. Aquí se
     hace una versión pobre: se fabrica un elemento por cada etiqueta de
     apertura, con sus clases. Queda plano (sin anidar), que es suficiente
     porque querySelector aquí solo busca por clase. */
  set innerHTML(v) {
    this._html = String(v);
    this._text = '';
    this.children = [];
    this._hijosHtml = [];
    const re = /<(\w+)([^>]*)>/g;
    let m;
    while ((m = re.exec(this._html))) {
      const hijo = new El(m[1]);
      const cls = /class="([^"]*)"/.exec(m[2]);
      if (cls) hijo.className = cls[1];
      const di = /data-i="([^"]*)"/.exec(m[2]);
      if (di) hijo.dataset.i = di[1];
      this._hijosHtml.push(hijo);
    }
  }
  get innerHTML() { return this._html; }

  setAttribute(n, v) {
    this._attrs[n] = String(v);
    if (n === 'placeholder') this.placeholder = String(v);
  }
  getAttribute(n) { return this._attrs[n]; }

  appendChild(c) { this.children.push(c); return c; }
  append(...cs) { cs.forEach(c => this.children.push(c)); }
  addEventListener(t, fn) { (this._lis[t] = this._lis[t] || []).push(fn); }
  dispatchEvent(e) { (this._lis[e.type] || []).forEach(fn => fn(e)); }
  click() { if (this.onclick) this.onclick({ target: this, stopPropagation(){} }); }
  focus() { this._enfocado = true; }

  descendientes() {
    return [...this.children, ...this._hijosHtml]
             .flatMap(c => [c, ...c.descendientes()]);
  }
  querySelectorAll(sel) {
    const clases = sel.trim().split('.').filter(Boolean);
    return this.descendientes().filter(el => clases.every(c => el._classes.has(c)));
  }
  querySelector(sel) { return this.querySelectorAll(sel)[0] || null; }
}

/**
 * Crea un documento a partir del HTML: busca las etiquetas con `id` o con
 * alguna marca de traducción y fabrica un elemento por cada una. Las demás no
 * hacen falta, porque la app nunca las busca.
 */
function crearDocumento(html) {
  const porId = {};
  const todos = [];
  let titulo = null;

  const re = /<(\w+)([^>]*)>/g;
  let m;
  while ((m = re.exec(html))) {
    const atributos = m[2];
    const id   = /\bid="([^"]+)"/.exec(atributos);
    const dt   = /\bdata-t="([^"]+)"/.exec(atributos);
    const dph  = /\bdata-ph="([^"]+)"/.exec(atributos);
    const dar  = /\bdata-aria="([^"]+)"/.exec(atributos);
    const cls  = /class="([^"]*)"/.exec(atributos);
    const esTitulo = cls && cls[1].split(/\s+/).includes('titulo');
    if (!id && !dt && !dph && !dar && !esTitulo) continue;

    const el = new El(m[1]);
    if (cls) el.className = cls[1];
    if (dt)  el.dataset.t = dt[1];
    if (dph) el.dataset.ph = dph[1];
    if (dar) el.dataset.aria = dar[1];
    if (id)  porId[id[1]] = el;
    if (esTitulo) titulo = el;
    todos.push(el);
  }

  const raiz = new El('html');
  raiz.dataset = {};
  const body = new El('body');
  const meta = new El('meta');   // el <meta name="theme-color">

  const conDescendientes = () => todos.flatMap(e => [e, ...e.descendientes()]);

  return {
    documentElement: raiz,
    body,
    title: '',
    _meta: meta,
    addEventListener: () => {},
    getElementById: id => porId[id] || null,
    createElement: t => new El(t),
    querySelector: sel => {
      if (sel.includes('theme-color')) return meta;
      if (sel === '.titulo') return titulo;
      const clases = sel.trim().split('.').filter(Boolean);
      return conDescendientes().find(el => clases.every(c => el._classes.has(c))) || null;
    },
    querySelectorAll(sel) {
      sel = sel.trim();
      const atributo = /^\[data-(\w+)\]$/.exec(sel);
      if (atributo) {
        const clave = atributo[1];
        return conDescendientes().filter(el => el.dataset[clave] !== undefined);
      }
      const clases = sel.split('.').filter(Boolean);
      return conDescendientes().filter(el => clases.every(c => el._classes.has(c)));
    }
  };
}

module.exports = { El, crearDocumento, sinTags };
