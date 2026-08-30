const RELATIVO = new Intl.RelativeTimeFormat('es', { numeric: 'auto' })

const UNIDADES: [Intl.RelativeTimeFormatUnit, number][] = [
  ['year', 60 * 60 * 24 * 365],
  ['month', 60 * 60 * 24 * 30],
  ['day', 60 * 60 * 24],
  ['hour', 60 * 60],
  ['minute', 60],
]

/**
 * "hace 5 minutos", "hace 2 días".
 *
 * La tabla del panel mostraba `lastSeen` crudo, así que al usuario le aparecía
 * el ISO de la base tal cual.
 */
export function tiempoRelativo(fecha: string | Date | null | undefined): string {
  if (!fecha) return 'nunca'

  const d = typeof fecha === 'string' ? new Date(fecha) : fecha
  if (Number.isNaN(d.getTime())) return 'desconocido'

  const segundos = Math.round((d.getTime() - Date.now()) / 1000)
  const abs = Math.abs(segundos)

  if (abs < 60) return 'hace instantes'

  for (const [unidad, seg] of UNIDADES) {
    if (abs >= seg) {
      return RELATIVO.format(Math.round(segundos / seg), unidad)
    }
  }
  return 'hace instantes'
}

export function fechaCorta(fecha: string | Date | null | undefined): string {
  if (!fecha) return '—'
  const d = typeof fecha === 'string' ? new Date(fecha) : fecha
  if (Number.isNaN(d.getTime())) return '—'
  return new Intl.DateTimeFormat('es', { dateStyle: 'medium' }).format(d)
}

export function fechaHora(fecha: string | Date | null | undefined): string {
  if (!fecha) return '—'
  const d = typeof fecha === 'string' ? new Date(fecha) : fecha
  if (Number.isNaN(d.getTime())) return '—'
  return new Intl.DateTimeFormat('es', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(d)
}
