import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // Iconos de ítems y hechizos de Albion.
      { protocol: 'https', hostname: 'render.albiononline.com' },
      { protocol: 'https', hostname: 'albiononline.com' },
      // Avatares de Discord y Steam.
      { protocol: 'https', hostname: 'cdn.discordapp.com' },
      { protocol: 'https', hostname: 'avatars.steamstatic.com' },
    ],
  },
}

export default nextConfig
