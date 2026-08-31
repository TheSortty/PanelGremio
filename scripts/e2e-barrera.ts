/**
 * ¿La aprobación del administrador es una barrera de verdad?
 *
 * No alcanza con que la pantalla redirija: eso solo tapa la interfaz. Se
 * comprueba que un usuario recién registrado no pueda leer NADA del gremio
 * consultando la base directamente con su propia sesión, que es lo que haría
 * alguien salteándose el navegador.
 */
import { createClient } from '@supabase/supabase-js'

import { cargarEnv, clienteAdmin } from './lib/comun'

cargarEnv()

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const ANON = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!

let ok = 0
let mal = 0
function check(nombre: string, cond: boolean, extra = '') {
  if (cond) {
    ok++
    console.log(`  OK    ${nombre}`)
  } else {
    mal++
    console.log(`  FALLA ${nombre}  ${extra}`)
  }
}

async function main() {
  const admin = clienteAdmin()
  const correo = `barrera-${Date.now()}@ejemplo.test`
  const clave = 'contrasena-larga-1'

  // Alta por el mismo camino que un registro normal: insert en auth.users.
  const { data: nuevo, error: eAlta } = await admin.auth.admin.createUser({
    email: correo,
    password: clave,
    email_confirm: true,
    user_metadata: { name: `Intruso ${Date.now()}` },
  })
  if (eAlta) throw new Error(eAlta.message)
  const id = nuevo.user!.id
  await new Promise((r) => setTimeout(r, 800))

  const { data: perfil } = await admin
    .from('profiles')
    .select('role, status')
    .eq('id', id)
    .single()
  check('nace pendiente', perfil?.status === 'pending', `status=${perfil?.status}`)
  check('nace sin rango', perfil?.role === 'Invitado', `role=${perfil?.role}`)

  // Ahora con la sesión del propio usuario, sin pasar por la aplicación.
  const s = createClient(URL, ANON)
  const { error: eLogin } = await s.auth.signInWithPassword({
    email: correo,
    password: clave,
  })
  check('puede iniciar sesión', !eLogin, eLogin?.message ?? '')

  const { data: builds } = await s.from('builds').select('id')
  check('NO lee builds', (builds?.length ?? 0) === 0, `filas=${builds?.length}`)

  const { data: rutas } = await s.from('routes').select('id')
  check('NO lee rutas', (rutas?.length ?? 0) === 0, `filas=${rutas?.length}`)

  const { data: miembros } = await s.from('guild_members').select('id')
  check('NO lee el padrón', (miembros?.length ?? 0) === 0, `filas=${miembros?.length}`)

  const { data: audit } = await s.from('audit_logs').select('id')
  check('NO lee la auditoría', (audit?.length ?? 0) === 0, `filas=${audit?.length}`)

  // Tampoco puede auto-aprobarse.
  const { error: eAuto, count: cAuto } = await s
    .from('profiles')
    .update({ status: 'active' } as never, { count: 'exact' })
    .eq('id', id)
  check('NO puede auto-aprobarse', !!eAuto || cAuto === 0, `err=${eAuto?.code} count=${cAuto}`)

  const { error: eRpc } = await s.rpc('admin_cambiar_estado', {
    usuario_id: id,
    nuevo_estado: 'active',
  })
  check('la RPC de aprobación lo rechaza', !!eRpc, eRpc?.message ?? 'la dejó pasar')

  // Y crear cosas tampoco.
  const { error: eCrear } = await s.from('routes').insert({
    name: 'Ruta del intruso',
    origin: 'Ningún lado',
    author_id: id,
    steps: [],
  })
  check('NO puede crear rutas', !!eCrear, eCrear?.message ?? 'la dejó pasar')

  // Después de que un admin lo aprueba, sí.
  const adminSesion = createClient(URL, ANON)
  await adminSesion.auth.signInWithPassword({
    email: 'thesortty@gmail.com',
    password: '12345678',
  })
  await adminSesion.rpc('admin_cambiar_estado', { usuario_id: id, nuevo_estado: 'active' })

  // La sesión vieja tiene el token con los claims de antes; RLS lee la fila de
  // profiles en cada consulta, así que el cambio se nota sin volver a entrar.
  const { data: buildsDespues, error: eDespues } = await s.from('builds').select('id')
  check(
    'aprobado, ya lee builds',
    !eDespues && Array.isArray(buildsDespues),
    eDespues?.message ?? '',
  )

  await admin.auth.admin.deleteUser(id)
  console.log(`\n---------------------\nOK: ${ok}   FALLAS: ${mal}\n`)
  process.exit(mal > 0 ? 1 : 0)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
