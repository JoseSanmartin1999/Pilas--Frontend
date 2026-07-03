import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    tailwindcss(),
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icono-pilas.png', 'vite.svg'],
      manifest: {
        name: 'Pilas! - Tutorías y Mentorías',
        short_name: 'Pilas!',
        description: 'Aplicación para conectar tutores y estudiantes de la ESPE',
        theme_color: '#3b82f6',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: '/',
        icons: [
          {
            src: 'icono-pilas.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'icono-pilas.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: 'icono-pilas.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ],
  test: {
    globals: true, 
    environment: 'jsdom',
  },
})