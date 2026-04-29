import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icons/pwa-192.png', 'icons/pwa-512.png'],
      manifest: {
        name: 'HK Recycle Locator',
        short_name: 'HK Recycle',
        description: 'Find the nearest recycling collection points across Hong Kong',
        theme_color: '#16a34a',
        background_color: '#f9fafb',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/recycle-bin-locator/',
        start_url: '/recycle-bin-locator/',
        icons: [
          {
            src: 'icons/pwa-192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'icons/pwa-512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: 'icons/pwa-maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        // Skip the large data file from precache — handled by runtimeCaching below
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        globIgnores: ['**/collection_points.json'],
        runtimeCaching: [
          {
            urlPattern: /\/collection_points\.json$/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'data-cache',
              expiration: { maxAgeSeconds: 60 * 60 * 24 },
            },
          },
          {
            urlPattern: /https:\/\/\{s\}\.tile\.openstreetmap\.org\/.*/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'tiles-cache',
              expiration: { maxEntries: 500, maxAgeSeconds: 60 * 60 * 24 * 7 },
            },
          },
        ],
      },
    }),
  ],
  base: '/recycle-bin-locator/',
})
