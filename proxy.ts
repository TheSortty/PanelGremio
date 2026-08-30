import type { NextRequest } from 'next/server'

import { updateSession } from '@/lib/supabase/proxy'

/**
 * En Next.js 16 el middleware pasó a llamarse proxy.
 * Corre en cada navegación para refrescar el token de Supabase antes de que
 * se renderice cualquier Server Component.
 */
export async function proxy(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  matcher: [
    /*
     * Todas las rutas salvo estáticos e imágenes, que no necesitan sesión y
     * solo agregarían latencia.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
}
