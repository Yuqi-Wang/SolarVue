import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { viteSingleFile } from 'vite-plugin-singlefile'

export default defineConfig({
  plugins: [
    vue(),
    viteSingleFile(),          // inline JS/CSS so index.html is standalone
  ],
  base: './',                  // REQUIRED for file:// and generic hosting
  build: {
    assetsInlineLimit: 100000000,
    cssCodeSplit: false,
  },
  server: { host: '0.0.0.0', port: 5173 },
})
