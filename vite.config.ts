import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    // Pre-bundling breaks MapLibre's web worker URL.
    exclude: ['maplibre-gl'],
  },
})
