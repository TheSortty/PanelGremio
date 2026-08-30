'use client'

import { useEffect } from 'react'

import { Aviso } from '@/components/ui/Aviso'
import { Boton } from '@/components/ui/Boton'

/**
 * Límite de error de las secciones privadas.
 *
 * Sin esto, cualquier fallo al consultar la base tira la pantalla entera de
 * Next en modo desarrollo, o una página en blanco en producción.
 */
export default function ErrorPanel({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Error en el panel:', error)
  }, [error])

  return (
    <div className="mx-auto max-w-md space-y-4 py-16 text-center">
      <h2 className="text-lg font-bold">Algo se rompió</h2>
      <Aviso tono="error">{error.message}</Aviso>
      <Boton onClick={reset}>Reintentar</Boton>
    </div>
  )
}
