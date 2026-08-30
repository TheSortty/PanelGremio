import 'server-only'

import { createClient as createSupabaseClient } from '@supabase/supabase-js'

import type { Database } from '@/lib/db/database.types'

/**
 * Cliente con la clave secreta (service_role).
 *
 * SALTEA RLS POR COMPLETO. Solo para lo que genuinamente necesita privilegios:
 * los seeds y el callback de Steam (que tiene que crear usuarios).
 *
 * El import de 'server-only' hace fallar el build si este archivo termina
 * alcanzado desde un bundle de cliente, en vez de filtrar la clave en silencio.
 */
export function createAdminClient() {
  const secretKey = process.env.SUPABASE_SECRET_KEY

  if (!secretKey) {
    throw new Error(
      'Falta SUPABASE_SECRET_KEY. Se necesita para el login por Steam y para los seeds.',
    )
  }

  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    secretKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  )
}
