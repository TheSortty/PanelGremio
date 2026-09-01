import 'server-only'

/**
 * Killboard: las muertes del gremio, desde la API pública de Albion.
 *
 * Esta API sí es del juego —no la alimenta la comunidad como la de precios—,
 * así que los datos son exactos. Lo que no es exacto es su disponibilidad:
 * devuelve 502 cada tanto sin motivo, y midiéndolo pasó en el primer intento de
 * esta misma sesión. Por eso hay reintentos.
 *
 * TRES REGIONES, TRES MUNDOS
 *
 * Cada región tiene su propio servidor de datos y su propio conjunto de
 * gremios. El mismo nombre puede existir en las tres y no ser el mismo gremio,
 * así que la región es parte de la identidad y se guarda en los ajustes.
 */

import { REGIONES, type GremioEncontrado, type Region } from '@/lib/albion/regiones'

export { REGIONES }
export type { GremioEncontrado, Region }

function base(region: Region) {
  return `https://${REGIONES[region].host}.albiononline.com/api/gameinfo`
}

/** Cinco minutos: un kill nuevo no cambia lo que pasó, pero sí la lista. */
const SEGUNDOS_CACHE = 300

const INTENTOS = 3

async function pedir<T>(url: string): Promise<T | null> {
  for (let intento = 0; intento < INTENTOS; intento++) {
    try {
      const r = await fetch(url, {
        next: { revalidate: SEGUNDOS_CACHE },
        headers: { Accept: 'application/json' },
      })

      if (r.ok) return (await r.json()) as T
      // 404 es definitivo: el gremio no existe en esta región.
      if (r.status === 404) return null
    } catch {
      // Red caída: se reintenta.
    }

    if (intento < INTENTOS - 1) {
      await new Promise((s) => setTimeout(s, 250 * (intento + 1)))
    }
  }

  return null
}

// -----------------------------------------------------------------------------
// Búsqueda de gremio
// -----------------------------------------------------------------------------

type RespuestaBusqueda = {
  guilds?: { Id: string; Name: string; AllianceName?: string }[]
}

/**
 * Busca un gremio por nombre, para poder guardar su id.
 *
 * Se guarda el id y no el nombre porque hay gremios con nombres parecidos y
 * porque un gremio puede renombrarse: el id no cambia.
 */
export async function buscarGremio(
  nombre: string,
  region: Region,
): Promise<GremioEncontrado[]> {
  const termino = nombre.trim()
  if (termino.length < 2) return []

  const datos = await pedir<RespuestaBusqueda>(
    `${base(region)}/search?q=${encodeURIComponent(termino)}`,
  )

  return (datos?.guilds ?? []).map((g) => ({
    id: g.Id,
    nombre: g.Name,
    alianza: g.AllianceName || null,
  }))
}

// -----------------------------------------------------------------------------
// Muertes
// -----------------------------------------------------------------------------

type Jugador = {
  Id: string
  Name: string
  GuildId?: string
  GuildName?: string
  AllianceName?: string
  AverageItemPower: number
  Equipment?: Record<string, { Type?: string } | null>
}

type EventoCrudo = {
  EventId: number
  TimeStamp: string
  TotalVictimKillFame: number
  numberOfParticipants: number
  Killer: Jugador
  Victim: Jugador
}

export type Muerte = {
  id: number
  fecha: Date
  fama: number
  participantes: number
  /** true si el gremio mató; false si perdió a alguien. */
  aFavor: boolean
  killer: { nombre: string; gremio: string | null; ip: number; arma: string | null }
  victima: { nombre: string; gremio: string | null; ip: number; arma: string | null }
}

function jugador(j: Jugador) {
  return {
    nombre: j.Name,
    gremio: j.GuildName || null,
    ip: Math.round(j.AverageItemPower ?? 0),
    // El arma es lo que identifica la build de un vistazo; se dibuja con el
    // mismo proxy de iconos que el resto del panel.
    arma: j.Equipment?.MainHand?.Type ?? null,
  }
}

export type ResultadoKillboard = {
  muertes: Muerte[]
  /** null = la API no respondió. Vacío = respondió y no hay nada. */
  disponible: boolean
}

/**
 * Últimas muertes del gremio, a favor y en contra.
 *
 * EL ENDPOINT
 *
 * Es `events?guildId=`, no `guilds/{id}/topkills`. Ese último devuelve 404: no
 * existe, aunque aparezca en varias guías dando vueltas. Se probó contra la API
 * real antes de escribir esto, porque un 404 acá no habría dado error visible:
 * la pantalla habría dicho "sin datos" para siempre y nadie habría sabido por
 * qué.
 *
 * También se descartó `guilds/{id}/top`, que responde 200 pero con un arreglo
 * vacío.
 *
 * A FAVOR Y EN CONTRA
 *
 * La API devuelve los eventos donde el gremio estuvo de cualquiera de los dos
 * lados. `aFavor` se calcula comparando GuildId —no el nombre, que se puede
 * repetir— para poder mostrar en la misma lista lo que se ganó y lo que se
 * perdió, que es como se lee un killboard.
 */
export async function ultimasMuertes(
  guildId: string,
  region: Region,
  limite = 50,
): Promise<ResultadoKillboard> {
  const datos = await pedir<EventoCrudo[]>(
    `${base(region)}/events?guildId=${encodeURIComponent(guildId)}&limit=${limite}&offset=0`,
  )

  if (!datos) return { muertes: [], disponible: false }

  const muertes = datos.map((e) => ({
    id: e.EventId,
    fecha: new Date(e.TimeStamp),
    fama: e.TotalVictimKillFame,
    participantes: e.numberOfParticipants,
    aFavor: e.Killer.GuildId === guildId,
    killer: jugador(e.Killer),
    victima: jugador(e.Victim),
  }))

  return { muertes, disponible: true }
}
