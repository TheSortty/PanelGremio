import 'server-only'

import {
  BLACK_MARKET,
  CIUDADES,
  clavePrecio,
  obtenerPrecios,
  type Calidad,
  type Servidor,
} from '@/lib/mercado/aodp'
import {
  esSospechoso,
  impuestos,
  operacion,
  peorFrescura,
  type Frescura,
  type Operacion,
} from '@/lib/mercado/economia'
import type { Enums } from '@/lib/db/database.types'
import { createClient } from '@/lib/supabase/server'

/**
 * Comprar en una ciudad, vender en el Black Market.
 *
 * CÓMO FUNCIONA EL NEGOCIO
 *
 * El Black Market es un NPC que pone órdenes de compra por equipo, para
 * alimentar el botín de las mazmorras. Paga más que el mercado por algunas
 * piezas y bastante menos por otras. La operación es: comprar barato en una
 * ciudad, cruzar a Caerleon, y vender contra esa orden.
 *
 * Los dos precios que importan, y por qué esos:
 *
 *   costo    = venta mínima en la ciudad. Es lo que se paga por comprar YA,
 *              tomando la orden de venta más barata. No se usa la orden de
 *              compra: esa es para vender, no para comprar.
 *   ingreso  = compra máxima en el Black Market. Es lo que se cobra por vender
 *              YA contra la orden de compra del NPC. No se usa la venta
 *              mínima del Black Market: ahí casi no hay órdenes de venta y el
 *              número no representa nada.
 *
 * Confundir cuál va de cada lado es el error clásico: da márgenes enormes que
 * no existen.
 *
 * LO QUE ESTE CÁLCULO NO PUEDE SABER
 *
 *   - Cuántas unidades acepta la orden del Black Market. La API no publica la
 *     cantidad, así que un margen enorme puede ser por UNA sola pieza.
 *   - Si el precio sigue vigente. Los datos los suben jugadores paseando por
 *     el mercado; por eso cada fila lleva la antigüedad del peor de sus dos
 *     precios.
 *   - El riesgo de cruzar a Caerleon, que es zona roja.
 *
 * Las tres cosas se avisan en la pantalla. Un calculador que las esconde
 * fabrica confianza que no corresponde.
 */

export type Oportunidad = {
  itemId: string
  nombre: string
  tipo: string
  tier: number | null
  encantamiento: number
  ciudad: string
  precioCiudad: number
  precioBlackMarket: number
  operacion: Operacion
  frescura: Frescura
}

export type Filtros = {
  servidor: Servidor
  calidad: Calidad
  premium: boolean
  /** Tier a mirar, o null para todos. */
  tier: number | null
  /** Ciudad de compra, o null para la más barata de todas. */
  ciudad: string | null
  limite: number
}

export type ResultadoFlipper = {
  oportunidades: Oportunidad[]
  /** Cuántas variantes se consultaron y cuántas tenían los dos precios. */
  consultadas: number
  conDatos: number
  lotes: number
  fallidos: number
}

const TIPOS_EQUIPO: Enums<'item_type'>[] = [
  'weapon',
  'offhand',
  'helmet',
  'chest',
  'boots',
  'cape',
]

type FilaItem = {
  id: string
  name: string
  type: string
  tier: number | null
  enchantments: unknown
}

/** Trae el equipo del catálogo, paginado: PostgREST corta en 1000 y no avisa. */
async function equipoDelCatalogo(tier: number | null): Promise<FilaItem[]> {
  const supabase = await createClient()
  const filas: FilaItem[] = []

  for (let desde = 0; ; desde += 1000) {
    let consulta = supabase
      .from('items')
      .select('id, name, type, tier, enchantments')
      .in('type', TIPOS_EQUIPO)
      .eq('icon_ok', true)
      .gte('tier', 4)
      .range(desde, desde + 999)

    if (tier !== null) consulta = consulta.eq('tier', tier)

    const { data, error } = await consulta
    if (error) throw new Error(error.message)
    if (!data?.length) break

    filas.push(...(data as FilaItem[]))
    if (data.length < 1000) break
  }

  return filas
}

/**
 * Las variantes que se pueden comerciar de un ítem.
 *
 * Un encantamiento es un ítem distinto en el mercado —T8_MAIN_SWORD y
 * T8_MAIN_SWORD@3 tienen su propio precio—, y los encantados suelen ser los
 * que más paga el Black Market, así que hay que mirarlos.
 */
