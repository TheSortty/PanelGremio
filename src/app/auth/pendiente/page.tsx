import { redirect } from 'next/navigation'

import { BotonSalir } from '@/components/auth/BotonSalir'
import { obtenerPerfil } from '@/lib/auth/sesion'

export const metadata = { title: 'Solicitud pendiente' }

/**
 * Pantalla para quien ya tiene cuenta pero todavía no fue aprobado.
 *
 * En la versión anterior este estado no tenía a dónde ir: el registro creaba
 * el usuario como 'pending' y el login lo rechazaba con "usuario no encontrado
 * o no activo", sin distinguir entre esperar aprobación y no existir.
 */
export default async function Pendiente() {
  const perfil = await obtenerPerfil()

  if (!perfil) redirect('/login')
  if (perfil.status === 'active') redirect('/panel')

  const rechazado = perfil.status === 'rejected'

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-5 px-6 text-center">
      <div className="max-w-md space-y-3">
        <h1 className="text-2xl font-bold">
          {rechazado ? 'Tu solicitud fue rechazada' : 'Tu solicitud está pendiente'}
        </h1>
        <p className="text-sm text-texto-suave">
          {rechazado ? (
            <>
              Un administrador no aprobó el acceso de{' '}
              <span className="font-medium text-texto">{perfil.name}</span>. Si
              creés que es un error, hablá con la conducción del gremio.
            </>
          ) : (
            <>
              Entraste como{' '}
              <span className="font-medium text-texto">{perfil.name}</span>. Un
              administrador tiene que aprobar tu cuenta antes de que puedas usar
              el panel.
            </>
          )}
        </p>
      </div>
      <BotonSalir variante="secundario" />
    </main>
  )
}
