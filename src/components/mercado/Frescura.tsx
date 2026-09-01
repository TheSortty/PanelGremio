import { ETIQUETAS_FRESCURA, type Frescura as Tono } from '@/lib/mercado/economia'
import { cn } from '@/lib/utils/cn'

/**
 * La antigüedad del dato, al lado del número.
 *
 * Los precios los suben jugadores paseando por el mercado, así que uno puede
 * tener minutos o dos días. Un margen calculado sobre un precio de anteayer no
 * es una oportunidad, es una trampa, y la única defensa honesta es mostrar
 * siempre de cuándo es el dato.
 */
const ESTILOS: Record<Tono, string> = {
  fresco: 'bg-exito-fondo/50 text-exito',
  tibio: 'bg-alerta-fondo/50 text-alerta',
  viejo: 'bg-peligro-fondo/50 text-peligro',
  'sin-datos': 'bg-superficie-alta text-texto-tenue',
}

export function Frescura({ tono, className }: { tono: Tono; className?: string }) {
  return (
    <span
      title={`Precio de ${ETIQUETAS_FRESCURA[tono]}`}
      className={cn(
        'inline-flex shrink-0 items-center rounded px-1.5 py-0.5 text-[11px] font-medium',
        ESTILOS[tono],
        className,
      )}
    >
      {ETIQUETAS_FRESCURA[tono]}
    </span>
  )
}
