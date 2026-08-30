import { redirect } from 'next/navigation'

/**
 * La raíz solo redirige. Quién puede pasar lo decide proxy.ts, que ya corrió
 * antes de llegar acá.
 */
export default function Home() {
  redirect('/panel')
}
