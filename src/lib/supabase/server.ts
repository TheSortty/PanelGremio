import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

import type { Database } from '@/lib/db/database.types'

/**
 * Cliente de Supabase para Server Components, Server Actions y Route Handlers.
 *
 * Hay que crear uno nuevo por petición: guarda el estado de las cookies de esa
 * petición y reutilizarlo entre usuarios filtraría sesiones.
 */
export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options)
            }
          } catch {
            // Los Server Components no pueden escribir cookies. Se ignora sin
            // problema porque el proxy (proxy.ts) ya refrescó la sesión antes
            // de que se renderice nada.
          }
        },
      },
    },
  )
}
