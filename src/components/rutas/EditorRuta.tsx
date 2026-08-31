'use client'

import { useState, useTransition } from 'react'

import { actualizarRuta, crearRuta } from '@/actions/rutas'
import { Aviso } from '@/components/ui/Aviso'
import { Boton } from '@/components/ui/Boton'
import { Card, CardTitulo } from '@/components/ui/Card'
import { IconoCruz, IconoMas } from '@/components/ui/Iconos'
import {
  DESCRIPCIONES_PASO,
  ETIQUETAS_PASO,
  TIPOS_PASO,
  contarPortales,
  type Paso,
  type Ruta,
  type TipoPaso,
} from '@/lib/domain/rutas'
import { cn } from '@/lib/utils/cn'

/**
 * Alta y edición de una ruta.
 *
 * Los pasos se manejan en el estado y se guardan de una sola vez con la ruta:
 * son de ella y no tienen sentido sueltos, así que no hace falta una llamada al
 * servidor por cada uno mientras se arma el recorrido.
 */
export function EditorRuta({ ruta }: { ruta?: Ruta }) {
  const [nombre, setNombre] = useState(ruta?.name ?? '')
  const [origen, setOrigen] = useState(ruta?.origin ?? '')
  const [destino, setDestino] = useState(ruta?.destination ?? '')
  const [notas, setNotas] = useState(ruta?.notes ?? '')
  const [pasos, setPasos] = useState<Paso[]>(ruta?.steps ?? [])
  const [error, setError] = useState<string | null>(null)
  const [guardando, iniciar] = useTransition()

  function agregar(kind: TipoPaso) {
    setPasos((actuales) => [...actuales, { name: '', kind }])
  }

  function cambiar(indice: number, cambios: Partial<Paso>) {
    setPasos((actuales) =>
      actuales.map((p, i) => (i === indice ? { ...p, ...cambios } : p)),
    )
  }

  function quitar(indice: number) {
    setPasos((actuales) => actuales.filter((_, i) => i !== indice))
  }

  /** Mueve un paso una posición. Es la forma más simple de reordenar sin arrastrar. */
  function mover(indice: number, direccion: -1 | 1) {
    const destinoIdx = indice + direccion
    if (destinoIdx < 0 || destinoIdx >= pasos.length) return

    setPasos((actuales) => {
      const copia = [...actuales]
      const [movido] = copia.splice(indice, 1)
      copia.splice(destinoIdx, 0, movido!)
      return copia
    })
  }

  function guardar() {
    setError(null)

    // Un paso sin nombre no aporta nada al recorrido; se descarta en vez de
    // rechazar el guardado entero por una fila que quedó vacía.
    const utiles = pasos.filter((p) => p.name.trim())

    const entrada = {
      name: nombre,
      origin: origen,
      destination: destino,
      notes: notas,
      steps: utiles,
    }

    iniciar(async () => {
      const r = ruta
        ? await actualizarRuta(ruta.id, entrada)
        : await crearRuta(entrada)
      // Si sale bien redirige y esto no llega a ejecutarse.
      if (r && !r.ok) setError(r.error)
    })
  }

  const portales = contarPortales(pasos.filter((p) => p.name.trim()))
  const listo = nombre.trim().length >= 2 && origen.trim().length >= 2

  return (
    <div className="space-y-5">
      <Card>
        <CardTitulo>La ruta</CardTitulo>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label htmlFor="nombre" className="mb-1 block text-sm text-texto-suave">
              Nombre
            </label>
            <input
              id="nombre"
              className="campo"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              maxLength={120}
              placeholder="Fort Sterling al norte avaloniano"
            />
          </div>

          <div>
            <label htmlFor="origen" className="mb-1 block text-sm text-texto-suave">
              Desde qué mapa se entra
            </label>
            <input
              id="origen"
              className="campo"
              value={origen}
              onChange={(e) => setOrigen(e.target.value)}
              maxLength={120}
              placeholder="Fort Sterling"
            />
          </div>

          <div>
            <label htmlFor="destino" className="mb-1 block text-sm text-texto-suave">
              A dónde se sale <span className="text-texto-tenue">(opcional)</span>
            </label>
            <input
              id="destino"
              className="campo"
              value={destino}
              onChange={(e) => setDestino(e.target.value)}
              maxLength={120}
              placeholder="Todavía sin explorar"
            />
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="notas" className="mb-1 block text-sm text-texto-suave">
              Notas <span className="text-texto-tenue">(opcional)</span>
            </label>
            <textarea
              id="notas"
              className="campo min-h-24 resize-y"
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              maxLength={4000}
              placeholder="Cuándo conviene usarla, qué portal cierra primero, con cuánto peso se puede pasar…"
            />
          </div>
        </div>
      </Card>

      <Card>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <CardTitulo className="mb-0">El recorrido</CardTitulo>
          <p className="text-sm text-texto-tenue">
            <span className="font-semibold tabular-nums text-acento">
              {portales}
            </span>{' '}
            portal{portales === 1 ? '' : 'es'} · {pasos.length} paso
            {pasos.length === 1 ? '' : 's'}
          </p>
        </div>

        {pasos.length === 0 ? (
          <p className="rounded-lg border border-dashed border-borde px-4 py-8 text-center text-sm text-texto-tenue">
            Agregá los pasos en el orden en que se recorren, desde la entrada
            hasta la salida.
          </p>
        ) : (
          <ol className="space-y-2.5">
            {pasos.map((paso, i) => (
              <li
                key={i}
                className="flex flex-wrap items-start gap-2 rounded-lg border border-borde-suave bg-fondo p-3"
              >
                <span className="grabado mt-2.5 w-6 shrink-0 text-center">
                  {i + 1}
                </span>

                <select
                  className="campo w-auto shrink-0"
                  value={paso.kind}
                  onChange={(e) =>
                    cambiar(i, { kind: e.target.value as TipoPaso })
                  }
                  aria-label={`Tipo del paso ${i + 1}`}
                  title={DESCRIPCIONES_PASO[paso.kind]}
                >
                  {TIPOS_PASO.map((t) => (
                    <option key={t} value={t}>
                      {ETIQUETAS_PASO[t]}
                    </option>
                  ))}
                </select>

                <input
                  className="campo min-w-40 flex-1"
                  value={paso.name}
                  onChange={(e) => cambiar(i, { name: e.target.value })}
                  maxLength={120}
                  placeholder={
                    paso.kind === 'portal'
                      ? 'Nombre del portal'
                      : paso.kind === 'salida'
                        ? 'Dónde se sale'
                        : 'Nombre del mapa'
                  }
                  aria-label={`Nombre del paso ${i + 1}`}
                />

                <input
                  className="campo min-w-40 flex-1"
                  value={paso.notes ?? ''}
                  onChange={(e) => cambiar(i, { notes: e.target.value })}
                  maxLength={500}
                  placeholder="Nota (opcional)"
                  aria-label={`Nota del paso ${i + 1}`}
                />

                <div className="flex shrink-0 items-center gap-1">
                  <Boton
                    variante="fantasma"
                    tamano="sm"
                    onClick={() => mover(i, -1)}
                    disabled={i === 0}
                    aria-label={`Subir el paso ${i + 1}`}
                  >
                    ↑
                  </Boton>
                  <Boton
                    variante="fantasma"
                    tamano="sm"
                    onClick={() => mover(i, 1)}
                    disabled={i === pasos.length - 1}
                    aria-label={`Bajar el paso ${i + 1}`}
                  >
                    ↓
                  </Boton>
                  <Boton
                    variante="fantasma"
                    tamano="sm"
                    onClick={() => quitar(i)}
                    aria-label={`Quitar el paso ${i + 1}`}
                    className="text-peligro hover:bg-peligro-fondo"
                  >
                    <IconoCruz className="text-sm" />
                  </Boton>
                </div>
              </li>
            ))}
          </ol>
        )}

        <div className="mt-4 flex flex-wrap gap-2">
          {TIPOS_PASO.map((t) => (
            <Boton
              key={t}
              variante="secundario"
              tamano="sm"
              onClick={() => agregar(t)}
              title={DESCRIPCIONES_PASO[t]}
            >
              <IconoMas className="text-sm" />
              {ETIQUETAS_PASO[t]}
            </Boton>
          ))}
        </div>
      </Card>

      {error && <Aviso tono="error">{error}</Aviso>}

      <div className={cn('flex justify-end gap-2')}>
        <Boton onClick={guardar} disabled={guardando || !listo}>
          {guardando ? 'Guardando…' : ruta ? 'Guardar cambios' : 'Crear ruta'}
        </Boton>
      </div>
    </div>
  )
}
