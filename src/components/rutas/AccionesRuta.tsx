'use client'

import Link from 'next/link'
import { useState, useTransition } from 'react'

import { eliminarRuta } from '@/actions/rutas'
import { Aviso } from '@/components/ui/Aviso'
import { Boton } from '@/components/ui/Boton'
import { IconoPapelera, IconoPluma } from '@/components/ui/Iconos'
import { Modal } from '@/components/ui/Modal'

export function AccionesRuta({
  rutaId,
  nombre,
}: {
  rutaId: string
  nombre: string
}) {
  const [confirmando, setConfirmando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pendiente, iniciar] = useTransition()

  return (
    <>
      <div className="flex shrink-0 gap-2">
        <Link href={`/rutas/${rutaId}/editar`}>
          <Boton variante="secundario" tamano="sm">
            <IconoPluma className="text-sm" />
            Editar
          </Boton>
        </Link>
        <Boton variante="peligro" tamano="sm" onClick={() => setConfirmando(true)}>
          <IconoPapelera className="text-sm" />
          Eliminar
        </Boton>
      </div>

      {error && (
        <Aviso tono="error" className="mt-2">
          {error}
        </Aviso>
      )}

      <Modal
        abierto={confirmando}
        onCerrar={() => setConfirmando(false)}
        titulo="Eliminar ruta"
      >
        <p className="text-sm text-texto-suave">
          Se va a eliminar <span className="font-medium text-texto">{nombre}</span>{' '}
          con todos sus pasos. No se puede deshacer.
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <Boton variante="secundario" onClick={() => setConfirmando(false)}>
            Cancelar
          </Boton>
          <Boton
            variante="peligro"
            disabled={pendiente}
            onClick={() =>
              iniciar(async () => {
                const r = await eliminarRuta(rutaId)
                // Si sale bien redirige a /rutas y esto no se ejecuta.
                if (r && !r.ok) {
                  setError(r.error)
                  setConfirmando(false)
                }
              })
            }
          >
            {pendiente ? 'Eliminando…' : 'Eliminar'}
          </Boton>
        </div>
      </Modal>
    </>
  )
}
