import 'server-only'

import { CIUDADES, clavePrecio, obtenerPrecios, type Servidor } from '@/lib/mercado/aodp'
import {
  esSospechoso,
  impuestos,
  ingresoNeto,
  peorFrescura,
  type Frescura,
} from '@/lib/mercado/economia'
import { createClient } from '@/lib/supabase/server'

/**
 * Qué conviene hacer con lo que se pesca.
 *
 * Un pez tiene dos salidas, y cuál rinde más cambia todo el tiempo con el
 * mercado:
 *
 *   1. Venderlo crudo.
 *   2. Convertirlo en chuletones y vender los chuletones. Cada pez rinde una
 *      cantidad distinta según su tier —de 1 a 14—, y ese número está guardado
 *      en el propio pez porque sale de la receta de T1_FISHCHOPS, que tiene una
 *      variante por pez.
 *
 * La comparación es la respuesta que la pantalla tiene que dar: para cada pez,
 * cuánto deja cada camino y cuál gana.
 *
 * LO QUE NO ENTRA EN LA CUENTA
 *
 *   - El tiempo y el foco de convertir. Convertir es rápido y el foco no tiene
 *     precio de mercado, así que meterlo sería inventar un número.
 *   - Los chuletones también sirven de insumo para comidas y para la salsa de
 *     pescado, que pueden rendir más. Eso es otra cadena y otro cálculo; acá se
 *     compara lo que se puede vender directo.
 */

export type OpcionPesca = {
  itemId: string
  nombre: string
  tier: number | null
  /** 'dulce' o 'salada'. */
  agua: string
  /** Chuletones que rinde una pieza. */
  chops: number
  /** Vender el pez crudo. null si nadie subió su precio. */
  crudo: { precio: number; neto: number; fecha: Date | null } | null
  /** Convertir y vender los chuletones. null si no hay precio de chuletones. */
  convertido: { precioChop: number; neto: number; fecha: Date | null } | null
  /**
   * El precio del crudo se despega tanto del de las otras ciudades que casi
   * seguro es una publicación troll. Se muestra pero no se recomienda.
   */
  sospechoso: boolean
  /** Cuál conviene, o null si falta alguno de los dos. */
  mejor: 'crudo' | 'convertido' | null
  /** Cuánto más deja el mejor camino sobre el otro. */
  diferencia: number | null
  frescura: Frescura
}

export type FiltrosPesca = {
  servidor: Servidor
  premium: boolean
  ciudad: string
}

export type ResultadoPesca = {
  opciones: OpcionPesca[]
  precioChop: number | null
  lotes: number
  fallidos: number
}

/** El id de los chuletones es único: no hay uno por tier. */
const CHOPS = 'T1_FISHCHOPS'

function agua(id: string): string {
  if (id.includes('FRESHWATER')) return 'dulce'
  if (id.includes('SALTWATER')) return 'salada'
  return '—'
}

export async function calcularPesca(
  filtros: FiltrosPesca,
): Promise<ResultadoPesca> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('items')
    .select('id, name, tier, stats')
    .eq('type', 'fish')
    .order('tier')
    .limit(200)

  if (error) throw new Error(error.message)

  // Solo los peces crudos: los chuletones y las salsas también son de tipo
  // 'fish' pero no se pescan, se fabrican.
  const peces = (data ?? []).filter((f) => /_FISH_/.test(f.id))

  /*
    Se piden TODAS las ciudades aunque solo interese una.

    No es por mostrarlas: es para poder comparar. Un precio suelto no se puede
    juzgar —¿once millones por un pez es mucho?—, pero contra el mismo pez en
    las otras cinco ciudades sí. Son treinta y ocho ids, o sea un solo lote,
    así que la comparación sale gratis.
  */
  const { precios, lotes, fallidos } = await obtenerPrecios(
    [...peces.map((p) => p.id), CHOPS],
    {
      servidor: filtros.servidor,
      ciudades: CIUDADES.map((c) => c.consulta),
      calidades: [1],
    },
  )

  // Se vende publicando una orden: impuesto más comisión.
  const imp = impuestos(filtros.premium, true)

  const pChops = precios.get(clavePrecio(CHOPS, filtros.ciudad, 1))
  const precioChop = pChops && pChops.ventaMin > 0 ? pChops.ventaMin : null

  const opciones: OpcionPesca[] = []

  for (const pez of peces) {
    const stats = (pez.stats ?? {}) as Record<string, unknown>
    const chops = Number(stats.chops ?? 0)

    const p = precios.get(clavePrecio(pez.id, filtros.ciudad, 1))

    // El mismo pez en las demás ciudades, para tener contra qué comparar.
    const referencias = CIUDADES.filter((c) => c.nombre !== filtros.ciudad)
      .map((c) => precios.get(clavePrecio(pez.id, c.nombre, 1))?.ventaMin ?? 0)
      .filter((v) => v > 0)

    const sospechoso = p ? esSospechoso(p.ventaMin, referencias) : false

    const crudo =
      p && p.ventaMin > 0
        ? { precio: p.ventaMin, neto: ingresoNeto(p.ventaMin, imp), fecha: p.ventaFecha }
        : null

    const convertido =
      precioChop !== null && chops > 0
        ? {
            precioChop,
            neto: ingresoNeto(precioChop * chops, imp),
            fecha: pChops?.ventaFecha ?? null,
          }
        : null

    let mejor: OpcionPesca['mejor'] = null
    let diferencia: number | null = null
    if (crudo && convertido) {
      // Con un precio sospechoso no se recomienda nada: la comparación estaría
      // decidida por el número inventado.
      if (sospechoso) {
        mejor = null
      } else {
        mejor = convertido.neto > crudo.neto ? 'convertido' : 'crudo'
        diferencia = Math.abs(convertido.neto - crudo.neto)
      }
    }

    opciones.push({
      itemId: pez.id,
      nombre: pez.name,
      tier: pez.tier,
      agua: agua(pez.id),
      chops,
      crudo,
      convertido,
      sospechoso,
      mejor,
      diferencia,
      frescura: peorFrescura([crudo?.fecha ?? null, convertido?.fecha ?? null]),
    })
  }

  /*
    Se ordena por lo que deja el camino recomendado, no por el precio más alto.

    Un pez con precio sospechoso se ordena por su otra salida, la convertida:
    si se ordenara por el número troll, los tres peces de doce millones
    quedarían arriba de todo y la tabla empezaría con las tres filas menos
    confiables.
  */
  opciones.sort((a, b) => {
    const valor = (o: OpcionPesca) =>
      o.sospechoso
        ? (o.convertido?.neto ?? -1)
        : Math.max(o.crudo?.neto ?? -1, o.convertido?.neto ?? -1)
    return valor(b) - valor(a)
  })

  return { opciones, precioChop, lotes, fallidos }
}
