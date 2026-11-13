import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Relative base so the build also works when opened from a sub-path
// (e.g. GitHub Pages or a static preview host).
export default defineConfig({
  base: './',
  plugins: [react()],
  build: {
    target: 'es2022',
    // three.js + R3F live in the lazily-loaded scene chunk (~1.1 MB raw / ~300 kB gzip).
    chunkSizeWarningLimit: 1600,
  },
})
