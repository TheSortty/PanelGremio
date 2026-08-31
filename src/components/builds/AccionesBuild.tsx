'use client'

import Link from 'next/link'
import { useState, useTransition } from 'react'

import { eliminarBuild } from '@/actions/builds'
import { Aviso } from '@/components/ui/Aviso'
import { Boton } from '@/components/ui/Boton'
import { IconoPapelera, IconoPluma } from '@/components/ui/Iconos'
import { Modal } from '@/components/ui/Modal'

/**
 * Editar y eliminar una build.
 *
 * La versión anterior no tenía ninguna de las dos: una build creada quedaba
 * fija para siempre y solo se podía borrar desde la base.
 */
export function AccionesBuild({
  buildId,
  titulo,
}: {
  buildId: string
  titulo: string
}) {
  const [confirmando, setConfirmando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pendiente, iniciar] = useTransition()

  return (
    <>
      <div className="flex gap-2">
        <Link href={`/builds/${buildId}/editar`}>
          <Boton variante="secundario" tamano="sm">
            <IconoPluma className="text-sm" />
            Editar
          </Boton>
        </Link>
        <Boton
          variante="peligro"
          tamano="sm"
          onClick={() => setConfirmando(true)}
        >
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
        titulo="Eliminar build"
      >
        <p className="text-sm text-texto-suave">
          Se va a eliminar <span className="font-medium text-texto">{titulo}</span>.
          Esta acción no se puede deshacer.
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
                const r = await eliminarBuild(buildId)
                // Si sale bien redirige a /builds y esto no se ejecuta.
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
