import Link from 'next/link'

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
      <svg className="size-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M11.979 0C5.678 0 .511 4.86.022 11.037l6.432 2.658c.545-.371 1.203-.59 1.912-.59.063 0 .125.004.188.006l2.861-4.142V8.91c0-2.495 2.028-4.524 4.524-4.524 2.494 0 4.524 2.031 4.524 4.527 0 2.495-2.03 4.525-4.524 4.525h-.105l-4.076 2.911c0 .052.004.105.004.159 0 1.875-1.515 3.396-3.39 3.396-1.635 0-3.016-1.173-3.331-2.727L.436 15.27C1.862 20.307 6.486 24 11.979 24c6.627 0 11.999-5.373 11.999-12S18.605 0 11.979 0zM7.54 18.21l-1.473-.61c.262.543.714.999 1.314 1.25.978.408 2.086-.056 2.494-1.036.198-.474.199-.997.002-1.472-.196-.474-.564-.844-1.036-1.042-.47-.197-.968-.19-1.407-.019l1.522.63c.719.3 1.058 1.129.758 1.847-.3.719-1.13 1.058-1.848.758l-.326-.306zm11.415-9.303c0-1.662-1.353-3.015-3.015-3.015-1.665 0-3.015 1.353-3.015 3.015 0 1.665 1.35 3.015 3.015 3.015 1.663 0 3.015-1.35 3.015-3.015zm-5.273-.005c0-1.252 1.013-2.266 2.265-2.266 1.249 0 2.266 1.014 2.266 2.266 0 1.251-1.017 2.265-2.266 2.265-1.253 0-2.265-1.014-2.265-2.265z" />
      </svg>
      Continuar con Steam
    </Link>
  )
}
