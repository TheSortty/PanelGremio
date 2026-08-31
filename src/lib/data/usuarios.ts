import 'server-only'

import { createClient } from '@/lib/supabase/server'

/**
 * Cuántas solicitudes esperan aprobación.
 *
 * Se pide con head: true y count exacto: no hace falta traer las filas, solo
 * el número para la insignia. Lo lee el layout de administración y la barra de
 * navegación.
 *
 * Si la consulta falla —por ejemplo, porque quien mira no es admin y RLS no le
 * deja ver perfiles pendientes— devuelve 0. Una insignia es un adorno: no vale
 * romper la página por ella.
 */
export async function contarPendientes(): Promise<number> {
  const supabase = await createClient()

  const { count, error } = await supabase
    .from('profiles')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'pending')

  if (error) return 0
  return count ?? 0
}
