import {
  ETIQUETAS_PASO,
  type Paso,
  type TipoPaso,
} from '@/lib/domain/rutas'
import { cn } from '@/lib/utils/cn'

/**
 * El recorrido de una ruta, dibujado como cadena.
 *
 * Es el "mapa" de esta sección. Los caminos avalonianos no tienen una geografía
 * que se pueda plantar sobre un plano —los portales rotan y expiran—, así que
 * lo que se dibuja es lo único estable mientras el portal dure: el orden en que
 * se pasa por cada lugar.
 *
 * Cada tipo de paso tiene su propia forma además de su color: un rombo para el
 * portal, un cuadrado para el mapa, un círculo para la salida. Con solo color,
 * una ruta larga se vuelve indistinguible para quien no separa bien los tonos.
 */

const ESTILOS: Record<TipoPaso, { marca: string; borde: string; texto: string }> = {
  portal: {
    marca: 'rotate-45 rounded-[3px] bg-acento',
    borde: 'border-acento/50',
    texto: 'text-acento',
  },
  mapa: {
    marca: 'rounded-[3px] bg-texto-tenue',
    borde: 'border-borde',
    texto: 'text-texto-suave',
  },
  salida: {
    marca: 'rounded-full bg-exito',
    borde: 'border-exito/50',
    texto: 'text-exito',
  },
}

function Nodo({ etiqueta, nombre }: { etiqueta: string; nombre: string }) {
  return (
    <li className="flex items-start gap-3">
      <span className="mt-1.5 flex size-3 shrink-0 items-center justify-center">
        <span className="size-2.5 rounded-full border-2 border-acento bg-fondo" />
      </span>
      <div className="min-w-0 pb-5">
        <p className="grabado text-acento">{etiqueta}</p>
        <p className="font-medium">{nombre}</p>
      </div>
    </li>
  )
}

export function CadenaRuta({
  origen,
  destino,
  pasos,
}: {
  origen: string
  destino: string | null
  pasos: Paso[]
}) {
  return (
    <ol className="relative ml-1.5 border-l border-dashed border-borde pl-5">
      <Nodo etiqueta="Entrada" nombre={origen} />

      {pasos.map((paso, i) => {
        const estilo = ESTILOS[paso.kind]

        return (
          <li key={`${i}-${paso.name}`} className="flex items-start gap-3">
            <span className="mt-1.5 flex size-3 shrink-0 items-center justify-center">
              <span className={cn('size-2.5', estilo.marca)} />
            </span>
            <div className="min-w-0 pb-5">
              <p className={cn('grabado', estilo.texto)}>
                {ETIQUETAS_PASO[paso.kind]}
                <span className="ml-2 font-normal normal-case tracking-normal text-texto-tenue">
                  paso {i + 1}
                </span>
              </p>
              <p className="font-medium">{paso.name}</p>
              {paso.notes && (
                <p className="mt-0.5 text-sm text-texto-tenue">{paso.notes}</p>
              )}
            </div>
          </li>
        )
      })}

      {destino && <Nodo etiqueta="Se llega a" nombre={destino} />}
    </ol>
  )
}
