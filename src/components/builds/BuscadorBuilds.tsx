'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState, useTransition } from 'react'

import { IconoCruz, IconoLupa } from '@/components/ui/Iconos'

/**
 * Búsqueda de builds.
 *
 * El término va en la URL y no en un estado local, igual que el filtro por
 * categoría: así se puede compartir el enlace de una búsqueda, el botón atrás
 * funciona y el filtrado lo hace la base en vez de traer las 200 builds al
 * navegador para descartarlas ahí.
 *
 * Se escribe con retraso de 300 ms. Sin eso, cada tecla dispara una navegación
 * y una consulta; con "bastón sagrado" serían quince.
 */
export function BuscadorBuilds() {
  const router = useRouter()
  const pathname = usePathname()
  const parametros = useSearchParams()

  const consultaUrl = parametros.get('q') ?? ''
  const [texto, setTexto] = useState(consultaUrl)
  const [, iniciar] = useTransition()

  // Si la URL cambia por fuera (botón atrás, o al tocar una categoría), el
  // campo tiene que acompañar.
  useEffect(() => setTexto(consultaUrl), [consultaUrl])

  useEffect(() => {
    if (texto === consultaUrl) return

    const temporizador = setTimeout(() => {
      const siguientes = new URLSearchParams(parametros)
      if (texto.trim()) siguientes.set('q', texto.trim())
      else siguientes.delete('q')

      const cadena = siguientes.toString()
      iniciar(() => {
        // scroll: false para que no salte al tope entre tecla y tecla.
        router.replace(cadena ? `${pathname}?${cadena}` : pathname, {
          scroll: false,
        })
      })
    }, 300)

    return () => clearTimeout(temporizador)
  }, [texto, consultaUrl, parametros, pathname, router])

  return (
    <div className="relative max-w-sm flex-1">
      <IconoLupa className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-base text-texto-tenue" />
      <input
        type="search"
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        placeholder="Buscar por nombre, arma o autor…"
        aria-label="Buscar builds"
        className="campo pl-9 pr-9"
      />
      {texto && (
        <button
          type="button"
          onClick={() => setTexto('')}
          aria-label="Limpiar la búsqueda"
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-texto-tenue transition-colors hover:bg-superficie-alta hover:text-texto"
        >
          <IconoCruz className="text-sm" />
        </button>
      )}
    </div>
  )
}
