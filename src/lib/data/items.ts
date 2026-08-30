import 'server-only'

import type { DatosItem } from '@/lib/domain/calculo'
import { createClient } from '@/lib/supabase/server'

const CAMPOS = 'id, name, tier, item_power, two_handed, enchantments, stats'

/**
 * Datos vivos de un conjunto de ítems, indexados por id.
 *
 * Las builds guardan solo id, nombre y encantamiento. Las stats se leen acá, en
 * el momento de mostrar, para que un rebalanceo del juego se refleje en las
 * builds ya guardadas en vez de dejarlas mostrando una foto vieja.
 *
 * Se consulta en tandas: PostgREST corta en 1000 filas y un `.in()` con
 * demasiados valores además hace crecer la URL más allá de lo razonable.
 */
export async function obtenerDatosDeItems(
  ids: string[],
): Promise<Map<string, DatosItem>> {
  const unicos = [...new Set(ids.filter(Boolean))]
  const porId = new Map<string, DatosItem>()
  if (unicos.length === 0) return porId

  const supabase = await createClient()
  const TANDA = 200

  for (let i = 0; i < unicos.length; i += TANDA) {
    const { data, error } = await supabase
      .from('items')
      .select(CAMPOS)
      .in('id', unicos.slice(i, i + TANDA))

    if (error) throw new Error(error.message)

    for (const fila of data ?? []) {
      porId.set(fila.id, {
        id: fila.id,
        name: fila.name,
        tier: fila.tier,
        item_power: fila.item_power,
        two_handed: fila.two_handed,
        enchantments: (fila.enchantments ?? {}) as Record<string, number>,
        stats: (fila.stats ?? {}) as Record<string, number>,
      })
    }
  }

  return porId
}
