import { type NextRequest } from 'next/server'

import { TAMANOS_ICONO } from '@/lib/domain/albion'

/**
 * Proxy de iconos de Albion.
 *
 * POR QUÉ EXISTE
 *
 * render.albiononline.com falla de forma intermitente. Medido contra el
 * catálogo real, un pedido suelto devuelve 502 cada tantas veces sin ningún
 * patrón: el mismo identificador da 502 y al reintentar da 200.
 *
 *   CHANNELED_RUN -> 502 200 200 200 200
 *
 * Eso no se notaba con un icono, pero la pantalla de builds abre un slot y
 * pide dieciséis habilidades de golpe. Con ~10 % de fallas, casi siempre
 * quedaba alguna en blanco. Es exactamente lo que se ve en el panel: varias
 * habilidades mostrando las tres primeras letras en vez del arte.
 *
 * El 404, en cambio, sí es definitivo: identifica arte que no existe.
 *
 *   /v1/spell/NOEXISTE_XYZ.png -> 404
 *
 * QUÉ HACE
 *
 *   - reintenta los 5xx, que es todo lo que hacía falta para el 502;
 *   - responde con cache de un año, así el navegador y el borde de Cloudflare
 *     sirven el icono sin volver a salir a internet;
 *   - propaga el 404 tal cual, para que el componente muestre su reemplazo con
 *     el nombre del ítem en vez de un icono roto.
 *
 * Los identificadores se validan contra una lista blanca de caracteres antes de
 * armar la URL de destino. Sin eso, una ruta que hace fetch con algo que viene
 * del pedido es un SSRF: bastaría pedir /icono/item/..%2f..%2f para que el
 * Worker fuera a buscar cualquier otra cosa.
 */

const RENDER = 'https://render.albiononline.com/v1'

/** Mayúsculas, dígitos y guión bajo, con un @0..4 opcional para el encantamiento. */
const ID_ITEM = /^[A-Z0-9_]{1,120}(@[0-4])?$/
const ID_HECHIZO = /^[A-Z0-9_]{1,120}$/

const TAMANOS_VALIDOS: number[] = Object.values(TAMANOS_ICONO)

const INTENTOS = 3

/** Un año. El arte de un ítem no cambia; si cambia, cambia el identificador. */
const CACHE_OK = 'public, max-age=31536000, s-maxage=31536000, immutable'

/**
 * Un día para el 404. Corto a propósito: si Albion agrega el arte que falta,
 * aparece solo al día siguiente en vez de quedar clavado un año.
 */
const CACHE_FALTA = 'public, max-age=86400, s-maxage=86400'

async function traerConReintentos(url: string): Promise<Response | null> {
  for (let intento = 0; intento < INTENTOS; intento++) {
    try {
      const respuesta = await fetch(url)

      // 404: no hay arte. Es definitivo, no tiene sentido reintentar.
      if (respuesta.status === 404) return respuesta
      if (respuesta.ok) return respuesta

      // 5xx y 429: transitorios.
    } catch {
      // Error de red: se trata igual que un 5xx.
    }

    if (intento < INTENTOS - 1) {
      await new Promise((r) => setTimeout(r, 150 * (intento + 1)))
    }
  }

  return null
}

export async function GET(
  peticion: NextRequest,
  { params }: { params: Promise<{ tipo: string; nombre: string }> },
) {
  const { tipo, nombre } = await params

  if (tipo !== 'item' && tipo !== 'hechizo') {
    return new Response('Tipo desconocido', { status: 404 })
  }

  // El .png final es cosmético: hace que la URL se vea como una imagen y que
  // el matcher del proxy la saltee, pero el identificador es lo de antes.
  const identificador = decodeURIComponent(nombre).replace(/\.png$/i, '')

  const patron = tipo === 'item' ? ID_ITEM : ID_HECHIZO
  if (!patron.test(identificador)) {
    return new Response('Identificador inválido', { status: 400 })
  }

  const pedido = Number(peticion.nextUrl.searchParams.get('s'))
  const tamano = TAMANOS_VALIDOS.includes(pedido) ? pedido : TAMANOS_ICONO.chico

  const ruta = tipo === 'item' ? 'item' : 'spell'
  const destino = `${RENDER}/${ruta}/${encodeURIComponent(identificador)}.png?size=${tamano}`

  const respuesta = await traerConReintentos(destino)

  if (!respuesta) {
    // Se agotaron los reintentos. No es "no existe", así que no se cachea:
    // el próximo pedido vuelve a intentar.
    return new Response('El servicio de iconos no responde', {
      status: 502,
      headers: { 'Cache-Control': 'no-store' },
    })
  }

  if (respuesta.status === 404) {
    return new Response('Sin icono', {
      status: 404,
      headers: { 'Cache-Control': CACHE_FALTA },
    })
  }

  return new Response(respuesta.body, {
    status: 200,
    headers: {
      'Content-Type': respuesta.headers.get('content-type') ?? 'image/png',
      'Cache-Control': CACHE_OK,
    },
  })
}
