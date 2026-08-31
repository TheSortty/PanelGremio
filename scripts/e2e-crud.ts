/**
 * Recorre el CRUD de cada sección como usuario real (clave publishable, RLS
 * activa). No usa service_role a propósito: esa saltea RLS y haría pasar
 * pruebas que en la aplicación fallarían.
 */
import { createClient } from '@supabase/supabase-js'
import { cargarEnv, clienteAdmin } from './lib/comun'

cargarEnv()

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const ANON = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
const EMAIL = 'thesortty@gmail.com'
const PASS = '12345678'

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
  const s = createClient(URL, ANON)
  const { data: sesion, error: eLogin } = await s.auth.signInWithPassword({
    email: EMAIL,
    password: PASS,
  })
  check('login', !eLogin && !!sesion.user, eLogin?.message ?? '')
  if (eLogin) return
  const yo = sesion.user!.id

  // ---------- PANEL ----------
  console.log('\n== PANEL ==')
  const { data: miembros, error: eM } = await s.from('guild_members').select('*').limit(500)
  check('leer guild_members', !eM && Array.isArray(miembros), eM?.message ?? '')
  check('la vista trae columna online', !!miembros?.[0] && 'online' in miembros[0])
  /*
    El heartbeat va por RPC, no por UPDATE. Es a propósito: al rol
    `authenticated` se le otorgó UPDATE sobre profiles solo en (name,
    avatar_url), así que un UPDATE directo a last_seen TIENE que fallar. Se
    comprueban las dos mitades, porque la primera versión de esta prueba hacía
    el UPDATE directo y reportaba como bug lo que era la defensa funcionando.
  */
  const { error: eDirecto } = await s
    .from('profiles')
    .update({ last_seen: new Date().toISOString() })
    .eq('id', yo)
  check('UPDATE directo de last_seen rechazado', !!eDirecto, 'no dio error')

  const antes = await s.from('profiles').select('last_seen').eq('id', yo).single()
  const { error: eHb } = await s.rpc('registrar_actividad')
  const despues = await s.from('profiles').select('last_seen').eq('id', yo).single()
  check(
    'heartbeat: registrar_actividad actualiza last_seen',
    !eHb && antes.data?.last_seen !== despues.data?.last_seen,
    eHb?.message ?? 'no cambió',
  )

  // ---------- BUILDS ----------
  console.log('\n== BUILDS ==')
  const { data: creada, error: eC } = await s
    .from('builds')
    .insert({
      title: 'PRUEBA E2E',
      category: 'ZvZ',
      description: 'temporal',
      author_id: yo,
      equipment: { weapon: { id: 'T4_MAIN_SWORD', name: 'Espada', ench: 0 } },
      consumables: {},
      abilities: { 'weapon:Q': { id: 'HEROICSTRIKE2', name: 'Golpe' } },
    })
    .select('id')
    .single()
  check('CREATE build', !eC && !!creada, eC?.message ?? '')
  const buildId = creada?.id

  const { data: leida, error: eL } = await s
    .from('builds')
    .select('*')
    .eq('id', buildId!)
    .single()
  check('READ build', !eL && leida?.title === 'PRUEBA E2E', eL?.message ?? '')

  const { count: cUpd, error: eU } = await s
    .from('builds')
    .update({ title: 'PRUEBA E2E EDITADA' }, { count: 'exact' })
    .eq('id', buildId!)
  check('UPDATE build propia', !eU && cUpd === 1, `${eU?.message ?? ''} count=${cUpd}`)

  const { data: lista, error: eLi } = await s.from('builds').select('id,title,category').limit(100)
  check('LIST builds', !eLi && (lista?.length ?? 0) > 0, eLi?.message ?? '')

  const { data: filtrada } = await s.from('builds').select('id').eq('category', 'ZvZ').limit(100)
  check('LIST filtrada por categoria', (filtrada?.length ?? 0) > 0)

  // La guía la escribe una persona y va en la misma fila que la build, así que
  // la cubre la política de UPDATE. Se comprueba que se guarde y que vuelva.
  const texto = ['## Rotación', '1. Q', '2. W'].join(String.fromCharCode(10))
  const { count: cGuia, error: eGuia } = await s
    .from('builds')
    .update({ guide: texto }, { count: 'exact' })
    .eq('id', buildId!)
  check('UPDATE guía escrita', !eGuia && cGuia === 1, `${eGuia?.message ?? ''} count=${cGuia}`)

  const { data: conGuia } = await s
    .from('builds')
    .select('guide')
    .eq('id', buildId!)
    .single()
  check('la guía vuelve tal cual', conGuia?.guide === texto, JSON.stringify(conGuia?.guide))

  const { count: cDel, error: eD } = await s
    .from('builds')
    .delete({ count: 'exact' })
    .eq('id', buildId!)
  check('DELETE build propia', !eD && cDel === 1, `${eD?.message ?? ''} count=${cDel}`)

  // ---------- RUTAS / MAPA ----------
  console.log('\n== RUTAS (mapa) ==')
  const { data: marc, error: eMc } = await s
    .from('map_markers')
    .insert({ x: 12.5, y: 40.25, type: 'gank', created_by: yo })
    .select('id')
    .single()
  check('CREATE marcador', !eMc && !!marc, eMc?.message ?? '')
  const { count: cRen, error: eRen } = await s
    .from('map_markers')
    .update({ label: 'punto de prueba' }, { count: 'exact' })
    .eq('id', marc!.id)
  check('UPDATE marcador (renombrar)', !eRen && cRen === 1, `${eRen?.message ?? ''} count=${cRen}`)
  const { data: marcs } = await s.from('map_markers').select('id,x,y,type,label').limit(500)
  check('READ marcadores', (marcs?.length ?? 0) > 0)
  const { count: cMd, error: eMd } = await s
    .from('map_markers')
    .delete({ count: 'exact' })
    .eq('id', marc!.id)
  check('DELETE marcador', !eMd && cMd === 1, `${eMd?.message ?? ''} count=${cMd}`)

  const { error: eLimp } = await s.rpc('limpiar_mapa')
  check('RPC limpiar_mapa (soy Maestro)', !eLimp, eLimp?.message ?? '')

  // ---------- MÉTRICAS ----------
  console.log('\n== METRICAS ==')
  const { data: met, error: eMet } = await s.rpc('metricas_actividad', {
    zona: 'America/Argentina/Buenos_Aires',
  })
  check('RPC metricas_actividad', !eMet && Array.isArray(met), eMet?.message ?? '')
  check('metricas devuelve <= 168 filas', (met?.length ?? 0) <= 168, `filas=${met?.length}`)

  // ---------- REGISTRO ----------
  console.log('\n== REGISTRO (auditoria) ==')
  const { data: audit, error: eA } = await s
    .from('audit_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(200)
  check('READ audit_logs como Maestro', !eA, eA?.message ?? '')

  // ---------- ADMINISTRACIÓN ----------
  console.log('\n== ADMINISTRACION ==')
  const { data: perfiles, error: eP } = await s
    .from('profiles')
    .select('id,name,role,status,created_at,last_seen')
    .limit(500)
  check('READ profiles', !eP && (perfiles?.length ?? 0) > 0, eP?.message ?? '')

  const admin = clienteAdmin()
  const correo = `e2e-${Date.now()}@ejemplo.test`
  const { data: nuevo, error: eN } = await admin.auth.admin.createUser({
    email: correo,
    password: 'contrasena-larga-1',
    email_confirm: true,
    user_metadata: { name: `E2E ${Date.now()}` },
  })
  check('trigger handle_new_user creo el perfil', !eN, eN?.message ?? '')
  const otro = nuevo?.user?.id
  if (otro) {
    await new Promise((r) => setTimeout(r, 800))
    const { data: pf } = await admin.from('profiles').select('role,status').eq('id', otro).single()
    check('perfil nuevo arranca pending', pf?.status === 'pending', `status=${pf?.status} role=${pf?.role}`)

    const { error: eR } = await s.rpc('admin_cambiar_estado', {
      usuario_id: otro,
      nuevo_estado: 'active',
    })
    check('RPC admin_cambiar_estado', !eR, eR?.message ?? '')
    const { error: eRol } = await s.rpc('admin_cambiar_rol', {
      usuario_id: otro,
      nuevo_rol: 'Oficial' as never,
    })
    check('RPC admin_cambiar_rol', !eRol, eRol?.message ?? '')

    const { data: pf2 } = await admin.from('profiles').select('role,status').eq('id', otro).single()
    check(
      'cambios aplicados',
      pf2?.status === 'active' && pf2?.role === 'Oficial',
      JSON.stringify(pf2),
    )

    const { error: eHack, count: cHack } = await s
      .from('profiles')
      .update({ role: 'Maestro del Gremio' } as never, { count: 'exact' })
      .eq('id', otro)
    check('UPDATE directo de role rechazado', !!eHack || cHack === 0, `err=${eHack?.code} count=${cHack}`)

    const { error: eEli } = await s.rpc('admin_eliminar_usuario', { usuario_id: otro })
    check('RPC admin_eliminar_usuario', !eEli, eEli?.message ?? '')
    const { data: pf3 } = await admin.from('profiles').select('id').eq('id', otro).maybeSingle()
    check('el perfil quedo eliminado', !pf3)
  }

  // ---------- PERFIL ----------
  console.log('\n== PERFIL ==')
  const { data: yoPerfil } = await s.from('profiles').select('name').eq('id', yo).single()
  const { error: eNom } = await s
    .from('profiles')
    .update({ name: yoPerfil!.name })
    .eq('id', yo)
  check('UPDATE nombre propio', !eNom, eNom?.message ?? '')

  // ---------- CATÁLOGO ----------
  console.log('\n== CATALOGO (items/spells) ==')
  const { data: its, error: eIt } = await s
    .from('items')
    .select('id,name,type,tier,item_power,stats')
    .limit(30)
  check('READ items', !eIt && (its?.length ?? 0) > 0, eIt?.message ?? '')
  check(
    'items traen stats',
    (its ?? []).some((i: { stats: unknown }) => i.stats && Object.keys(i.stats).length > 0),
  )
  const { error: eHz } = await s.rpc('hechizos_de_item', { item: its![0]!.id })
  check('RPC hechizos_de_item', !eHz, eHz?.message ?? '')

  console.log(`\n---------------------\nOK: ${ok}   FALLAS: ${mal}\n`)
  process.exit(mal > 0 ? 1 : 0)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
