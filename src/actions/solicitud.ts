'use server'

import { revalidatePath } from 'next/cache'

import { obtenerPerfil } from '@/lib/auth/sesion'
import { avisarSolicitud } from '@/lib/discord/aviso'
import { solicitudSchema } from '@/lib/domain/solicitud'
import { createClient } from '@/lib/supabase/server'

export type ResultadoSolicitud = { ok: true } | { ok: false; error: string }

/**
 * Guarda la solicitud de ingreso.
 *
 * NO usa exigirMiembroActivo: quien manda una solicitud es, por definición,
 * alguien que todavía no es miembro. Alcanza con que tenga sesión. La política
 * RLS de `applications` está escrita para eso.
 *
 * Las capturas ya se subieron al bucket desde el navegador antes de llegar acá
 * —van directo a Storage, sin pasar por el servidor— y lo que llega son sus
 * rutas. Se verifica que existan de verdad antes de aceptar la solicitud: sin
 * esa comprobación, un cliente armado a mano podría mandar rutas inventadas y
 * saltarse el requisito de las fotos, que es justamente el que el gremio usa
 * para rechazar.
 */
export async function enviarSolicitud(
  entrada: unknown,
  capturas: { stats: string; perfil: string },
): Promise<ResultadoSolicitud> {
  const perfil = await obtenerPerfil()
  if (!perfil) return { ok: false, error: 'No hay sesión.' }

  const validado = solicitudSchema.safeParse(entrada)
  if (!validado.success) {
    return {
      ok: false,
      error: validado.error.issues[0]?.message ?? 'Revisá los datos.',
    }
  }

  const supabase = await createClient()

  // Que las rutas sean de esta persona, y que los archivos existan.
  for (const ruta of [capturas.stats, capturas.perfil]) {
    if (!ruta.startsWith(`${perfil.id}/`)) {
      return { ok: false, error: 'Las capturas no corresponden a tu cuenta.' }
    }
  }

  const { data: archivos, error: eArchivos } = await supabase.storage
    .from('solicitudes')
    .list(perfil.id)

  if (eArchivos) return { ok: false, error: eArchivos.message }

  const presentes = new Set((archivos ?? []).map((a) => `${perfil.id}/${a.name}`))
  if (!presentes.has(capturas.stats) || !presentes.has(capturas.perfil)) {
    return {
      ok: false,
      error: 'Faltan las capturas. Subí las dos antes de enviar.',
    }
  }

  const d = validado.data

  const { error } = await supabase.from('applications').upsert(
    {
      profile_id: perfil.id,
      edad: d.edad,
      horario: d.horario,
      dispositivo: d.dispositivo,
      gremio_anterior: d.gremio_anterior || null,
      cuenta: d.cuenta,
      rol_juego_principal: d.rol_juego_principal,
      rol_juego_secundario: d.rol_juego_secundario || null,
      quien_lo_trajo: d.quien_lo_trajo || null,
      contenido: d.contenido,
      discord: d.discord || null,
      captura_stats: capturas.stats,
      captura_perfil: capturas.perfil,
    },
    { onConflict: 'profile_id' },
  )

  if (error) return { ok: false, error: error.message }

  /*
    El aviso a Discord va después de guardar y sin await sobre su resultado:
    si el webhook falla o no está configurado, la solicitud igual quedó. Al
    revés —avisar primero— podría anunciar una solicitud que después no se
    guardó.
  */
  await avisarSolicitud({
    nombre: perfil.name,
    edad: d.edad,
    horario: d.horario,
    dispositivo: d.dispositivo,
    rolPrincipal: d.rol_juego_principal,
    rolSecundario: d.rol_juego_secundario || null,
    contenido: d.contenido,
    gremioAnterior: d.gremio_anterior || null,
    quienLoTrajo: d.quien_lo_trajo || null,
    discord: d.discord || null,
  })

  revalidatePath('/auth/pendiente')
  revalidatePath('/admin')
  return { ok: true }
}
