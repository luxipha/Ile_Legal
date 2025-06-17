import react from "@vitejs/plugin-react";
import tailwind from "tailwindcss";
import { defineConfig } from "vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // base: "./", // Removed - this interferes with HMR during development
  css: {
    postcss: {
      plugins: [tailwind()],
    },
  },
});