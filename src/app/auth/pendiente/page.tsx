import { redirect } from 'next/navigation'

import { BotonSalir } from '@/components/auth/BotonSalir'
import { FormularioSolicitud } from '@/components/auth/FormularioSolicitud'
import { Aviso } from '@/components/ui/Aviso'
import { Blason } from '@/components/ui/Iconos'
import { obtenerPerfil } from '@/lib/auth/sesion'
import { obtenerSolicitud } from '@/lib/data/solicitudes'

export const metadata = { title: 'Solicitud de ingreso' }

/**
 * La puerta del gremio.
 *
 * Antes esta pantalla solo decía "esperá". Ahora es donde se completa la
 * solicitud, que es lo que el staff necesita para decidir: sin datos, esperar
 * no sirve de nada y el postulante termina yendo igual a Discord a preguntar.
 *
 * La solicitud se puede corregir mientras nadie la haya resuelto, así que al
 * volver acá el formulario aparece con lo que ya cargó.
 */
export default async function Pendiente() {
  const perfil = await obtenerPerfil()

  if (!perfil) redirect('/login')
  if (perfil.status === 'active') redirect('/panel')

  const rechazado = perfil.status === 'rejected'
  const solicitud = await obtenerSolicitud(perfil.id)

  return (
    <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <header className="mb-7 text-center">
        <Blason className="mx-auto text-4xl text-acento" />
        <h1 className="mt-3 text-2xl font-semibold uppercase tracking-[0.18em]">
          Solicitud de ingreso
        </h1>
        <p className="mt-2 text-sm text-texto-suave">
          Entraste como{' '}
          <span className="font-medium text-texto">{perfil.name}</span>.
        </p>
      </header>

      {rechazado ? (
        <div className="space-y-5">
          <Aviso tono="error">
            Tu solicitud fue rechazada. El gremio se reserva el derecho de
            admisión; si creés que hubo un error, hablá con la conducción.
          </Aviso>
          <div className="flex justify-center">
            <BotonSalir variante="secundario" />
          </div>
        </div>
      ) : (
        <div className="space-y-5">
          <Aviso tono={solicitud ? 'exito' : 'info'}>
            {solicitud ? (
              <>
                Tu solicitud ya está enviada y el staff la va a revisar. Podés
                corregir lo que quieras y volver a enviarla.
              </>
            ) : (
              <>
                Completá el formulario para que el staff pueda revisarte. Los
                datos tienen que ser exactos, y las dos capturas son
                obligatorias.
              </>
            )}
          </Aviso>

          <FormularioSolicitud uid={perfil.id} solicitud={solicitud} />

          <div className="flex justify-center pt-2">
            <BotonSalir variante="secundario" />
          </div>
        </div>
      )}
    </main>
  )
}
