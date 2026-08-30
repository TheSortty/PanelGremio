# Panel del Gremio

Panel de gestión de gremio para Albion Online: actividad de miembros, builds de
personaje con habilidades, mapa estratégico compartido y administración de
accesos.

**Stack:** Next.js 16 (App Router) · TypeScript · Tailwind CSS 4 · Supabase
(Postgres + Auth + RLS).

---

## Puesta en marcha

Requisitos: Node.js 20 o superior y una cuenta de Supabase.

### 1. Dependencias

```bash
npm install
```

### 2. Proyecto de Supabase

Creá un proyecto en [supabase.com/dashboard](https://supabase.com/dashboard) y
vinculalo:

```bash
npx supabase login
npx supabase link --project-ref <tu-ref>
```

El `project-ref` es la parte del medio de la URL del proyecto
(`https://<ref>.supabase.co`).

### 3. Variables de entorno

```bash
cp .env.example .env.local
```

Completá `.env.local` con los valores de **Project Settings → API**. Los
detalles de cada variable están comentados en `.env.example`.

> `SUPABASE_SECRET_KEY` saltea RLS por completo. Nunca la pongas en una variable
> con prefijo `NEXT_PUBLIC_`: todo lo que lleve ese prefijo se envía al navegador.

### 4. Esquema de la base

```bash
npm run db:push     # aplica supabase/migrations/
npm run db:types    # regenera los tipos de TypeScript desde la base
```

### 5. Datos de Albion

Los catálogos de ítems y hechizos se descargan de
[ao-bin-dumps](https://github.com/ao-data/ao-bin-dumps); no están en el
repositorio porque pesan decenas de MB y se regeneran con cada parche.

```bash
npm run data:download                     # ítems + hechizos (~31 MB)
npm run data:download -- --localizacion    # opcional: nombres en español (~87 MB)
npm run seed
```

Sin `--localizacion` los hechizos se muestran con el nombre derivado de su
identificador interno (por ejemplo "Fireball Staff" en vez de "Bola de fuego").

### 6. Arrancar

```bash
npm run dev
```

En [localhost:3000](http://localhost:3000) creá tu cuenta. Va a quedar
**pendiente de aprobación**: como todavía no hay ningún administrador, promovete
a mano una única vez desde el editor SQL de Supabase.

```sql
update public.profiles
set status = 'active', role = 'Maestro del Gremio'
where name = 'TU_NOMBRE';
```

A partir de ahí las aprobaciones se hacen desde la pantalla de Administración.

---

## Métodos de acceso

| Método | Configuración |
|---|---|
| Correo y contraseña | Funciona sin configurar nada |
| Discord | Authentication → Providers → Discord, con el client ID y el secreto de [discord.com/developers](https://discord.com/developers/applications). El Redirect en Discord es `https://<ref>.supabase.co/auth/v1/callback` |
| Steam | Opcional: `STEAM_API_KEY` de [steamcommunity.com/dev/apikey](https://steamcommunity.com/dev/apikey), solo para traer nombre y avatar. El login funciona sin ella |

Steam usa OpenID 2.0, que Supabase no soporta de forma nativa. El flujo está
implementado en `src/app/auth/steam/`: se verifica la firma contra Steam y
recién ahí se emite la sesión.

Todas las cuentas nuevas entran como `pending` / `Invitado`, sin importar el
método. Nadie ve el panel hasta que un administrador la aprueba.

---

## Roles

| Rol | Builds y mapa | Métricas y auditoría | Gestión de usuarios |
|---|:-:|:-:|:-:|
| Maestro del Gremio | ✅ | ✅ | ✅ |
| Mano Derecha | ✅ | ✅ | ✅ |
| Oficial | ✅ | ✅ | — |
| Miembro / Iniciado | ✅ | — | — |
| Invitado | sin acceso | — | — |

Estos permisos están definidos **dos veces a propósito**: en la base
(`private.es_admin()` y `private.es_oficial()`, que son las que mandan de verdad
vía RLS) y en `src/lib/domain/roles.ts`, que solo decide qué se dibuja. Si
cambiás uno, cambiá el otro.

---

## Estructura

```
src/
  app/
    (panel)/          Secciones privadas; el layout exige miembro activo
    auth/             Callbacks de OAuth, flujo de Steam, cierre de sesión
    login/
  actions/            Server Actions (escrituras)
  components/
  lib/
    auth/             Sesión del servidor y verificación de Steam
    data/             Consultas de lectura
    db/               Tipos generados de la base
    domain/           Reglas de negocio: roles, builds, slots
    supabase/         Clientes (navegador, servidor, admin, proxy)
proxy.ts              Refresco de sesión y protección de rutas
scripts/              Descarga de dumps y seeds
supabase/migrations/  Esquema, funciones y políticas RLS
```

Un detalle que conviene conocer antes de tocar builds: las claves de habilidad
(`weapon:Q`, `helmet:Passive`) se construyen y se leen **solo** con
`claveHabilidad()` en `src/lib/domain/builds.ts`. No las armes con plantillas
sueltas; el motivo está comentado en ese archivo.

---

## Comandos

| Comando | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Build de producción |
| `npm run typecheck` | TypeScript sin emitir |
| `npm run db:push` | Aplica las migraciones |
| `npm run db:types` | Regenera `src/lib/db/database.types.ts` |
| `npm run data:download` | Descarga los dumps de Albion |
| `npm run seed` | Carga hechizos e ítems |

---

## Despliegue

Pensado para Vercel. Cargá las mismas variables de `.env.example` en el
proyecto, con `NEXT_PUBLIC_SITE_URL` apuntando al dominio real, y agregá
`https://tu-dominio/auth/callback` en **Authentication → URL Configuration →
Redirect URLs** de Supabase.
