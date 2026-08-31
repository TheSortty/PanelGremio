import Link from 'next/link'

import { IconoSteam } from '@/components/ui/Iconos'

/**
 * El flujo de Steam es una redirección del servidor, no hace falta JavaScript:
 * un enlace común a la ruta que arma la petición OpenID alcanza.
 */
export function BotonSteam() {
  return (
    <Link
      href="/auth/steam"
      className="inline-flex w-full items-center justify-center gap-2.5 rounded-lg bg-[#1b2838] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#2a475e]"
    >
      <IconoSteam className="text-xl" />
      Continuar con Steam
    </Link>
  )
}
