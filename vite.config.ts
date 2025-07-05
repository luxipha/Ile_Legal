import react from "@vitejs/plugin-react";
import tailwind from "tailwindcss";
import { defineConfig } from "vite";
import wasm from "vite-plugin-wasm";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), wasm()],
  // base: "./", // Removed - this interferes with HMR during development
  css: {
    postcss: {
      plugins: [tailwind()],
    },
  },
  define: {
    global: 'globalThis',
    'process.env': JSON.stringify(process.env),
  },
  optimizeDeps: {
    include: ['algosdk'],
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
      util: 'util'
    }
  }
});