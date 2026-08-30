import { NextResponse, type NextRequest } from 'next/server'

import { urlDelSitio } from '@/lib/auth/steam'

/**
 * Inicia el login por Steam.
 *
 * Steam no habla OAuth2 ni OIDC: usa OpenID 2.0, que Supabase no soporta de
 * forma nativa (y su `customProviders` es solo para OIDC). Por eso el flujo se
 * implementa a mano acá y en /auth/steam/callback.
 *
 * La versión anterior tenía un botón "Vincular con Steam" que apuntaba a
 * /api/auth/steam, una ruta que nunca existió: el botón daba 404.
 */
export function GET(request: NextRequest) {
  const base = urlDelSitio(request)

  const parametros = new URLSearchParams({
    'openid.ns': 'http://specs.openid.net/auth/2.0',
    'openid.mode': 'checkid_setup',
    'openid.return_to': `${base}/auth/steam/callback`,
    'openid.realm': base,
    // identifier_select: le pedimos a Steam que sea el usuario quien elija su
    // cuenta; no sabemos de antemano de quién se trata.
    'openid.identity': 'http://specs.openid.net/auth/2.0/identifier_select',
    'openid.claimed_id': 'http://specs.openid.net/auth/2.0/identifier_select',
  })

  return NextResponse.redirect(
    `https://steamcommunity.com/openid/login?${parametros}`,
  )
}
