import {
  FormularioContrasena,
  FormularioNombre,
} from '@/components/perfil/FormulariosPerfil'
import { Card, CardTitulo } from '@/components/ui/Card'
import { Etiqueta } from '@/components/ui/Etiqueta'
import { exigirMiembroActivo } from '@/lib/auth/sesion'
import { CAPACIDAD_DE_ROL, ETIQUETAS_ESTADO } from '@/lib/domain/roles'
import { createClient } from '@/lib/supabase/server'
import { fechaCorta, tiempoRelativo } from '@/lib/utils/formato'

export const metadata = { title: 'Mi perfil' }

export default async function Perfil() {
  const perfil = await exigirMiembroActivo()

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Una cuenta creada por Discord o Steam no tiene contraseña propia: el
  // formulario tiene que decirlo en vez de fallar al intentar cambiarla.
  const identidades = user?.identities ?? []
  const tieneClave = identidades.some((i) => i.provider === 'email')
  const proveedores = identidades.map((i) => i.provider)

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold">Mi perfil</h1>
        <p className="mt-0.5 text-sm text-texto-tenue">
          Tus datos de acceso y tu lugar en el gremio.
        </p>
      </div>

      <Card>
        <CardTitulo>Cuenta</CardTitulo>
        <dl className="grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-xs text-texto-tenue">Nombre</dt>
            <dd className="font-medium">{perfil.name}</dd>
          </div>
          <div>
            <dt className="text-xs text-texto-tenue">Correo</dt>
            <dd className="break-all">{user?.email ?? '—'}</dd>
          </div>
          <div>
            <dt className="text-xs text-texto-tenue">Rol</dt>
            <dd className="flex flex-wrap items-center gap-2">
              <Etiqueta tono="acento">{perfil.role}</Etiqueta>
              <span className="text-xs text-texto-tenue">
                {CAPACIDAD_DE_ROL[perfil.role]}
              </span>
            </dd>
          </div>
          <div>
            <dt className="text-xs text-texto-tenue">Estado</dt>
            <dd>
              <Etiqueta tono="exito">{ETIQUETAS_ESTADO[perfil.status]}</Etiqueta>
            </dd>
          </div>
          <div>
            <dt className="text-xs text-texto-tenue">Miembro desde</dt>
            <dd>{fechaCorta(perfil.created_at)}</dd>
          </div>
          <div>
            <dt className="text-xs text-texto-tenue">Última conexión</dt>
            <dd>{tiempoRelativo(perfil.last_seen)}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-xs text-texto-tenue">Métodos de acceso</dt>
            <dd className="mt-1 flex flex-wrap gap-1.5">
              {proveedores.length === 0 ? (
                <span className="text-texto-tenue">—</span>
              ) : (
                proveedores.map((p) => (
                  <Etiqueta key={p}>
                    {p === 'email' ? 'Correo y contraseña' : p}
                  </Etiqueta>
                ))
              )}
              {perfil.steam_id && <Etiqueta>Steam vinculado</Etiqueta>}
            </dd>
          </div>
        </dl>
      </Card>

      <div className="grid gap-5 lg:grid-cols-2">
        <FormularioNombre nombreActual={perfil.name} />
        <FormularioContrasena tieneClave={tieneClave} />
      </div>
    </div>
  )
}
