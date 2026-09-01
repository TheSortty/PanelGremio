import { Suspense } from 'react'

import { IconoItem } from '@/components/builds/Icono'
import { Controles, Interruptor, Selector } from '@/components/mercado/Controles'
import { Frescura } from '@/components/mercado/Frescura'
import { Card } from '@/components/ui/Card'
import { Etiqueta } from '@/components/ui/Etiqueta'
import { IconoLupa } from '@/components/ui/Iconos'
import { Vacio } from '@/components/ui/Vacio'
import { exigirMiembroActivo } from '@/lib/auth/sesion'
import { CIUDADES, SERVIDORES, type Servidor } from '@/lib/mercado/aodp'
import { plata } from '@/lib/mercado/economia'
import { calcularPesca } from '@/lib/mercado/pesca'

export const metadata = { title: 'Pesca' }

type Params = { servidor?: string; ciudad?: string; premium?: string }

function leerFiltros(p: Params) {
  const servidor = (
    p.servidor && p.servidor in SERVIDORES ? p.servidor : 'europe'
  ) as Servidor

  const ciudad =
    p.ciudad && CIUDADES.some((c) => c.nombre === p.ciudad) ? p.ciudad : 'Caerleon'

  return { servidor, ciudad, premium: p.premium !== '0' }
}

