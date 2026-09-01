import Link from 'next/link'
import { redirect } from 'next/navigation'

import { FormularioEvento } from '@/components/eventos/FormularioEvento'
import { exigirMiembroActivo } from '@/lib/auth/sesion'
import { esOficial } from '@/lib/domain/roles'

export const metadata = { title: 'Nuevo evento' }

export default async function NuevoEvento() {
  const perfil = await exigirMiembroActivo()

  // Un Miembro participa de los eventos; convocarlos es de Oficial para arriba.
  if (!esOficial(perfil.role)) redirect('/eventos')

  return (
    <div className="space-y-5">
      <div>
        <Link
          href="/eventos"
          className="text-sm text-texto-suave transition-colors hover:text-texto"
        >
          ← Volver a eventos
        </Link>
        <h1 className="mt-1 text-2xl font-bold">Nuevo evento</h1>
      </div>

      <FormularioEvento />
    </div>
  )
}
