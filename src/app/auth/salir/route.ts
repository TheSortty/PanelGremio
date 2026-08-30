import { NextResponse, type NextRequest } from 'next/server'

import { createClient } from '@/lib/supabase/server'

/**
 * Cierre de sesión.
 *
 * Es POST y no GET a propósito: con GET, cualquier <img src="/auth/salir">
 * en una página externa desloguearía al usuario.
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  await supabase.auth.signOut()

  return NextResponse.redirect(new URL('/login', request.url), {
    // 303 fuerza al navegador a hacer GET en el destino; sin esto reenviaría
    // el POST a /login.
    status: 303,
  })
}
