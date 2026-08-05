/* ============================================================
   SERVICE WORKER — el que hace que la app funcione sin internet
   ============================================================
   Es un pequeño programa que el navegador deja corriendo aparte.
   Se pone en medio de la app e internet: guarda una copia de los
   archivos y, si no hay señal, los sirve desde esa copia.

   Estrategia elegida: "primero la red, la copia como respaldo".
   Así, si estás con internet siempre ves la versión más nueva
   (importante mientras estamos cambiando cosas), y si no tienes
   señal la app igual abre.
   ============================================================ */

// Sube este número cada vez que cambies los archivos.
// Es lo que le dice al navegador "hay versión nueva, bótame la vieja".
const VERSION = 'v9';
const CACHE = 'habitos-' + VERSION;

const ARCHIVOS = [
  './',
  './index.html',
  './manifest.json',
  './icono-180.png',
  './icono-192.png',
  './icono-512.png'
];

// 1. Al instalarse: guardar una copia de todo
self.addEventListener('install', ev => {
  ev.waitUntil(
    caches.open(CACHE).then(c => c.addAll(ARCHIVOS)).then(() => self.skipWaiting())
  );
});

// 2. Al activarse: borrar las copias de versiones viejas
self.addEventListener('activate', ev => {
  ev.waitUntil(
    caches.keys()
      .then(nombres => Promise.all(
        nombres.filter(n => n !== CACHE).map(n => caches.delete(n))
      ))
      .then(() => self.clients.claim())
  );
});

// 3. Ante cada petición: intentar la red; si falla, usar la copia
self.addEventListener('fetch', ev => {
  if (ev.request.method !== 'GET') return;

  ev.respondWith(
    fetch(ev.request)
      .then(respuesta => {
        // Guardamos la versión fresca para la próxima vez que no haya señal
        const copia = respuesta.clone();
        // El .catch importa: ahora también pasan por aquí peticiones a otros
        // dominios (la librería de Supabase desde el CDN) y algunas no se
        // pueden guardar. Si falla, da igual: la respuesta ya va en camino.
        caches.open(CACHE).then(c => c.put(ev.request, copia)).catch(() => {});
        return respuesta;
      })
      .catch(() => caches.match(ev.request).then(r => r || caches.match('./index.html')))
  );
});
