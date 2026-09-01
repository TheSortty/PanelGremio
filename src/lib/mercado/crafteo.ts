import 'server-only'

import {
  CIUDADES,
  clavePrecio,
  obtenerPrecios,
  type Servidor,
} from '@/lib/mercado/aodp'
import {
  impuestos,
  operacion,
  peorFrescura,
  type Frescura,
  type Operacion,
} from '@/lib/mercado/economia'
import type { Enums } from '@/lib/db/database.types'
import { createClient } from '@/lib/supabase/server'

/**
 * Cuánto deja craftear cada cosa.
 *
 * LA CUENTA
 *
 *   costo    = Σ (precio del material × cantidad) × (1 − retorno) + tarifa
 *   ingreso  = precio de venta del ítem − impuestos
 *   ganancia = ingreso − costo
 *
 * El factor (1 − retorno) es la parte que la gente olvida y la que decide si un
 * crafteo deja o no: al fabricar, una fracción de los materiales vuelve al
 * inventario. Ignorarlo sobreestima el costo entre un 15 % y un 44 % según
 * dónde y cómo se craftee, y hace descartar crafteos que sí eran rentables.
 *
 * QUÉ NO CONTEMPLA
 *
 *   - El foco. Es un recurso que se regenera solo y no tiene precio de mercado,
 *     así que no se puede convertir a plata sin inventar un número. Se muestra
 *     cuánto foco cuesta y se deja que quien mire decida si le rinde gastarlo.
 *   - La tarifa de la estación, que la fija cada dueño y cambia todo el tiempo.
 *     Es un parámetro de la pantalla, con 0 por defecto.
 *   - La calidad del resultado: craftear puede dar una pieza de calidad
 *     superior, que vale más. Eso solo mejora el número real respecto de este.
 */

export type Receta = {
  silver: number
  focus: number
  amount: number
  resources: { id: string; count: number }[]
}

export type Crafteo = {
  itemId: string
  nombre: string
  tipo: string
  tier: number | null
  /** Dónde conviene comprar los materiales y dónde vender el producto. */
  ciudad: string
  materiales: {
    id: string
    nombre: string
    cantidad: number
    precioUnidad: number
    subtotal: number
  }[]
  focoTotal: number
  precioVenta: number
  operacion: Operacion
  /** Plata de ganancia por cada punto de foco. Null si la receta no usa foco. */
  porFoco: number | null
  frescura: Frescura
}

export type FiltrosCrafteo = {
  servidor: Servidor
  premium: boolean
  tier: number
  ciudad: string
  /** Fracción de materiales que vuelve. Ver RETORNO en economia.ts. */
  retorno: number
  tipos: readonly Enums<'item_type'>[]
  limite: number
}

export type ResultadoCrafteo = {
  crafteos: Crafteo[]
  evaluados: number
  conDatos: number
  lotes: number
  fallidos: number
}

type FilaItem = {
  id: string
  name: string
  type: string
  tier: number | null
  crafting: unknown
}

function comoReceta(valor: unknown): Receta | null {
  if (!valor || typeof valor !== 'object') return null
  const r = valor as Record<string, unknown>
  if (!Array.isArray(r.resources) || r.resources.length === 0) return null

  const resources = r.resources
    .map((x) => {
      const o = x as Record<string, unknown>
      return { id: String(o.id ?? ''), count: Number(o.count ?? 0) }
    })
    .filter((x) => x.id && x.count > 0)

  if (resources.length === 0) return null

  return {
    silver: Number(r.silver ?? 0) || 0,
    focus: Number(r.focus ?? 0) || 0,
    amount: Number(r.amount ?? 1) || 1,
    resources,
  }
}

export async function calcularCrafteos(
  filtros: FiltrosCrafteo,
): Promise<ResultadoCrafteo> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('items')
    .select('id, name, type, tier, crafting')
    .in('type', filtros.tipos)
    .eq('tier', filtros.tier)
    .not('crafting', 'is', null)
    .limit(1000)

  if (error) throw new Error(error.message)

  const items = (data as FilaItem[]).flatMap((it) => {
    const receta = comoReceta(it.crafting)
    return receta ? [{ ...it, receta }] : []
  })

  // Los materiales de todas las recetas, más los productos: se piden juntos en
  // la misma tanda de lotes en vez de dos rondas.
  const idsMateriales = new Set<string>()
  for (const it of items) for (const r of it.receta.resources) idsMateriales.add(r.id)

  const ciudadConsulta =
    CIUDADES.find((c) => c.nombre === filtros.ciudad)?.consulta ?? 'Caerleon'

  const { precios, lotes, fallidos } = await obtenerPrecios(
    [...idsMateriales, ...items.map((i) => i.id)],
    { servidor: filtros.servidor, ciudades: [ciudadConsulta], calidades: [1] },
  )

  // Craftear y publicar la orden de venta: se paga impuesto y comisión.
  const imp = impuestos(filtros.premium, true)

  const nombresMateriales = new Map<string, string>()
  {
    const ids = [...idsMateriales]
    for (let i = 0; i < ids.length; i += 200) {
      const { data: mats } = await supabase
        .from('items')
        .select('id, name')
        .in('id', ids.slice(i, i + 200))
      for (const m of mats ?? []) nombresMateriales.set(m.id, m.name)
    }
  }

  const crafteos: Crafteo[] = []
  let conDatos = 0

  for (const item of items) {
    const producto = precios.get(clavePrecio(item.id, filtros.ciudad, 1))
    if (!producto || producto.ventaMin <= 0) continue

    const materiales: Crafteo['materiales'] = []
    const fechas: (Date | null)[] = [producto.ventaFecha]
    let costoMateriales = 0
    let completo = true

    for (const recurso of item.receta.resources) {
      const p = precios.get(clavePrecio(recurso.id, filtros.ciudad, 1))
      // Sin precio de un material no se puede calcular el costo. Estimarlo con
      // otro tier o con un promedio daría un número inventado.
      if (!p || p.ventaMin <= 0) {
        completo = false
        break
      }

      const subtotal = p.ventaMin * recurso.count
      costoMateriales += subtotal
      fechas.push(p.ventaFecha)
      materiales.push({
        id: recurso.id,
        nombre: nombresMateriales.get(recurso.id) ?? recurso.id,
        cantidad: recurso.count,
        precioUnidad: p.ventaMin,
        subtotal,
      })
    }

    if (!completo) continue
    conDatos++

    // El retorno se aplica sobre los materiales, no sobre la tarifa.
    const costo = costoMateriales * (1 - filtros.retorno) + item.receta.silver
    // Una tanda puede rendir varias unidades: el ingreso se multiplica.
    const op = operacion(costo, producto.ventaMin * item.receta.amount, imp)

    crafteos.push({
      itemId: item.id,
      nombre: item.name,
      tipo: item.type,
      tier: item.tier,
      ciudad: filtros.ciudad,
      materiales,
      focoTotal: item.receta.focus,
      precioVenta: producto.ventaMin,
      operacion: op,
      porFoco: item.receta.focus > 0 ? op.ganancia / item.receta.focus : null,
      frescura: peorFrescura(fechas),
    })
  }

  crafteos.sort((a, b) => b.operacion.ganancia - a.operacion.ganancia)

  return {
    crafteos: crafteos.slice(0, filtros.limite),
    evaluados: items.length,
    conDatos,
    lotes,
    fallidos,
  }
}
