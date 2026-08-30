'use server'

import { GoogleGenAI } from '@google/genai'
import { revalidatePath } from 'next/cache'

import { exigirMiembroActivo } from '@/lib/auth/sesion'
import { obtenerBuild } from '@/lib/data/builds'
import {
  NOMBRES_SLOT,
  SLOTS_EQUIPO,
  claveHabilidad,
  type Build,
  type SpellSlot,
} from '@/lib/domain/builds'
import { createClient } from '@/lib/supabase/server'

const MODELO = process.env.GEMINI_MODEL?.trim() || 'gemini-2.5-flash'
const ORDEN_SLOTS: SpellSlot[] = ['Q', 'W', 'E', 'Passive']

export type ResultadoGuia =
  | { ok: true; guia: string }
  | { ok: false; error: string }

/** ¿Está configurada la IA? Lo consulta la página para no mostrar un botón muerto. */
export async function iaDisponible(): Promise<boolean> {
  return Boolean(process.env.GEMINI_API_KEY?.trim())
}

function describirBuild(build: Build): string {
  const lineas: string[] = [
    `Título: ${build.title}`,
    `Categoría: ${build.category}`,
  ]

  if (build.description) lineas.push(`Descripción: ${build.description}`)

  lineas.push('', 'Equipamiento:')
  for (const slot of SLOTS_EQUIPO) {
    const item = build.equipment[slot]
    if (!item) continue

    // Se incluyen las habilidades elegidas. La versión anterior armaba el
    // prompt solo con los nombres de los ítems, así que la guía hablaba en
    // general del arma y nunca de las habilidades concretas de la build.
    const habilidades = ORDEN_SLOTS.map(
      (s) => build.abilities[claveHabilidad(slot, s)]?.name,
    ).filter(Boolean)

    lineas.push(
      `- ${NOMBRES_SLOT[slot]}: ${item.name}` +
        (habilidades.length ? ` (habilidades: ${habilidades.join(', ')})` : ''),
    )
  }

  const { potion, food } = build.consumables
  if (potion || food) {
    lineas.push('', 'Consumibles:')
    if (potion) lineas.push(`- Poción: ${potion.name}`)
    if (food) lineas.push(`- Comida: ${food.name}`)
  }

  return lineas.join('\n')
}

/**
 * Genera la guía y la guarda en la build.
 *
 * La clave de la API se lee solo acá, en el servidor. En el proyecto anterior
 * la variable ni siquiera existía en el .env, así que este endpoint devolvía
 * 500 en todas las llamadas.
 */
export async function generarGuia(buildId: string): Promise<ResultadoGuia> {
  await exigirMiembroActivo()

  const apiKey = process.env.GEMINI_API_KEY?.trim()
  if (!apiKey) {
    return {
      ok: false,
      error: 'La generación por IA no está configurada (falta GEMINI_API_KEY).',
    }
  }

  const build = await obtenerBuild(buildId)
  if (!build) return { ok: false, error: 'No encontramos esa build.' }

  const prompt = `Sos un jugador experto de Albion Online. Escribí una guía breve y práctica para esta build, en español rioplatense y en formato markdown.

${describirBuild(build)}

La guía tiene que cubrir, con un encabezado por sección:
1. Estrategia general: cómo se juega en ${build.category}.
2. Fortalezas: qué hace bien.
3. Debilidades: qué enfrentamientos evitar.
4. Rotación: en qué orden usar las habilidades listadas.

Sé concreto y conciso. No inventes habilidades ni ítems que no estén en la lista de arriba. No repitas los datos de la build: pasá directo al análisis.`

  try {
    const ai = new GoogleGenAI({ apiKey })
    const respuesta = await ai.models.generateContent({
      model: MODELO,
      contents: prompt,
    })

    // .text puede venir undefined si el modelo devolvió solo partes no textuales
    // o si el contenido fue filtrado.
    const guia = respuesta.text?.trim()
    if (!guia) {
      return { ok: false, error: 'El modelo no devolvió texto. Probá de nuevo.' }
    }

    // Se cachea en la base para no volver a pagar la llamada en cada visita.
    // Si el guardado falla (por ejemplo, RLS porque no sos el autor), se
    // devuelve igual la guía: el usuario ya la tiene y puede leerla.
    const supabase = await createClient()
    await supabase.from('builds').update({ ai_guide: guia }).eq('id', buildId)

    revalidatePath(`/builds/${buildId}`)
    return { ok: true, guia }
  } catch (error) {
    console.error('Falló la generación de la guía:', error)
    return {
      ok: false,
      error:
        error instanceof Error
          ? `No se pudo generar la guía: ${error.message}`
          : 'No se pudo generar la guía.',
    }
  }
}