async function Tabla({ params }: { params: Params }) {
  const f = leerFiltros(params)
  const { opciones, precioChop, lotes, fallidos } = await calcularPesca(f)

  const conDatos = opciones.filter((o) => o.crudo || o.convertido)

  if (conDatos.length === 0) {
    return (
      <Vacio
        icono={IconoLupa}
        titulo="Sin precios de pescado"
        descripcion={`Nadie subió precios de pescado en ${f.ciudad}. Probá otra ciudad u otro servidor.`}
      />
    )
  }

  return (
    <>
      {precioChop === null && (
        <p className="mb-4 rounded-lg border border-alerta/40 bg-alerta-fondo/30 px-3 py-2 text-sm text-alerta">
          No hay precio de pescado picado en {f.ciudad}, así que no se puede
          comparar contra convertir. Solo se muestra cuánto vale el pescado crudo.
        </p>
      )}

      <div className="-mx-6 overflow-x-auto px-6">
        <table className="w-full min-w-[50rem] text-sm">
          <thead>
            <tr className="border-b border-borde text-left">
              <th className="grabado pb-2 pr-4 text-left">Pez</th>
              <th className="grabado pb-2 pr-4 text-left">Agua</th>
              <th className="grabado pb-2 pr-4 text-right">Crudo</th>
              <th className="grabado pb-2 pr-4 text-right">Rinde</th>
              <th className="grabado pb-2 pr-4 text-right">Convertido</th>
              <th className="grabado pb-2 pr-4 text-left">Conviene</th>
              <th className="grabado pb-2 text-left">Dato</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-borde-suave">
            {conDatos.map((o) => (
              <tr
                key={o.itemId}
                className="transition-colors hover:bg-superficie-alta/40"
              >
                <td className="py-2 pr-4">
                  <div className="flex items-center gap-2.5">
                    <IconoItem
                      id={o.itemId}
                      nombre={o.nombre}
                      tamano="mini"
                      className="size-10 shrink-0 rounded-lg border border-borde bg-superficie-alta"
                    />
                    <div className="min-w-0">
                      <p className="truncate font-medium">{o.nombre}</p>
                      <p className="text-xs text-texto-tenue">T{o.tier}</p>
                    </div>
                  </div>
                </td>
                <td className="py-2 pr-4 capitalize text-texto-suave">{o.agua}</td>
                <td className="py-2 pr-4 text-right tabular-nums">
                  {o.crudo ? (
                    <span
                      className={o.sospechoso ? 'text-peligro' : 'text-texto-suave'}
                      title={
                        o.sospechoso
                          ? 'Se despega demasiado del precio en las otras ciudades: casi seguro es una publicación suelta a precio absurdo.'
                          : undefined
                      }
                    >
                      {plata(o.crudo.neto)}
                      {o.sospechoso && <span className="ml-1">⚠</span>}
                    </span>
                  ) : (
                    '—'
                  )}
                </td>
                <td className="py-2 pr-4 text-right tabular-nums text-texto-tenue">
                  {o.chops} picados
                </td>
                <td className="py-2 pr-4 text-right tabular-nums text-texto-suave">
                  {o.convertido ? plata(o.convertido.neto) : '—'}
                </td>
                <td className="py-2 pr-4">
                  {o.sospechoso ? (
                    <span className="text-peligro">precio dudoso</span>
                  ) : o.mejor === null ? (
                    <span className="text-texto-tenue">faltan datos</span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Etiqueta tono={o.mejor === 'convertido' ? 'acento' : 'neutro'}>
                        {o.mejor === 'convertido' ? 'Convertir' : 'Vender crudo'}
                      </Etiqueta>
                      <span className="tabular-nums text-xs text-exito">
                        +{plata(o.diferencia ?? 0)}
                      </span>
                    </span>
                  )}
                </td>
                <td className="py-2">
                  <Frescura tono={o.frescura} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-4 text-xs text-texto-tenue">
        {conDatos.length} de {opciones.length} peces con precio en {f.ciudad}, en{' '}
        {lotes} pedido{lotes === 1 ? '' : 's'}
        {fallidos > 0 && ` (${fallidos} fallaron)`}
        {precioChop !== null && `. Pescado picado a ${plata(precioChop)} la unidad`}.
        Las cifras son netas: ya descuentan el {f.premium ? '4' : '8'} % de
        impuesto más 1,5 % de comisión por publicar la orden.
      </p>
    </>
  )
}

export default async function Pesca({
  searchParams,
}: {
  searchParams: Promise<Params>
}) {
  await exigirMiembroActivo()
  const params = await searchParams
  const f = leerFiltros(params)

  return (
    <div className="space-y-5">
      <Card>
        <Suspense fallback={null}>
          <Controles>
            <Selector
              nombre="servidor"
              etiqueta="Servidor"
              valor={f.servidor}
              opciones={Object.entries(SERVIDORES).map(([valor, etiqueta]) => ({
                valor,
                etiqueta,
              }))}
            />
            <Selector
              nombre="ciudad"
              etiqueta="Ciudad"
              valor={f.ciudad}
              opciones={CIUDADES.map((c) => ({ valor: c.nombre, etiqueta: c.nombre }))}
              ayuda="Donde se vende."
            />
            <Interruptor
              nombre="premium"
              etiqueta="Cuenta con premium"
              activo={f.premium}
            />
          </Controles>
        </Suspense>
      </Card>

      <Card>
        <h2 className="mb-1 text-lg font-semibold">
          Vender crudo o convertir en picado
        </h2>
        <p className="mb-4 text-sm text-texto-tenue">
          Cada pez rinde una cantidad distinta de pescado picado según su tier, de
          1 a 14. Cuál de los dos caminos deja más plata cambia con el mercado.
        </p>

        <Suspense
          key={JSON.stringify(f)}
          fallback={
            <p className="py-12 text-center text-sm text-texto-tenue">
              Consultando precios…
            </p>
          }
        >
          <Tabla params={params} />
        </Suspense>
      </Card>

      <Card>
        <h2 className="mb-2 text-lg font-semibold">Qué no entra en la cuenta</h2>
        <ul className="space-y-1.5 text-sm text-texto-suave">
          <li>
            <strong className="text-texto">El tiempo y el foco de convertir.</strong>{' '}
            Convertir es rápido y el foco no tiene precio de mercado.
          </li>
          <li>
            <strong className="text-texto">La cadena más larga.</strong> El picado
            también sirve de insumo para comidas y para la salsa de pescado, que
            pueden rendir más. Acá se compara solo lo que se vende directo.
          </li>
          <li>
            <strong className="text-texto">Los precios marcados con ⚠</strong> se
            despegan más de cinco veces del mismo pez en las otras ciudades: casi
            siempre es alguien que publicó una pieza suelta a un precio absurdo.
            Se muestran, pero no se recomiendan.
          </li>
        </ul>
      </Card>
    </div>
  )
}
