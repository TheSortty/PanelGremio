'use client'

import { useState, useTransition } from 'react'
import Markdown from 'react-markdown'

import { guardarGuia } from '@/actions/guia'
import { Aviso } from '@/components/ui/Aviso'
import { Boton } from '@/components/ui/Boton'
import { Card, CardTitulo } from '@/components/ui/Card'
import { IconoPluma } from '@/components/ui/Iconos'
import { Vacio } from '@/components/ui/Vacio'

/**
 * Guía de la build, escrita a mano.
 *
 * Antes la generaba un modelo. Se sacó porque una guía de build es criterio
 * —cuándo entrar, a quién no pelear, qué comprar primero—, y eso lo tiene quien
 * la juega. Lo generado sonaba a manual y había que leerlo entero para
 * descubrir que no decía nada de esta build en particular.
 *
 * Se mantienen dos cosas de la versión anterior porque estaban bien:
 *
 *   - el markdown se renderiza con react-markdown, no con un replace de \n por
 *     <br /> metido con dangerouslySetInnerHTML;
 *   - la guía vive en la base, así que la escribe uno y la lee todo el gremio.
 */
export function GuiaBuild({
  buildId,
  guiaInicial,
  puedeEditar,
}: {
  buildId: string
  guiaInicial: string | null
  puedeEditar: boolean
}) {
  const [guia, setGuia] = useState(guiaInicial ?? '')
  const [borrador, setBorrador] = useState(guiaInicial ?? '')
  const [editando, setEditando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [guardando, iniciar] = useTransition()

  function guardar() {
    setError(null)
    iniciar(async () => {
      const r = await guardarGuia(buildId, borrador)
      if (r.ok) {
        setGuia(r.guia)
        setEditando(false)
      } else {
        setError(r.error)
      }
    })
  }

  if (editando) {
    return (
      <Card>
        <CardTitulo>Guía de la build</CardTitulo>

        <textarea
          className="campo min-h-80 resize-y font-mono text-sm leading-relaxed"
          value={borrador}
          onChange={(e) => setBorrador(e.target.value)}
          maxLength={20000}
          autoFocus
          placeholder={
            'Cómo se juega, contra qué funciona y contra qué no.\n\n' +
            '## Rotación\n1. Abrí con Q\n2. …\n\n' +
            '## Evitá\n- Builds de daño mágico'
          }
        />

        <p className="mt-2 text-xs text-texto-tenue">
          Acepta markdown: <code>##</code> para títulos, <code>-</code> para
          listas, <code>**negrita**</code>. {borrador.length}/20.000
        </p>

        {error && (
          <Aviso tono="error" className="mt-3">
            {error}
          </Aviso>
        )}

        <div className="mt-4 flex gap-2">
          <Boton onClick={guardar} disabled={guardando}>
            {guardando ? 'Guardando…' : 'Guardar guía'}
          </Boton>
          <Boton
            variante="secundario"
            onClick={() => {
              setBorrador(guia)
              setEditando(false)
              setError(null)
            }}
            disabled={guardando}
          >
            Cancelar
          </Boton>
        </div>
      </Card>
    )
  }

  return (
    <Card>
      <div className="mb-4 flex items-center justify-between gap-3">
        <CardTitulo className="mb-0">Guía de la build</CardTitulo>
        {puedeEditar && guia && (
          <Boton
            variante="secundario"
            tamano="sm"
            onClick={() => setEditando(true)}
          >
            <IconoPluma className="text-sm" />
            Editar
          </Boton>
        )}
      </div>

      {guia ? (
        <div className="markdown">
          <Markdown>{guia}</Markdown>
        </div>
      ) : (
        <Vacio
          icono={IconoPluma}
          titulo="Todavía no hay guía"
          descripcion={
            puedeEditar
              ? 'Contá cómo se juega: la rotación, contra qué funciona y contra qué no.'
              : 'El autor de la build todavía no escribió una.'
          }
          accion={
            puedeEditar ? (
              <Boton onClick={() => setEditando(true)}>
                <IconoPluma className="text-sm" />
                Escribir la guía
              </Boton>
            ) : undefined
          }
        />
      )}

      {error && (
        <Aviso tono="error" className="mt-3">
          {error}
        </Aviso>
      )}
    </Card>
  )
}
