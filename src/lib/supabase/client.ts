'use client'

import { createBrowserClient } from '@supabase/ssr'

import type { Database } from '@/lib/db/database.types'

/**
 * Cliente de Supabase para componentes de cliente.
 *
 * Solo usa la clave publishable, que es pública por diseño: la seguridad real
 * la aplica RLS en la base, no el secreto de esta clave.
 */
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  )
}
