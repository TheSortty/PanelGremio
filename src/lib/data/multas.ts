import 'server-only'

import { createClient } from '@/lib/supabase/server'

export type Multa = {
  id: string
  profile_id: string
  monto: number
  motivo: string
  estado: 'pendiente' | 'pagada' | 'perdonada'
  emitida_en: string
  saldada_en: string | null
  miembro: { id: string; name: string } | null
  oficial: { id: string; name: string } | null
}

const CAMPOS = `
  id, profile_id, monto, motivo, estado, emitida_en, saldada_en,
  miembro:profiles!fines_profile_id_fkey ( id, name ),
  oficial:profiles!fines_emitida_por_fkey ( id, name )
` as const

/**
 * Las multas del gremio.
 *
 * La política RLS decide qué se ve: un miembro ve las suyas, un oficial ve
 * todas. Por eso esta misma función sirve para la pantalla de administración y
 * para el perfil de cada uno.
 */
export async function listarMultas(estado?: string): Promise<Multa[]> {
  const supabase = await createClient()

  let consulta = supabase
    .from('fines')
    .select(CAMPOS)
    .order('emitida_en', { ascending: false })
    .limit(300)

  if (estado === 'pendiente' || estado === 'pagada' || estado === 'perdonada') {
    consulta = consulta.eq('estado', estado)
  }

  const { data, error } = await consulta
  if (error) throw new Error(error.message)

  return (data ?? []) as unknown as Multa[]
}

/** Cuánto debe una persona. Es el número que se muestra en su perfil. */
export async function deudaDe(profileId: string): Promise<number> {
  const supabase = await createClient()

  const { data } = await supabase
    .from('fines')
    .select('monto')
    .eq('profile_id', profileId)
    .eq('estado', 'pendiente')
    .limit(300)

  return (data ?? []).reduce((total, m) => total + Number(m.monto), 0)
}
