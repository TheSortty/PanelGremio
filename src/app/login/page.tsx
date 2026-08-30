import { BotonDiscord } from '@/components/auth/BotonDiscord'
import { BotonSteam } from '@/components/auth/BotonSteam'
import { FormularioAcceso } from '@/components/auth/FormularioAcceso'

export const metadata = { title: 'Acceso' }

export default async function Login({
  searchParams,
}: {
  searchParams: Promise<{ redirigir?: string }>
}) {
  const { redirigir } = await searchParams

  // Solo rutas internas: un destino absoluto acá permitiría mandar a un usuario
  // recién logueado a un sitio externo desde un enlace preparado.
  const destino =
    redirigir?.startsWith('/') && !redirigir.startsWith('//')
      ? redirigir
      : '/panel'

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <header className="mb-7 text-center">
          <h1 className="text-2xl font-bold tracking-tight">Panel del Gremio</h1>
          <p className="mt-1 text-sm text-texto-tenue">
            Se requiere autorización para continuar.
          </p>
        </header>

        <div className="rounded-panel border border-borde-suave bg-superficie p-6 shadow-lg">
          <div className="space-y-2.5">
            <BotonDiscord redirigirA={destino} />
            <BotonSteam />
          </div>

          <div className="my-5 flex items-center gap-3">
            <span className="h-px flex-1 bg-borde" />
            <span className="text-xs text-texto-tenue">o con tu correo</span>
            <span className="h-px flex-1 bg-borde" />
          </div>

          <FormularioAcceso redirigirA={destino} />
        </div>

        <p className="mt-5 text-center text-xs text-texto-tenue">
          Las cuentas nuevas necesitan la aprobación de un administrador antes
          de poder entrar al panel.
        </p>
      </div>
    </main>
  )
}
