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

## Roles y jerarquía

Hay **dos ejes independientes**, y conviene no confundirlos:

**`status` — ¿la cuenta entra?**

| Estado | Significado |
|---|---|
| `pending` | Se registró, espera aprobación. Tiene sesión pero solo ve la pantalla de espera. |
| `active` | Aprobada. Entra al panel. |
| `rejected` | Rechazada. Puede loguearse pero no pasa de la pantalla de espera. |

Los tres métodos de acceso (correo, Discord, Steam) desembocan en el mismo
perfil `pending` / `Invitado`. El método de login no es un tipo de usuario.

**`role` — ¿qué puede hacer una vez adentro?**

Cada rol agrega exactamente una capacidad sobre el anterior:

| Rol | Leer | Crear builds | Editar ajenas | Mapa | Moderar mapa | Métricas y auditoría | Gestionar usuarios | Ceder mando |
|---|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|
| Maestro del Gremio | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Mano Derecha | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | — |
| Oficial | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | — | — |
| Miembro | ✅ | ✅ | — | ✅ | — | — | — | — |
| Iniciado | ✅ | ✅ | — | — | — | — | — | — |
| Invitado | ✅ | — | — | — | — | — | — | — |

"Editar ajenas" incluye borrarlas; el autor siempre puede con las propias.
"Ceder mando" pasa el rol de Maestro a otro miembro activo y baja al saliente
a Mano Derecha, en una sola transacción.

Estos permisos están definidos **dos veces a propósito**:

- En la base, en `private.rango_rol()` y las funciones `private.puede_*()`.
  **Son las que mandan de verdad**, aplicadas por RLS.
- En `src/lib/domain/roles.ts`, que solo decide qué se dibuja en pantalla.

Si cambiás uno, cambiá el otro. Cuando se desincronizan pasa lo que pasaba
antes: la interfaz dejaba entrar a un Oficial a la pantalla de administración
y el backend le devolvía 403 en cada llamada.

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

## Despliegue en Cloudflare Workers

El proyecto está configurado para Cloudflare con
[`@opennextjs/cloudflare`](https://opennext.js.org/cloudflare). Bundle medido:
**1,78 MB gzip**, dentro del límite de 3 MB del plan gratuito.

### Ajustes del proyecto en Cloudflare

Ninguno: los valores por defecto ya sirven.

| Campo | Valor |
|---|---|
| Build command | `npm run build` |
| Deploy command | `npx wrangler deploy` |
| Output directory | *(vacío — lo define `wrangler.jsonc`)* |

`npm run build` **no** es un `next build` pelado: corre
`scripts/build-cloudflare.mjs`, que hace el build de Next y después lo
transforma en un bundle de Worker con OpenNext. Con la mayoría de los
frameworks alcanza con el build a secas porque su salida ya es servible; Next
sobre Workers necesita ese paso extra, porque `next build` produce un servidor
de Node y Workers no ejecuta Node.

Para un `next build` sin la parte de Cloudflare: `npm run build:next`.

### Variables de entorno

Distinguí dos grupos, porque van en lugares distintos:

**Variables de build** — ya están en `.env.production`, versionado.

Next las incrusta en el JavaScript del navegador al compilar, así que tienen
que existir **durante el build**, no solo en runtime. Como son públicas por
diseño (viajan a cada visitante igual), se versionan en vez de cargarlas a mano
en el panel:

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
```

Lo que protege la base es RLS, no el secreto de esa clave.

`NEXT_PUBLIC_SITE_URL` se omite a propósito: sin ella, `urlDelSitio()` deriva el
dominio de la propia petición, que es correcto en Workers. Solo hace falta
fijarla con un dominio propio detrás de otro proxy.

**Secretos de runtime** — solo servidor, se cargan con wrangler:

```bash
wrangler secret put SUPABASE_SECRET_KEY   # obligatorio
wrangler secret put GEMINI_API_KEY        # opcional: guías por IA
wrangler secret put STEAM_API_KEY         # opcional: nombre y avatar de Steam
```

Estos NO pueden ir en `.env.production`: se filtrarían en el repositorio.

### Después del primer deploy

En Supabase → **Authentication → URL Configuration**, agregá
`https://tu-dominio/auth/callback` a los Redirect URLs. Sin eso, el login con
Discord vuelve a un destino rechazado.

`NEXT_PUBLIC_SITE_URL` también tiene que coincidir con el dominio real: el
flujo de Steam la usa para armar el `return_to` de OpenID, y si no coincide,
Steam rechaza la verificación.

### El parche de `scripts/build-cloudflare.mjs`

`opennextjs-cloudflare build` a secas **falla** con Next.js 16:

```
File server/middleware.js does not exist
```

Es un bug del adaptador, no de esta aplicación: Next 16 dejó de incluir
`server/middleware.js` en la salida standalone, pero OpenNext sigue exigiéndolo.
El adaptador ya arregla ese mismo problema para `instrumentation.js` unas líneas
más arriba; simplemente no lo aplicaron a middleware.

El script parte el build en dos y copia el archivo en el medio. El propio
archivo explica cómo comprobar si el bug ya se arregló y cuándo se puede borrar.

### Vista previa local

```bash
npm run cf:preview   # build de Workers + wrangler dev
```

En Windows OpenNext avisa que no es del todo compatible. El build funciona,
pero si aparecen fallos raros, conviene usar WSL. Los builds de Cloudflare
corren en Linux, así que esto no afecta al despliegue.

