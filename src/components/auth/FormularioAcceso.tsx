'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

import { Aviso } from '@/components/ui/Aviso'
import { Boton } from '@/components/ui/Boton'
import { createClient } from '@/lib/supabase/client'

type Modo = 'entrar' | 'registrarse'

/**
 * Acceso con correo y contraseña.
 *
 * Reemplaza al login de la versión anterior, que pedía solo un nombre de
 * usuario: se escribía "Admin" y se entraba como Maestro del Gremio. No había
 * contraseñas en ninguna parte del sistema.
 *
 * Las credenciales las maneja Supabase Auth (hash con bcrypt, verificación de
 * correo, límite de intentos): no se guarda ni se compara ninguna contraseña
 * en este código.
 */
export function FormularioAcceso({ redirigirA }: { redirigirA: string }) {
  const router = useRouter()
  const [modo, setModo] = useState<Modo>('entrar')
  const [correo, setCorreo] = useState('')
  const [contrasena, setContrasena] = useState('')
  const [nombre, setNombre] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [aviso, setAviso] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)

  async function enviar(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setAviso(null)
    setEnviando(true)

    const supabase = createClient()

    try {
      if (modo === 'entrar') {
        const { error } = await supabase.auth.signInWithPassword({
          email: correo.trim(),
          password: contrasena,
        })
        if (error) throw error

        // refresh() antes de push(): obliga a los Server Components a
        // re-renderizarse con la cookie de sesión ya escrita.
        router.refresh()
        router.push(redirigirA)
        return
      }

      const { data, error } = await supabase.auth.signUp({
        email: correo.trim(),
        password: contrasena,
        options: {
          data: { nombre_gremio: nombre.trim() },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })
      if (error) throw error

      // Si el proyecto exige confirmar el correo, no viene sesión todavía.
      if (!data.session) {
        setAviso(
          'Te mandamos un correo para confirmar la cuenta. Después de confirmarla, un administrador tiene que aprobar tu acceso.',
        )
        setEnviando(false)
        return
      }

      router.refresh()
      router.push('/auth/pendiente')
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'No pudimos completar la operación.',
      )
      setEnviando(false)
    }
  }

  return (
    <form onSubmit={enviar} className="space-y-3">
      {modo === 'registrarse' && (
        <div>
          <label htmlFor="nombre" className="mb-1 block text-xs text-texto-suave">
            Nombre de personaje
          </label>
          <input
            id="nombre"
            className="campo"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            required
            minLength={2}
            maxLength={36}
            autoComplete="nickname"
            placeholder="Tu nombre en Albion"
          />
        </div>
      )}

      <div>
        <label htmlFor="correo" className="mb-1 block text-xs text-texto-suave">
          Correo
        </label>
        <input
          id="correo"
          type="email"
          className="campo"
          value={correo}
          onChange={(e) => setCorreo(e.target.value)}
          required
          autoComplete="email"
          placeholder="vos@ejemplo.com"
        />
      </div>

      <div>
        <label
          htmlFor="contrasena"
          className="mb-1 block text-xs text-texto-suave"
        >
          Contraseña
        </label>
        <input
          id="contrasena"
          type="password"
          className="campo"
          value={contrasena}
          onChange={(e) => setContrasena(e.target.value)}
          required
          minLength={8}
          autoComplete={modo === 'entrar' ? 'current-password' : 'new-password'}
          placeholder={modo === 'registrarse' ? 'Mínimo 8 caracteres' : '••••••••'}
        />
      </div>

      {error && <Aviso tono="error">{error}</Aviso>}
      {aviso && <Aviso tono="exito">{aviso}</Aviso>}

      <Boton type="submit" disabled={enviando} className="w-full">
        {enviando
          ? 'Un momento…'
          : modo === 'entrar'
            ? 'Entrar'
            : 'Crear cuenta'}
      </Boton>

      <p className="text-center text-xs text-texto-tenue">
        {modo === 'entrar' ? '¿No tenés cuenta?' : '¿Ya tenés cuenta?'}{' '}
        <button
          type="button"
          onClick={() => {
            setModo(modo === 'entrar' ? 'registrarse' : 'entrar')
            setError(null)
            setAviso(null)
          }}
          className="font-medium text-acento hover:underline"
        >
          {modo === 'entrar' ? 'Registrate' : 'Iniciá sesión'}
        </button>
      </p>
    </form>
  )
}
