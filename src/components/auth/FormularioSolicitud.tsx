'use client'

import { useState, useTransition } from 'react'

import { enviarSolicitud } from '@/actions/solicitud'
import { Aviso } from '@/components/ui/Aviso'
import { Boton } from '@/components/ui/Boton'
import { Card, CardTitulo } from '@/components/ui/Card'
import { IconoCruz } from '@/components/ui/Iconos'
import {
  CAPTURAS,
  CONTENIDOS,
  DISPOSITIVOS,
  ETIQUETAS_CUENTA,
  MAXIMO_CAPTURA,
  ROLES_JUEGO,
  TIPOS_CUENTA,
  TIPOS_IMAGEN,
  rutaCaptura,
  type ClaveCaptura,
  type Contenido,
  type Dispositivo,
  type RolJuego,
  type Solicitud,
  type TipoCuenta,
} from '@/lib/domain/solicitud'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils/cn'

/**
 * El formulario de ingreso.
 *
 * LAS CAPTURAS VAN DIRECTO A STORAGE
 *
 * No pasan por una Server Action. Dos motivos: una Server Action recibe el
 * archivo entero en memoria del Worker, que tiene límites bastante más chicos
 * que los 5 MB de una captura de pantalla; y Storage ya sabe validar tamaño y
 * tipo por su cuenta, con las políticas que fuerzan que la carpeta sea la del
 * usuario.
 *
 * Lo que sí viaja a la Server Action son las RUTAS, y ahí se comprueba que los
 * archivos existan de verdad antes de aceptar la solicitud. Sin eso, un cliente
 * armado a mano podría mandar rutas inventadas y saltarse el requisito de las
 * fotos, que es justo el que el gremio usa para rechazar.
 */
