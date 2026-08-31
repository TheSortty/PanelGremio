'use client'

import { useState, useTransition } from 'react'

import { cambiarContrasena, cambiarNombre } from '@/actions/perfil'
import { Aviso } from '@/components/ui/Aviso'
import { Boton } from '@/components/ui/Boton'
import { Card, CardTitulo } from '@/components/ui/Card'

type Estado = { tono: 'exito' | 'error'; texto: string } | null

export function FormularioNombre({ nombreActual }: { nombreActual: string }) {
  const [nombre, setNombre] = useState(nombreActual)
  const [estado, setEstado] = useState<Estado>(null)
  const [enviando, iniciar] = useTransition()

  const sinCambios = nombre.trim() === nombreActual

  return (
    <Card>
      <CardTitulo>Nombre de personaje</CardTitulo>

      <form
        onSubmit={(e) => {
          e.preventDefault()
          setEstado(null)
          iniciar(async () => {
            const r = await cambiarNombre(nombre)
            setEstado(
              r.ok
                ? { tono: 'exito', texto: r.mensaje }
                : { tono: 'error', texto: r.error },
            )
          })
        }}
        className="space-y-3"
      >
        <div>
          <label htmlFor="nombre" className="mb-1 block text-xs text-texto-suave">
            Cómo te ve el resto del gremio
          </label>
          <input
            id="nombre"
            className="campo"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            minLength={2}
            maxLength={36}
            required
          />
          <p className="mt-1 text-xs text-texto-tenue">
            Entre 2 y 36 caracteres. No puede repetirse con el de otro miembro.
          </p>
        </div>

        {estado && <Aviso tono={estado.tono}>{estado.texto}</Aviso>}

        <Boton type="submit" disabled={enviando || sinCambios}>
          {enviando ? 'Guardando…' : 'Guardar nombre'}
        </Boton>
      </form>
    </Card>
  )
}

export function FormularioContrasena({ tieneClave }: { tieneClave: boolean }) {
  const [actual, setActual] = useState('')
  const [nueva, setNueva] = useState('')
  const [repetida, setRepetida] = useState('')
  const [estado, setEstado] = useState<Estado>(null)
  const [enviando, iniciar] = useTransition()

  if (!tieneClave) {
    return (
      <Card>
        <CardTitulo>Contraseña</CardTitulo>
        <p className="text-sm text-texto-tenue">
          Esta cuenta entra con un proveedor externo (Discord o Steam) y no tiene
          contraseña propia. Si querés cambiarla, hacelo en ese proveedor.
        </p>
      </Card>
    )
  }

  const coinciden = nueva === repetida
  const listo = actual.length > 0 && nueva.length >= 8 && coinciden

  return (
    <Card>
      <CardTitulo>Cambiar contraseña</CardTitulo>

      <form
        onSubmit={(e) => {
          e.preventDefault()
          setEstado(null)

          if (!coinciden) {
            setEstado({ tono: 'error', texto: 'Las contraseñas nuevas no coinciden.' })
            return
          }

          iniciar(async () => {
            const r = await cambiarContrasena(actual, nueva)
            if (r.ok) {
              setEstado({ tono: 'exito', texto: r.mensaje })
              setActual('')
              setNueva('')
              setRepetida('')
            } else {
              setEstado({ tono: 'error', texto: r.error })
            }
          })
        }}
        className="space-y-3"
      >
        <div>
          <label htmlFor="actual" className="mb-1 block text-xs text-texto-suave">
            Contraseña actual
          </label>
          <input
            id="actual"
            type="password"
            className="campo"
            value={actual}
            onChange={(e) => setActual(e.target.value)}
            autoComplete="current-password"
            required
          />
        </div>

        <div>
          <label htmlFor="nueva" className="mb-1 block text-xs text-texto-suave">
            Contraseña nueva
          </label>
          <input
            id="nueva"
            type="password"
            className="campo"
            value={nueva}
            onChange={(e) => setNueva(e.target.value)}
            minLength={8}
            autoComplete="new-password"
            required
          />
          <p className="mt-1 text-xs text-texto-tenue">Mínimo 8 caracteres.</p>
        </div>

        <div>
          <label htmlFor="repetida" className="mb-1 block text-xs text-texto-suave">
            Repetir la nueva
          </label>
          <input
            id="repetida"
            type="password"
            className="campo"
            value={repetida}
            onChange={(e) => setRepetida(e.target.value)}
            minLength={8}
            autoComplete="new-password"
            required
          />
          {repetida.length > 0 && !coinciden && (
            <p className="mt-1 text-xs text-peligro">No coinciden.</p>
          )}
        </div>

        {estado && <Aviso tono={estado.tono}>{estado.texto}</Aviso>}

        <Boton type="submit" disabled={enviando || !listo}>
          {enviando ? 'Cambiando…' : 'Cambiar contraseña'}
        </Boton>
      </form>
    </Card>
  )
}
