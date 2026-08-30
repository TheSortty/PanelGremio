import Link from 'next/link'

export default function NoEncontrado() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
      <p className="text-sm font-medium text-acento">404</p>
      <h1 className="text-2xl font-bold">Esta página no existe</h1>
      <p className="max-w-sm text-sm text-texto-tenue">
        El enlace puede estar roto o la página pudo haberse movido.
      </p>
      <Link
        href="/panel"
        className="mt-2 rounded-lg bg-acento px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-acento-fuerte"
      >
        Volver al panel
      </Link>
    </main>
  )
}
