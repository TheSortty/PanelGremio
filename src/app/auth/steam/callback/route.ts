import { NextResponse, type NextRequest } from 'next/server'

import {
  correoDeSteam,
  obtenerPerfilSteam,
  urlDelSitio,
  verificarRespuestaSteam,
} from '@/lib/auth/steam'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

function irAError(base: string, motivo: string) {
  return NextResponse.redirect(
    `${base}/auth/error?motivo=${encodeURIComponent(motivo)}`,
  )
}

/**
 * Vuelta de Steam.
 *
 * Pasos:
 *   1. Verificar la firma OpenID contra Steam (sin esto, el SteamID es un dato
 *      de la query string y se puede inventar).
 *   2. Buscar el perfil que ya tenga ese steam_id, o crear la cuenta.
 *   3. Emitir una sesión de Supabase para esa cuenta.
 */
export async function GET(request: NextRequest) {
  const base = urlDelSitio(request)
  const parametros = request.nextUrl.searchParams

  const steamId = await verificarRespuestaSteam(parametros)
  if (!steamId) {
    return irAError(base, 'No se pudo verificar tu identidad de Steam.')
  }

  const admin = createAdminClient()

  // ¿Ya hay una cuenta para este SteamID?
  const { data: perfilExistente } = await admin
    .from('profiles')
    .select('id')
    .eq('steam_id', steamId)
    .maybeSingle()

  let userId = perfilExistente?.id ?? null
  const correo = correoDeSteam(steamId)

  if (!userId) {
    const perfil = await obtenerPerfilSteam(steamId)

    const { data: creado, error: errorCreacion } =
      await admin.auth.admin.createUser({
        email: correo,
        // No hay forma de confirmar un correo que no existe, y la identidad ya
        // quedó probada por la verificación OpenID de más arriba.
        email_confirm: true,
        // steam_id va en app_metadata, no en user_metadata: user_metadata lo
        // puede editar el propio usuario y aparece en el JWT, así que nunca
        // debe usarse para decisiones de identidad o permisos.
        app_metadata: { provider: 'steam', steam_id: steamId },
        user_metadata: {
          nombre_gremio: perfil.nombre ?? `Jugador ${steamId.slice(-5)}`,
          avatar_url: perfil.avatar,
        },
      })

    if (errorCreacion || !creado.user) {
      // Carrera: dos pestañas entrando a la vez. La segunda choca con el correo
      // único, así que se recupera buscando la cuenta que creó la primera.
      const { data: reintento } = await admin
        .from('profiles')
        .select('id')
        .eq('steam_id', steamId)
        .maybeSingle()

      if (!reintento) {
        return irAError(
          base,
          errorCreacion?.message ?? 'No se pudo crear la cuenta.',
        )
      }
      userId = reintento.id
    } else {
      userId = creado.user.id
    }
  }

  // Emitir la sesión.
  //
  // Supabase no expone "crear sesión para este usuario" directamente. El camino
  // soportado es generar un enlace mágico con la clave secreta y canjear su
  // token_hash acá mismo, del lado del servidor. El enlace nunca sale de este
  // proceso y se consume de inmediato.
  const { data: enlace, error: errorEnlace } =
    await admin.auth.admin.generateLink({ type: 'magiclink', email: correo })

  if (errorEnlace || !enlace.properties?.hashed_token) {
    return irAError(base, 'No se pudo iniciar la sesión con Steam.')
  }

  const supabase = await createClient()
  const { error: errorSesion } = await supabase.auth.verifyOtp({
    type: 'magiclink',
    token_hash: enlace.properties.hashed_token,
  })

  if (errorSesion) {
    return irAError(base, errorSesion.message)
  }

  return NextResponse.redirect(`${base}/panel`)
}
