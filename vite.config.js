import { fileURLToPath, URL } from 'node:url'
import { readdirSync, readFileSync } from 'node:fs'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

const apiTarget = process.env.VITE_API_TARGET || 'http://localhost:8084'

export default defineConfig({
  plugins: [vue(), {
    name: 'pdf-reader-resources',
    generateBundle() {
      for (const folder of ['cmaps', 'standard_fonts']) {
        const directory = new URL(`./node_modules/pdfjs-dist/${folder}/`, import.meta.url)
        for (const name of readdirSync(directory)) {
          this.emitFile({ type: 'asset', fileName: `pdfjs/${folder}/${name}`, source: readFileSync(new URL(name, directory)) })
        }
      }
    },
  }],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
  base: './',
  server: {
    host: '0.0.0.0',
    port: 5173,
    proxy: {
      '/terminal/ws': {
        target: apiTarget.replace(/^http/, 'ws'),
        changeOrigin: true,
        ws: true,
      },
      '/api': {
        target: apiTarget,
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
      '/chat': {
        target: apiTarget.replace(/^http/, 'ws'),
        changeOrigin: true,
        ws: true,
      },
    },
  },
})
