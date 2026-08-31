'use client'

import { useState } from 'react'

import { IconoDiscord } from '@/components/ui/Iconos'
import { createClient } from '@/lib/supabase/client'

export function BotonDiscord({ redirigirA }: { redirigirA: string }) {
  const [cargando, setCargando] = useState(false)

  async function entrar() {
    setCargando(true)
    const supabase = createClient()

    const destino = new URL('/auth/callback', window.location.origin)
    destino.searchParams.set('next', redirigirA)

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'discord',
      options: { redirectTo: destino.toString() },
    })

    // Si sale bien, el navegador ya se fue a Discord y esto no llega a correr.
    if (error) setCargando(false)
  }

  return (
    <button
      type="button"
      onClick={entrar}
      disabled={cargando}
      className="inline-flex w-full items-center justify-center gap-2.5 rounded-lg bg-[#5865F2] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#4752c4] disabled:opacity-50"
    >
      <IconoDiscord className="text-xl" />
      {cargando ? 'Redirigiendo…' : 'Continuar con Discord'}
    </button>
  )
}