function variantes(item: FilaItem): { id: string; encantamiento: number }[] {
  const salida = [{ id: item.id, encantamiento: 0 }]

  const niveles =
    item.enchantments && typeof item.enchantments === 'object'
      ? Object.keys(item.enchantments as Record<string, unknown>)
      : []

  for (const nivel of niveles) {
    const n = Number(nivel)
    if (n > 0) salida.push({ id: `${item.id}@${n}`, encantamiento: n })
  }

  return salida
}

export async function buscarOportunidades(
  filtros: Filtros,
): Promise<ResultadoFlipper> {
  const items = await equipoDelCatalogo(filtros.tier)

  const porVariante = new Map<string, { item: FilaItem; encantamiento: number }>()
  for (const item of items) {
    for (const v of variantes(item)) {
      porVariante.set(v.id, { item, encantamiento: v.encantamiento })
    }
  }

  const ciudadesAPedir =
    filtros.ciudad === null
      ? CIUDADES.map((c) => c.consulta)
      : [CIUDADES.find((c) => c.nombre === filtros.ciudad)?.consulta ?? 'Caerleon']

  const { precios, lotes, fallidos } = await obtenerPrecios([...porVariante.keys()], {
    servidor: filtros.servidor,
    ciudades: [...ciudadesAPedir, 'BlackMarket'],
    calidades: [filtros.calidad],
  })

  // Vender contra una orden de compra que ya existe no paga comisión de
  // publicación, solo el impuesto de venta.
  const imp = impuestos(filtros.premium, false)

  const ciudadesPosibles =
    filtros.ciudad === null ? CIUDADES.map((c) => c.nombre) : [filtros.ciudad]

  const oportunidades: Oportunidad[] = []
  let conDatos = 0

  for (const [varianteId, { item, encantamiento }] of porVariante) {
    const bm = precios.get(clavePrecio(varianteId, BLACK_MARKET, filtros.calidad))
    // Sin orden de compra en el Black Market no hay a quién venderle.
    if (!bm || bm.compraMax <= 0) continue

    // De todas las ciudades, la que lo vende más barato.
    let mejor: { ciudad: string; precio: number; fecha: Date | null } | null = null

    for (const ciudad of ciudadesPosibles) {
      const p = precios.get(clavePrecio(varianteId, ciudad, filtros.calidad))
      if (!p || p.ventaMin <= 0) continue
      if (!mejor || p.ventaMin < mejor.precio) {
        mejor = { ciudad, precio: p.ventaMin, fecha: p.ventaFecha }
      }
    }

    if (!mejor) continue
    conDatos++

    /*
      La orden del Black Market también puede ser una publicación absurda, y
      del lado que más duele: infla el ingreso y fabrica una oportunidad que no
      existe. Se compara contra lo que el mismo ítem vale en las ciudades. Con
      una sola ciudad elegida no hay con qué comparar y no se descarta nada:
      preferible no afirmar a afirmar mal.
    */
    const referencias = ciudadesPosibles
      .map((c) => precios.get(clavePrecio(varianteId, c, filtros.calidad))?.ventaMin ?? 0)
      .filter((v) => v > 0)

    if (referencias.length >= 2 && esSospechoso(bm.compraMax, referencias)) continue

    const op = operacion(mejor.precio, bm.compraMax, imp)
    // Solo interesa lo que deja plata. Lo que da pérdida es la mayoría del
    // catálogo y llenaría la tabla de ruido.
    if (op.ganancia <= 0) continue

    oportunidades.push({
      itemId: varianteId,
      nombre: item.name,
      tipo: item.type,
      tier: item.tier,
      encantamiento,
      ciudad: mejor.ciudad,
      precioCiudad: mejor.precio,
      precioBlackMarket: bm.compraMax,
      operacion: op,
      frescura: peorFrescura([mejor.fecha, bm.compraFecha]),
    })
  }

  oportunidades.sort((a, b) => b.operacion.ganancia - a.operacion.ganancia)

  return {
    oportunidades: oportunidades.slice(0, filtros.limite),
    consultadas: porVariante.size,
    conDatos,
    lotes,
    fallidos,
  }
}
