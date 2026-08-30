import { NextResponse } from 'next/server'

import { createClient } from '@/lib/supabase/server'

/**
 * Callback de OAuth (Discord) y de los enlaces de confirmación por correo.
 *
 * Supabase redirige acá con un `code` de un solo uso, que se canjea por una
 * sesión. Las cookies las escribe el cliente SSR dentro de exchangeCodeForSession.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)

  const code = searchParams.get('code')
  const errorOAuth = searchParams.get('error_description') ?? searchParams.get('error')

  if (errorOAuth) {
    return NextResponse.redirect(
      `${origin}/auth/error?motivo=${encodeURIComponent(errorOAuth)}`,
    )
  }

  if (!code) {
    return NextResponse.redirect(
      `${origin}/auth/error?motivo=${encodeURIComponent('Falta el código de autorización.')}`,
    )
  }

  // Solo se aceptan destinos relativos: un `next` absoluto convertiría esto en
  // un redirector abierto, útil para llevar a un usuario logueado a otro sitio.
  const solicitado = searchParams.get('next') ?? '/panel'
  const destino =
    solicitado.startsWith('/') && !solicitado.startsWith('//')
      ? solicitado
      : '/panel'

  const supabase = await createClient()
  const { error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    return NextResponse.redirect(
      `${origin}/auth/error?motivo=${encodeURIComponent(error.message)}`,
    )
  }

  // Detrás de un balanceador, `origin` es el host interno. x-forwarded-host
  // tiene el dominio que el usuario realmente ve.
  const forwardedHost = request.headers.get('x-forwarded-host')
  const enDesarrollo = process.env.NODE_ENV === 'development'

  if (!enDesarrollo && forwardedHost) {
    return NextResponse.redirect(`https://${forwardedHost}${destino}`)
  }

  return NextResponse.redirect(`${origin}${destino}`)
}