export function FormularioSolicitud({
  uid,
  solicitud,
}: {
  uid: string
  /** Si ya mandó una, el formulario abre con sus datos para corregirla. */
  solicitud: Solicitud | null
}) {
  const [edad, setEdad] = useState(solicitud ? String(solicitud.edad) : '')
  const [horario, setHorario] = useState(solicitud?.horario ?? '')
  const [dispositivo, setDispositivo] = useState<Dispositivo>(
    solicitud?.dispositivo ?? 'PC',
  )
  const [gremioAnterior, setGremioAnterior] = useState(
    solicitud?.gremio_anterior ?? '',
  )
  const [cuenta, setCuenta] = useState<TipoCuenta>(solicitud?.cuenta ?? 'primera')
  const [rolPrincipal, setRolPrincipal] = useState<RolJuego>(
    (solicitud?.rol_juego_principal as RolJuego) ?? 'Tanque',
  )
  const [rolSecundario, setRolSecundario] = useState<string>(
    solicitud?.rol_juego_secundario ?? '',
  )
  const [quienLoTrajo, setQuienLoTrajo] = useState(solicitud?.quien_lo_trajo ?? '')
  const [contenido, setContenido] = useState<Contenido[]>(
    (solicitud?.contenido as Contenido[]) ?? [],
  )
  const [discord, setDiscord] = useState(solicitud?.discord ?? '')

  const [rutas, setRutas] = useState<Record<ClaveCaptura, string | null>>({
    stats: solicitud?.captura_stats ?? null,
    perfil: solicitud?.captura_perfil ?? null,
  })
  const [subiendo, setSubiendo] = useState<ClaveCaptura | null>(null)

  const [error, setError] = useState<string | null>(null)
  const [listo, setListo] = useState(false)
  const [enviando, iniciar] = useTransition()

  async function subir(clave: ClaveCaptura, archivo: File) {
    setError(null)

    if (!TIPOS_IMAGEN.includes(archivo.type as (typeof TIPOS_IMAGEN)[number])) {
      setError('La captura tiene que ser PNG, JPG o WebP.')
      return
    }
    if (archivo.size > MAXIMO_CAPTURA) {
      setError('La captura no puede pasar de 5 MB.')
      return
    }

    setSubiendo(clave)
    const supabase = createClient()
    const ruta = rutaCaptura(uid, clave, archivo.type)

    const { error: eSubida } = await supabase.storage
      .from('solicitudes')
      // upsert para poder cambiar la captura sin acumular archivos sueltos.
      .upload(ruta, archivo, { upsert: true, contentType: archivo.type })

    setSubiendo(null)

    if (eSubida) {
      setError(`No pudimos subir la captura: ${eSubida.message}`)
      return
    }

    setRutas((r) => ({ ...r, [clave]: ruta }))
  }

  function alternarContenido(c: Contenido) {
    setContenido((actual) =>
      actual.includes(c) ? actual.filter((x) => x !== c) : [...actual, c],
    )
  }

  const completo =
    edad.trim() !== '' &&
    horario.trim().length >= 2 &&
    contenido.length > 0 &&
    rutas.stats !== null &&
    rutas.perfil !== null

  function enviar(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!rutas.stats || !rutas.perfil) {
      setError('Faltan las dos capturas: sin ellas la solicitud se rechaza.')
      return
    }

    iniciar(async () => {
      const r = await enviarSolicitud(
        {
          edad,
          horario,
          dispositivo,
          gremio_anterior: gremioAnterior,
          cuenta,
          rol_juego_principal: rolPrincipal,
          rol_juego_secundario: rolSecundario,
          quien_lo_trajo: quienLoTrajo,
          contenido,
          discord,
        },
        { stats: rutas.stats!, perfil: rutas.perfil! },
      )

      if (r.ok) setListo(true)
      else setError(r.error)
    })
  }

  if (listo) {
    return (
      <Card>
        <CardTitulo>Solicitud enviada</CardTitulo>
        <p className="text-sm text-texto-suave">
          Ya la tiene el staff. Cuando alguien la revise vas a poder entrar al
          panel con esta misma cuenta. Si querés corregir algo, recargá esta
          página y volvé a enviarla.
        </p>
      </Card>
    )
  }

  return (
    <form onSubmit={enviar} className="space-y-5">
      <Card>
        <CardTitulo>Sobre vos</CardTitulo>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1 block text-sm text-texto-suave">Edad</span>
            <input
              type="number"
              className="campo"
              value={edad}
              onChange={(e) => setEdad(e.target.value)}
              min={13}
              max={99}
              required
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm text-texto-suave">
              Dispositivo de juego
            </span>
            <select
              className="campo"
              value={dispositivo}
              onChange={(e) => setDispositivo(e.target.value as Dispositivo)}
            >
              {DISPOSITIVOS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </label>

          <label className="block sm:col-span-2">
            <span className="mb-1 block text-sm text-texto-suave">
              Horario de juego
            </span>
            <input
              className="campo"
              value={horario}
              onChange={(e) => setHorario(e.target.value)}
              maxLength={200}
              placeholder="Entre semana de 21 a 1, fines de semana todo el día (GMT-3)"
              required
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm text-texto-suave">
              ¿Es tu primera o segunda cuenta?
            </span>
            <select
              className="campo"
              value={cuenta}
              onChange={(e) => setCuenta(e.target.value as TipoCuenta)}
            >
              {TIPOS_CUENTA.map((c) => (
                <option key={c} value={c}>
                  {ETIQUETAS_CUENTA[c]}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-1 block text-sm text-texto-suave">
              Gremio anterior{' '}
              <span className="text-texto-tenue">(si tuviste)</span>
            </span>
            <input
              className="campo"
              value={gremioAnterior}
              onChange={(e) => setGremioAnterior(e.target.value)}
              maxLength={120}
            />
          </label>
        </div>
      </Card>

      <Card>
        <CardTitulo>Cómo jugás</CardTitulo>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1 block text-sm text-texto-suave">Rol principal</span>
            <select
              className="campo"
              value={rolPrincipal}
              onChange={(e) => setRolPrincipal(e.target.value as RolJuego)}
            >
              {ROLES_JUEGO.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-1 block text-sm text-texto-suave">
              Rol secundario <span className="text-texto-tenue">(opcional)</span>
            </span>
            <select
              className="campo"
              value={rolSecundario}
              onChange={(e) => setRolSecundario(e.target.value)}
            >
              <option value="">Ninguno</option>
              {ROLES_JUEGO.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </label>
        </div>

        <fieldset className="mt-4">
          <legend className="mb-2 text-sm text-texto-suave">
            ¿Qué contenido te gusta más? Podés elegir varios.
          </legend>
          <div className="flex flex-wrap gap-2">
            {CONTENIDOS.map((c) => {
              const activo = contenido.includes(c)
              return (
                <button
                  key={c}
                  type="button"
                  aria-pressed={activo}
                  onClick={() => alternarContenido(c)}
                  className={cn(
                    'rounded-lg border px-4 py-2 text-sm font-medium transition-colors',
                    activo
                      ? 'border-acento bg-acento text-sobre-acento'
                      : 'border-borde bg-superficie-alta text-texto-suave hover:text-texto',
                  )}
                >
                  {c}
                </button>
              )
            })}
          </div>
        </fieldset>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1 block text-sm text-texto-suave">
              ¿Quién te trajo al gremio?{' '}
              <span className="text-texto-tenue">(opcional)</span>
            </span>
            <input
              className="campo"
              value={quienLoTrajo}
              onChange={(e) => setQuienLoTrajo(e.target.value)}
              maxLength={120}
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm text-texto-suave">
              Tu usuario de Discord{' '}
              <span className="text-texto-tenue">(opcional)</span>
            </span>
            <input
              className="campo"
              value={discord}
              onChange={(e) => setDiscord(e.target.value)}
              maxLength={60}
              placeholder="tunombre"
            />
          </label>
        </div>
      </Card>

      <Card>
        <CardTitulo>Las dos capturas</CardTitulo>
        <p className="mb-4 text-sm text-texto-tenue">
          Son obligatorias: sin ellas el staff rechaza la solicitud. Máximo 5 MB
          cada una, en PNG, JPG o WebP.
        </p>

        <div className="grid gap-4 sm:grid-cols-2">
          {CAPTURAS.map(({ clave, etiqueta, ayuda }) => {
            const cargada = rutas[clave]

            return (
              <div key={clave}>
                <span className="mb-1 block text-sm text-texto-suave">
                  {etiqueta}
                </span>
                <p className="mb-2 text-xs text-texto-tenue">{ayuda}</p>

                {cargada ? (
                  <div className="flex items-center justify-between gap-2 rounded-lg border border-exito/40 bg-exito-fondo/25 px-3 py-2.5 text-sm text-exito">
                    Cargada
                    <button
                      type="button"
                      onClick={() => setRutas((r) => ({ ...r, [clave]: null }))}
                      aria-label={`Quitar la captura de ${etiqueta}`}
                      className="rounded p-1 transition-colors hover:bg-peligro-fondo hover:text-peligro"
                    >
                      <IconoCruz className="text-sm" />
                    </button>
                  </div>
                ) : (
                  <label
                    className={cn(
                      'flex cursor-pointer items-center justify-center rounded-lg border border-dashed border-borde px-3 py-2.5 text-sm text-texto-tenue transition-colors hover:border-acento hover:text-texto',
                      subiendo === clave && 'opacity-60',
                    )}
                  >
                    {subiendo === clave ? 'Subiendo…' : 'Elegir imagen'}
                    <input
                      type="file"
                      accept={TIPOS_IMAGEN.join(',')}
                      className="sr-only"
                      disabled={subiendo !== null}
                      onChange={(e) => {
                        const archivo = e.target.files?.[0]
                        if (archivo) void subir(clave, archivo)
                        // Se limpia para poder volver a elegir el mismo archivo.
                        e.target.value = ''
                      }}
                    />
                  </label>
                )}
              </div>
            )
          })}
        </div>
      </Card>

      {error && <Aviso tono="error">{error}</Aviso>}

      <div className="flex justify-end">
        <Boton type="submit" disabled={enviando || !completo}>
          {enviando ? 'Enviando…' : 'Enviar solicitud'}
        </Boton>
      </div>
    </form>
  )
}
