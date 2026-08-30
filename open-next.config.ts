import { defineCloudflareConfig } from '@opennextjs/cloudflare'

/**
 * Configuración de OpenNext para Cloudflare Workers.
 *
 * Sin caché incremental: esta aplicación es dinámica por sesión (solo `/` y
 * `/_not-found` son estáticas), así que no hay ISR que cachear. El adaptador
 * genera por defecto una caché en R2, que obligaría a crear un bucket antes
 * del primer deploy sin ganar nada acá.
 */
export default defineCloudflareConfig()
