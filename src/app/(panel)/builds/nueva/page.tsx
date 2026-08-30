import Link from 'next/link'

import { CreadorBuild } from '@/components/builds/CreadorBuild'

export const metadata = { title: 'Nueva build' }

export default function NuevaBuild() {
  return (
    <div className="space-y-5">
      <div>
        <Link
          href="/builds"
          className="text-sm text-texto-suave transition-colors hover:text-texto"
        >
          ← Volver a builds
        </Link>
        <h1 className="mt-1 text-xl font-bold">Nueva build</h1>
      </div>

      <CreadorBuild />
    </div>
  )
}
