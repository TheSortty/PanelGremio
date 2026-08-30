import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

import type { Database } from '@/lib/db/database.types'

/** Rutas alcanzables sin sesión. */
const RUTAS_PUBLICAS = ['/login', '/auth', '/_next', '/favicon.ico']

function esRutaPublica(pathname: string) {
  return RUTAS_PUBLICAS.some(
    (ruta) => pathname === ruta || pathname.startsWith(`${ruta}/`),
  )
}

/**
 * Refresca el token de sesión y protege las rutas privadas.
 *
 * Reemplaza a las sesiones en memoria del backend Express, donde reiniciar el
 * servidor deslogueaba a todo el mundo y las sesiones no vencían nunca.
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value)
          }
          supabaseResponse = NextResponse.next({ request })
          for (const { name, value, options } of cookiesToSet) {
            supabaseResponse.cookies.set(name, value, options)
          }
        },
      },
    },
  )

  // No meter código entre createServerClient y getClaims: cualquier cosa que
  // corte el flujo acá puede dejar cookies a medio escribir y desloguear
  // usuarios de forma aleatoria.
  const { data } = await supabase.auth.getClaims()
  const claims = data?.claims

  const { pathname } = request.nextUrl

  if (!claims && !esRutaPublica(pathname)) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    // Para volver a donde quería ir después de entrar.
    url.searchParams.set('redirigir', pathname)
    return NextResponse.redirect(url)
  }

  // Ya con sesión, /login no tiene sentido.
  if (claims && pathname === '/login') {
    const url = request.nextUrl.clone()
    url.pathname = '/panel'
    url.search = ''
    return NextResponse.redirect(url)
  }

  // Devolver supabaseResponse tal cual: si se arma otra respuesta sin copiar
  // estas cookies, el navegador y el servidor quedan desincronizados.
  return supabaseResponse
}
