import 'server-only'

import type { NextRequest } from 'next/server'

const ENDPOINT_STEAM = 'https://steamcommunity.com/openid/login'

/**
 * URL pública de la app.
 *
 * Se prefiere NEXT_PUBLIC_SITE_URL porque OpenID exige que el `return_to` de la
 * verificación sea idéntico al que se mandó al iniciar. Detrás de un proxy, el
 * host de la petición puede ser el interno y la verificación fallaría.
 */
export function urlDelSitio(request: NextRequest): string {
  const configurada = process.env.NEXT_PUBLIC_SITE_URL?.trim()
  if (configurada) return configurada.replace(/\/$/, '')

  const host = request.headers.get('x-forwarded-host') ?? request.nextUrl.host
  const protocolo =
    request.headers.get('x-forwarded-proto') ??
    (host.startsWith('localhost') || host.startsWith('127.0.0.1')
      ? 'http'
      : 'https')

  return `${protocolo}://${host}`
}

/**
 * Verifica la respuesta de Steam y devuelve el SteamID64.
 *
 * Este paso NO es opcional. Los parámetros openid.* llegan por query string,
 * así que cualquiera puede fabricar una URL de callback con el claimed_id de
 * otra persona. La única forma de saber que la aserción es auténtica es
 * devolvérsela a Steam con mode=check_authentication y que responda is_valid.
 *
 * Devuelve null si la firma no valida.
 */
export async function verificarRespuestaSteam(
  parametros: URLSearchParams,
): Promise<string | null> {
  const modo = parametros.get('openid.mode')
  if (modo !== 'id_res') return null

  // Se reenvían todos los parámetros tal cual, cambiando solo el modo:
  // la firma cubre el conjunto exacto y alterar cualquiera la invalida.
  const verificacion = new URLSearchParams(parametros)
  verificacion.set('openid.mode', 'check_authentication')

  const respuesta = await fetch(ENDPOINT_STEAM, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: verificacion.toString(),
    cache: 'no-store',
  })

  if (!respuesta.ok) return null

  const texto = await respuesta.text()
  if (!/is_valid\s*:\s*true/i.test(texto)) return null

  // Recién con la firma validada se confía en el claimed_id.
  const claimedId = parametros.get('openid.claimed_id') ?? ''
  const coincidencia = claimedId.match(
    /^https?:\/\/steamcommunity\.com\/openid\/id\/(\d{17})$/,
  )

  return coincidencia?.[1] ?? null
}

export type PerfilSteam = {
  nombre: string | null
  avatar: string | null
}

/**
 * Nombre y avatar del jugador.
 *
 * Requiere STEAM_API_KEY. Es opcional a propósito: sin la clave el login
 * funciona igual, solo que el perfil arranca con un nombre genérico que el
 * usuario puede cambiar después.
 */
export async function obtenerPerfilSteam(
  steamId: string,
): Promise<PerfilSteam> {
  const clave = process.env.STEAM_API_KEY?.trim()
  if (!clave) return { nombre: null, avatar: null }

  try {
    const url = new URL(
      'https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/',
    )
    url.searchParams.set('key', clave)
    url.searchParams.set('steamids', steamId)

    const respuesta = await fetch(url, {
      cache: 'no-store',
      signal: AbortSignal.timeout(5000),
    })
    if (!respuesta.ok) return { nombre: null, avatar: null }

    const datos = await respuesta.json()
    const jugador = datos?.response?.players?.[0]

    return {
      nombre: jugador?.personaname ?? null,
      avatar: jugador?.avatarfull ?? null,
    }
  } catch {
    // El perfil es un extra: si la API de Steam está caída o tarda, el login
    // tiene que poder seguir igual.
    return { nombre: null, avatar: null }
  }
}

/**
 * Correo sintético para la cuenta de Supabase.
 *
 * Steam nunca entrega el email del usuario, pero Supabase necesita un
 * identificador único por cuenta. El dominio .invalid está reservado por la
 * RFC 2606 justamente para esto, así que jamás va a resolver ni recibir correo.
 */
export function correoDeSteam(steamId: string): string {
  return `${steamId}@steam.invalid`
}
