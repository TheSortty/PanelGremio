'use client'

import { useState, useTransition } from 'react'
import Markdown from 'react-markdown'

import { generarGuia } from '@/actions/guia'
import { Aviso } from '@/components/ui/Aviso'
import { Boton } from '@/components/ui/Boton'
import { Card, CardTitulo } from '@/components/ui/Card'
import { IconoChispa } from '@/components/ui/Iconos'
import { Spinner } from '@/components/ui/Cargando'

/**
 * Guía de la build generada por IA.
 *
 * Dos arreglos respecto de la versión anterior:
 *
 *   1. Se renderiza con react-markdown. Antes se inyectaba con
 *      dangerouslySetInnerHTML tras un .replace(/\n/g, '<br />'): no
 *      interpretaba markdown (los ** quedaban a la vista) y metía en el DOM,
 *      como HTML, texto venido de un modelo de lenguaje.
 *
 *   2. La guía se guarda en la base. Antes se regeneraba en cada visita y se
 *      perdía al salir de la página, gastando una llamada a la API cada vez.
 */
export function GuiaIA({
  buildId,
  guiaInicial,
  habilitado,
}: {
  buildId: string
  guiaInicial: string | null
  habilitado: boolean
}) {
  const [guia, setGuia] = useState(guiaInicial)
  const [error, setError] = useState<string | null>(null)
  const [generando, iniciar] = useTransition()

  function generar() {
    setError(null)
    iniciar(async () => {
      const resultado = await generarGuia(buildId)
      if (resultado.ok) setGuia(resultado.guia)
      else setError(resultado.error)
    })
  }

  return (
    <Card className="lg:col-span-1">
      <CardTitulo className="flex items-center gap-2">
        <IconoChispa className="text-acento" />
        Guía de la build
      </CardTitulo>

      {generando ? (
        <div className="flex flex-col items-center gap-3 py-12">
          <Spinner />
          <p className="text-xs text-texto-tenue">Generando…</p>
        </div>
      ) : guia ? (
        <>
          <div className="markdown">
            <Markdown>{guia}</Markdown>
          </div>
          {habilitado && (
            <Boton
              variante="secundario"
              tamano="sm"
              onClick={generar}
              className="mt-4 w-full"
            >
              Regenerar
            </Boton>
          )}
        </>
      ) : (
        <div className="py-6 text-center">
          <p className="mb-4 text-sm text-texto-tenue">
            {habilitado
              ? 'Generá una guía con consejos de uso, fortalezas y debilidades.'
              : 'La generación por IA no está configurada en este servidor.'}
          </p>
          {habilitado && (
            <Boton onClick={generar} className="w-full">
              Generar guía
            </Boton>
          )}
        </div>
      )}

      {error && (
        <Aviso tono="error" className="mt-3">
          {error}
        </Aviso>
      )}
    </Card>
  )
}
