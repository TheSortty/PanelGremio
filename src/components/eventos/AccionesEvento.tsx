'use client'

import { useState, useTransition } from 'react'

import { eliminarEvento } from '@/actions/eventos'
import { Aviso } from '@/components/ui/Aviso'
import { Boton } from '@/components/ui/Boton'
import { IconoPapelera } from '@/components/ui/Iconos'
import { Modal } from '@/components/ui/Modal'

export function AccionesEvento({
  eventoId,
  titulo,
}: {
  eventoId: string
  titulo: string
}) {
  const [confirmando, setConfirmando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pendiente, iniciar] = useTransition()

  return (
    <>
      <Boton variante="peligro" tamano="sm" onClick={() => setConfirmando(true)}>
        <IconoPapelera className="text-sm" />
        Eliminar
      </Boton>

      {error && (
        <Aviso tono="error" className="mt-2">
          {error}
        </Aviso>
      )}

      <Modal
        abierto={confirmando}
        onCerrar={() => setConfirmando(false)}
        titulo="Eliminar evento"
      >
        <p className="text-sm text-texto-suave">
          Se va a eliminar <span className="font-medium text-texto">{titulo}</span>{' '}
          con todas sus confirmaciones. No se puede deshacer.
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
                const r = await eliminarEvento(eventoId)
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
