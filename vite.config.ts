import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // Esto te permite usar '@/' como un atajo a tu carpeta raíz en las importaciones.
      '@': path.resolve(__dirname, '.'),
    }
  }
})