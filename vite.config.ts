import react from "@vitejs/plugin-react";
import tailwind from "tailwindcss";
import { defineConfig } from "vite";
import wasm from "vite-plugin-wasm";
import { VitePWA } from 'vite-plugin-pwa';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(), 
    wasm(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
      manifest: {
        name: 'Ile Legal - Legal Services Marketplace',
        short_name: 'Ile Legal',
        description: 'Connect with verified legal professionals for document verification, contract review, and legal services',
        theme_color: '#1B1828',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: '/',
        scope: '/',
        orientation: 'portrait-primary',
        icons: [
          {
            src: '/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: '/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/api\./i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 // 24 hours
              }
            }
          },
          {
            urlPattern: /^https:\/\/.*\.supabase\.co/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'supabase-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 // 1 hour
              }
            }
          }
        ]
      },
      devOptions: {
        enabled: true
      }
    })
  ],
  // base: "./", // Removed - this interferes with HMR during development
  css: {
    postcss: {
      plugins: [tailwind()],
    },
  },
  define: {
    global: 'globalThis',
    'process.env': JSON.stringify(process.env),
    'process.version': JSON.stringify('v18.0.0'),
    'process.platform': JSON.stringify('browser'),
  },
  optimizeDeps: {
    include: ['algosdk', 'buffer', 'process'],
    exclude: ['@zondax/filecoin-signing-tools'] // Exclude WASM modules from pre-bundling
  },
  worker: {
    format: 'es'
  },
  resolve: {
    alias: {
      // Node.js polyfills for browser compatibility
      buffer: 'buffer',
      stream: 'stream-browserify',
      assert: 'assert',
      crypto: 'crypto-browserify',
      util: 'util',
      process: 'process/browser'
    }
  }
});