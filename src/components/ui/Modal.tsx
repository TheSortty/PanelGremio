'use client'

import { useEffect, useRef, type ReactNode } from 'react'

/**
 * Diálogo modal sobre el <dialog> nativo.
 *
 * El modal anterior era un div con position fixed. Eso significaba: sin trampa
 * de foco (se tabulaba hacia la página de atrás), sin cierre con Escape, y el
 * fondo seguía scrolleando. El elemento nativo resuelve las tres cosas y el
 * backdrop se estiliza con ::backdrop.
 */
export function Modal({
  abierto,
  onCerrar,
  titulo,
  children,
}: {
  abierto: boolean
  onCerrar: () => void
  titulo: string
  children: ReactNode
}) {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialogo = ref.current
    if (!dialogo) return

    if (abierto && !dialogo.open) {
      dialogo.showModal()
    } else if (!abierto && dialogo.open) {
      dialogo.close()
    }
  }, [abierto])

  return (
    <dialog
      ref={ref}
      // El <dialog> nativo emite 'close' con Escape; así el estado de React
      // no se queda creyendo que sigue abierto.
      onClose={onCerrar}
      onClick={(e) => {
        // Clic en el backdrop: el target es el propio dialog solo cuando se
        // hizo clic afuera del contenido.
        if (e.target === ref.current) onCerrar()
      }}
      aria-labelledby="titulo-modal"
      className="m-auto w-[min(30rem,calc(100vw-2rem))] rounded-panel border border-borde bg-superficie p-0 text-texto backdrop:bg-black/70"
    >
      <div className="flex items-center justify-between border-b border-borde-suave px-5 py-3">
        <h2 id="titulo-modal" className="font-semibold">
          {titulo}
        </h2>
        <button
          type="button"
          onClick={onCerrar}
          aria-label="Cerrar"
          className="rounded-md p-1 text-texto-tenue transition-colors hover:bg-superficie-alta hover:text-texto"
        >
          <svg
            className="size-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <div className="max-h-[70vh] overflow-y-auto px-5 py-4">{children}</div>
    </dialog>
  )
}
