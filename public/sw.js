/*
  Service worker: guarda los iconos de Albion en el navegador.

  POR QUÉ NO COOKIES

  Una cookie guarda unos pocos kilobytes de texto y —esto es lo importante— se
  manda en CADA pedido al servidor. Meter imágenes ahí no solo no entra: haría
  más lenta toda la navegación. Las cookies son para identificar una sesión, no
  para guardar archivos.

  QUÉ HAY YA SIN ESTO

  La ruta /icono responde con `Cache-Control: max-age=31536000, immutable`, así
  que el navegador ya guarda cada icono un año y el borde de Cloudflare lo sirve
  sin volver a salir a internet. Eso es lo que hace que la segunda visita sea
  rápida.

  QUÉ AGREGA ESTO

  Dos cosas que la caché HTTP no da:

    - El navegador desaloja su caché cuando le falta espacio, y con miles de
      iconos chiquitos es de lo primero que tira. La Cache Storage es explícita:
      no se vacía sola.
    - Sirve sin conexión. Una build ya vista se ve completa aunque se corte
      internet.

  ALCANCE

  Solo intercepta GET a /icono/. Para cualquier otra cosa ni siquiera llama a
  respondWith, así que el resto de la aplicación —la sesión, los datos, las
  acciones— pasa derecho a la red como si este archivo no existiera. Un service
  worker que se mete con todo es una forma muy efectiva de servir una versión
  vieja del sitio durante días.
*/

const CACHE = 'iconos-albion-v1'

/**
 * Tope de iconos guardados. Cada uno pesa entre 8 y 30 KB, así que 1500 son
 * unos 25 MB en el peor caso: bastante por debajo de lo que cualquier navegador
 * asigna, y suficiente para todo el equipamiento que un gremio usa de verdad.
 */
const MAXIMO = 1500

self.addEventListener('install', () => {
  // Sin esto el worker nuevo espera a que se cierren todas las pestañas
  // abiertas para activarse.
  self.skipWaiting()
})

self.addEventListener('activate', (evento) => {
  evento.waitUntil(
    (async () => {
      // Al subir la versión del nombre, las cachés viejas quedan huérfanas
      // ocupando lugar.
      const nombres = await caches.keys()
      await Promise.all(
        nombres
          .filter((n) => n.startsWith('iconos-albion-') && n !== CACHE)
          .map((n) => caches.delete(n)),
      )
      await self.clients.claim()
    })(),
  )
})

/** Cache Storage devuelve las claves en orden de inserción: las primeras son las más viejas. */
async function recortar(cache) {
  const claves = await cache.keys()
  if (claves.length <= MAXIMO) return
  const sobran = claves.length - MAXIMO
  for (let i = 0; i < sobran; i++) await cache.delete(claves[i])
}

self.addEventListener('fetch', (evento) => {
  const peticion = evento.request
  if (peticion.method !== 'GET') return

  const url = new URL(peticion.url)
  if (url.origin !== self.location.origin) return
  if (!url.pathname.startsWith('/icono/')) return

  evento.respondWith(
    (async () => {
      const cache = await caches.open(CACHE)

      const guardado = await cache.match(peticion)
      if (guardado) return guardado

      const respuesta = await fetch(peticion)

      /*
        Solo se guarda el 200. El 404 se deja pasar sin cachear porque ya lleva
        su propio Cache-Control corto: si Albion agrega el arte que falta,
        aparece al día siguiente en vez de quedar clavado acá para siempre.
      */
      if (respuesta.ok) {
        await cache.put(peticion, respuesta.clone())
        // No se espera: recortar puede tardar y el icono ya está listo.
        recortar(cache)
      }

      return respuesta
    })(),
  )
})
