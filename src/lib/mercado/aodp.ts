import 'server-only'

/**
 * Precios de mercado, del Albion Online Data Project.
 *
 * QUÉ ES Y DE DÓNDE SALEN LOS DATOS
 *
 * Albion no publica una API de precios. La que usa todo el mundo la alimentan
 * los propios jugadores: un cliente lee el tráfico del juego mientras alguien
 * pasea por el mercado y lo sube a un servidor común.
 *
 * Eso tiene una consecuencia que atraviesa todo lo que se calcule acá: los
 * datos están incompletos y son viejos en proporción variable. Midiendo 200
 * ítems de equipo:
 *
 *     Black Market   80 % con precio
 *     Lymhurst       48 %
 *     Fort Sterling  41 %
 *     Caerleon       38 %
 *     Bridgewatch    33 %
 *     Martlock       33 %
 *     Thetford       28 %
 *
 * Por eso un 0 significa "nadie subió el precio", NUNCA "vale cero". Tratarlo
 * como precio daría ganancias infinitas y sería la forma más rápida de que
 * alguien pierda plata de verdad siguiendo esta pantalla. Todo lo que sale de
 * acá conserva la fecha del dato para poder mostrarla.
 *
 * LÍMITES MEDIDOS CONTRA LA API REAL
 *
 *     50 ítems  -> 200, 823 ms
 *    100 ítems  -> 200, 272 ms
 *    200 ítems  -> 200, 285 ms
 *    300 ítems  -> 200, 277 ms
 *    400 ítems  -> 414 URI Too Long (8415 caracteres)
 *
 * El corte no es la cantidad de ítems sino el largo de la URL, así que los
 * lotes se arman midiendo caracteres y no elementos.
 */

/** Los tres servidores del juego. Cada uno tiene su propio mercado. */
export const SERVIDORES = {
  europe: 'Europa',
  west: 'Américas',
  east: 'Asia',
} as const

export type Servidor = keyof typeof SERVIDORES

/**
 * Ciudades con mercado.
 *
 * `consulta` es como se la nombra en la URL y `nombre` como vuelve en la
 * respuesta: la API acepta "FortSterling" pero contesta "Fort Sterling".
 */
export const CIUDADES = [
  { consulta: 'Caerleon', nombre: 'Caerleon' },
  { consulta: 'Bridgewatch', nombre: 'Bridgewatch' },
  { consulta: 'FortSterling', nombre: 'Fort Sterling' },
  { consulta: 'Lymhurst', nombre: 'Lymhurst' },
  { consulta: 'Martlock', nombre: 'Martlock' },
  { consulta: 'Thetford', nombre: 'Thetford' },
] as const

export type NombreCiudad = (typeof CIUDADES)[number]['nombre']

export const BLACK_MARKET = 'Black Market'

/** Calidades del juego. La 1 es la abrumadora mayoría de lo que se comercia. */
export const CALIDADES = {
  1: 'Normal',
  2: 'Buena',
  3: 'Excepcional',
  4: 'Excelente',
  5: 'Obra maestra',
} as const

export type Calidad = keyof typeof CALIDADES

export type Precio = {
  itemId: string
  ciudad: string
  calidad: number
  /** Lo más barato que alguien vende. Es lo que se paga por comprar ya. */
  ventaMin: number
  /** Cuándo se vio ese precio. null = nunca. */
  ventaFecha: Date | null
  /** Lo más caro que alguien ofrece comprar. Es lo que se cobra por vender ya. */
  compraMax: number
  compraFecha: Date | null
}

type RespuestaCruda = {
  item_id: string
  city: string
  quality: number
  sell_price_min: number
  sell_price_min_date: string
  buy_price_max: number
  buy_price_max_date: string
}

/** Largo máximo de URL, con margen sobre los 8415 caracteres que dan 414. */
const MAX_URL = 6500

/** Diez minutos. Los precios se mueven despacio y la API tiene límite de uso. */
const SEGUNDOS_CACHE = 600

