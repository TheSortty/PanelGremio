import Link from 'next/link'

export const metadata = { title: 'Error de acceso' }

export default async function ErrorAuth({
  searchParams,
}: {
  searchParams: Promise<{ motivo?: string }>
}) {
  const { motivo } = await searchParams

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="text-2xl font-bold">No pudimos iniciar tu sesión</h1>
      <p className="max-w-md text-sm text-texto-tenue">
        {motivo || 'Ocurrió un problema durante la autenticación.'}
      </p>
      <Link
        href="/login"
        className="mt-2 rounded-lg bg-acento px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-acento-fuerte"
      >
        Volver a intentar
      </Link>
    </main>
  )
}
