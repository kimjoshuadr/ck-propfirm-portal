import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

/*
 * Vue is the primary app: `index.html` is the Vite entry, so the root route
 * serves the Vue SPA — Overview at the root, Affiliates behind #affiliates.
 * The static prototype's remaining screens still live beside it.
 *
 * The Vite root is the workspace root so `assets/` (stylesheet, fonts, brand
 * images) is shared rather than duplicated.
 */
export default defineConfig({
  plugins: [vue()],
  /* Relative asset URLs so the built app also loads when dist-vue/ is served
     from a nested path (or opened straight from the file tree) rather than
     from its own web root. */
  base: './',
  server: {
    port: 5173,
    open: '/',
  },
  build: {
    outDir: 'dist-vue',
    emptyOutDir: true,
    rollupOptions: { input: 'index.html' },
  },
})
