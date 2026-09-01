import { Suspense } from 'react'

import { IconoItem } from '@/components/builds/Icono'
import { Controles, Interruptor, Selector } from '@/components/mercado/Controles'
import { Frescura } from '@/components/mercado/Frescura'
import { Card } from '@/components/ui/Card'
import { IconoLupa } from '@/components/ui/Iconos'
import { Vacio } from '@/components/ui/Vacio'
import { exigirMiembroActivo } from '@/lib/auth/sesion'
import { CIUDADES, SERVIDORES, type Servidor } from '@/lib/mercado/aodp'
import { RETORNO, plata, porcentaje } from '@/lib/mercado/economia'
import { calcularCrafteos } from '@/lib/mercado/crafteo'

export const metadata = { title: 'Crafteo' }

const TIPOS = ['weapon', 'offhand', 'helmet', 'chest', 'boots', 'cape'] as const

const RETORNOS = [
  { valor: String(RETORNO.sinBonus), etiqueta: 'Sin bonus (15,2 %)' },
  { valor: String(RETORNO.conBonus), etiqueta: 'Ciudad especializada (24,8 %)' },
  { valor: String(RETORNO.conFoco), etiqueta: 'Con foco (43,5 %)' },
  { valor: '0', etiqueta: 'Sin retorno (0 %)' },
]

type Params = {
  servidor?: string
  tier?: string
  ciudad?: string
  retorno?: string
  premium?: string
}

function leerFiltros(p: Params) {
  const servidor = (
    p.servidor && p.servidor in SERVIDORES ? p.servidor : 'europe'
  ) as Servidor

  const tierNum = Number(p.tier)
  const tier = tierNum >= 2 && tierNum <= 8 ? tierNum : 6

  const ciudad =
    p.ciudad && CIUDADES.some((c) => c.nombre === p.ciudad) ? p.ciudad : 'Caerleon'

  const r = Number(p.retorno)
  const retorno = Number.isFinite(r) && r >= 0 && r < 1 ? r : RETORNO.sinBonus

  return { servidor, tier, ciudad, retorno, premium: p.premium !== '0' }
}

async function Tabla({ params }: { params: Params }) {
  const f = leerFiltros(params)

  const { crafteos, evaluados, conDatos, lotes, fallidos } = await calcularCrafteos({
    ...f,
    tipos: TIPOS,
    limite: 25,
  })

  if (crafteos.length === 0) {
    return (
      <Vacio
        icono={IconoLupa}
        titulo="Sin datos suficientes"
        descripcion={`De ${evaluados} recetas de T${f.tier}, ${conDatos} tenían precio para el producto y para todos sus materiales en ${f.ciudad}. Probá otra ciudad: es lo que más cambia la cobertura.`}
      />
    )
  }

  const rentables = crafteos.filter((c) => c.operacion.ganancia > 0).length

  return (
    <>
      <div className="-mx-6 overflow-x-auto px-6">
        <table className="w-full min-w-[54rem] text-sm">
          <thead>
            <tr className="border-b border-borde text-left">
              <th className="grabado pb-2 pr-4 text-left">Ítem</th>
              <th className="grabado pb-2 pr-4 text-left">Materiales</th>
              <th className="grabado pb-2 pr-4 text-right">Costo</th>
              <th className="grabado pb-2 pr-4 text-right">Se vende a</th>
              <th className="grabado pb-2 pr-4 text-right">Ganancia</th>
              <th className="grabado pb-2 pr-4 text-right">Por foco</th>
              <th className="grabado pb-2 text-left">Dato</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-borde-suave">
            {crafteos.map((c) => (
              <tr
                key={c.itemId}
                className="transition-colors hover:bg-superficie-alta/40"
              >
                <td className="py-2 pr-4">
                  <div className="flex items-center gap-2.5">
                    <IconoItem
                      id={c.itemId}
                      nombre={c.nombre}
                      tamano="mini"
                      className="size-10 shrink-0 rounded-lg border border-borde bg-superficie-alta"
                    />
                    <div className="min-w-0">
                      <p className="truncate font-medium">{c.nombre}</p>
                      <p className="text-xs text-texto-tenue">T{c.tier}</p>
                    </div>
                  </div>
                </td>
                <td className="py-2 pr-4 text-xs text-texto-tenue">
                  {c.materiales.map((m) => `${m.cantidad}x ${m.nombre}`).join(' · ')}
                </td>
                <td className="py-2 pr-4 text-right tabular-nums text-texto-suave">
                  {plata(c.operacion.costo)}
                </td>
                <td className="py-2 pr-4 text-right tabular-nums text-texto-suave">
                  {plata(c.precioVenta)}
                </td>
                <td
                  className={`py-2 pr-4 text-right font-semibold tabular-nums ${
                    c.operacion.ganancia > 0 ? 'text-exito' : 'text-peligro'
                  }`}
                >
                  {c.operacion.ganancia > 0 ? '+' : ''}
                  {plata(c.operacion.ganancia)}
                  <span className="ml-1.5 font-normal text-texto-tenue">
                    {porcentaje(c.operacion.margen)}
                  </span>
                </td>
                <td className="py-2 pr-4 text-right tabular-nums text-texto-suave">
                  {c.porFoco === null ? '—' : plata(c.porFoco)}
                </td>
                <td className="py-2">
                  <Frescura tono={c.frescura} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-4 text-xs text-texto-tenue">
        {evaluados} recetas de T{f.tier} evaluadas en {lotes} pedidos
        {fallidos > 0 && ` (${fallidos} fallaron)`}; {conDatos} con precio
        completo, {rentables} con ganancia. El costo ya descuenta el{' '}
        {(f.retorno * 100).toFixed(1)} % de retorno de materiales, y la ganancia el{' '}
        {f.premium ? '4' : '8'} % de impuesto más 1,5 % de comisión por publicar la
        orden.
      </p>
    </>
  )
}

export default async function Crafteo({
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
              nombre="tier"
              etiqueta="Tier"
              valor={String(f.tier)}
              opciones={[8, 7, 6, 5, 4, 3, 2].map((t) => ({
                valor: String(t),
                etiqueta: `T${t}`,
              }))}
            />
            <Selector
              nombre="ciudad"
              etiqueta="Ciudad"
              valor={f.ciudad}
              opciones={CIUDADES.map((c) => ({ valor: c.nombre, etiqueta: c.nombre }))}
              ayuda="Donde se compran los materiales y se vende."
            />
            <Selector
              nombre="retorno"
              etiqueta="Retorno de materiales"
              valor={String(f.retorno)}
              opciones={RETORNOS}
              ayuda="Es lo que más mueve el resultado."
            />
          </Controles>

          <div className="mt-4 max-w-56">
            <Interruptor
              nombre="premium"
              etiqueta="Cuenta con premium"
              activo={f.premium}
            />
          </div>
        </Suspense>
      </Card>

      <Card>
        <h2 className="mb-4 text-lg font-semibold">Qué conviene fabricar</h2>
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
            <strong className="text-texto">El foco.</strong> Se regenera solo y no
            tiene precio de mercado, así que no se puede pasar a plata sin inventar
            un número. Se muestra cuánta ganancia deja cada punto para que decidas
            vos.
          </li>
          <li>
            <strong className="text-texto">La tarifa de la estación</strong>, que
            fija cada dueño y cambia todo el tiempo.
          </li>
          <li>
            <strong className="text-texto">La calidad del resultado.</strong>{' '}
            Craftear puede dar una pieza superior, que vale más: eso solo mejora el
            número real respecto de este.
          </li>
        </ul>
      </Card>
    </div>
  )
}