function fecha(valor: string): Date | null {
  // La API usa 0001-01-01 para "sin dato".
  if (!valor || valor.startsWith('0001')) return null
  const d = new Date(`${valor}Z`)
  return Number.isNaN(d.getTime()) ? null : d
}

/** Divide los ids en lotes que no pasen el largo máximo de URL. */
function armarLotes(ids: string[], largoBase: number): string[][] {
  const lotes: string[][] = []
  let actual: string[] = []
  let largo = largoBase

  for (const id of ids) {
    // +3 por la coma y por los caracteres que encodeURIComponent puede agregar
    // al @ de los encantamientos.
    const suma = id.length + 3
    if (actual.length > 0 && largo + suma > MAX_URL) {
      lotes.push(actual)
      actual = []
      largo = largoBase
    }
    actual.push(id)
    largo += suma
  }

  if (actual.length > 0) lotes.push(actual)
  return lotes
}

export type ResultadoPrecios = {
  /** Clave: `${itemId}|${ciudad}|${calidad}`. */
  precios: Map<string, Precio>
  /** Cuántos lotes se pidieron y cuántos fallaron. Se muestra al usuario. */
  lotes: number
  fallidos: number
}

export function clavePrecio(itemId: string, ciudad: string, calidad: number) {
  return `${itemId}|${ciudad}|${calidad}`
}

/**
 * Pide precios para una lista de ítems.
 *
 * Los lotes se piden en serie y no en paralelo: la API es gratuita y tiene
 * límite por IP, y todo esto corre en un Worker compartido por el gremio
 * entero. Un lote tarda menos de 300 ms, así que veintisiete lotes —el
 * catálogo completo de equipo— son unos ocho segundos, que con el cache de
 * diez minutos se pagan una vez.
 *
 * Un lote que falla no tira abajo el resto: se cuenta y se sigue. Es preferible
 * mostrar el 90 % de los datos avisando que faltó algo, que una pantalla de
 * error porque un pedido dio 503.
 */
export async function obtenerPrecios(
  ids: string[],
  opciones: {
    servidor: Servidor
    ciudades: readonly string[]
    calidades?: readonly number[]
  },
): Promise<ResultadoPrecios> {
  const { servidor, ciudades, calidades = [1] } = opciones

  const unicos = [...new Set(ids.filter(Boolean))]
  const precios = new Map<string, Precio>()
  if (unicos.length === 0) return { precios, lotes: 0, fallidos: 0 }

  const base = `https://${servidor}.albion-online-data.com/api/v2/stats/prices/`
  const cola = `?locations=${ciudades.join(',')}&qualities=${calidades.join(',')}`
  const lotes = armarLotes(unicos, base.length + cola.length)

  let fallidos = 0

  for (const lote of lotes) {
    const url = `${base}${lote.map(encodeURIComponent).join(',')}${cola}`

    try {
      const respuesta = await fetch(url, {
        // El cache de Next: el mismo lote pedido por otro usuario dentro de la
        // ventana no vuelve a salir a internet.
        next: { revalidate: SEGUNDOS_CACHE },
        headers: { Accept: 'application/json' },
      })

      if (!respuesta.ok) {
        fallidos++
        continue
      }

      const datos = (await respuesta.json()) as RespuestaCruda[]

      for (const d of datos) {
        precios.set(clavePrecio(d.item_id, d.city, d.quality), {
          itemId: d.item_id,
          ciudad: d.city,
          calidad: d.quality,
          ventaMin: d.sell_price_min > 0 ? d.sell_price_min : 0,
          ventaFecha: fecha(d.sell_price_min_date),
          compraMax: d.buy_price_max > 0 ? d.buy_price_max : 0,
          compraFecha: fecha(d.buy_price_max_date),
        })
      }
    } catch {
      // Red caída o timeout: se cuenta y se sigue con el resto.
      fallidos++
    }
  }

  return { precios, lotes: lotes.length, fallidos }
}
