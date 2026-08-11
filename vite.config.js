import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig(() => {
  const enableVueDevTools = process.env.VITE_ENABLE_VUE_DEVTOOLS === 'true'

  return {
    plugins: [
      vue(),
      enableVueDevTools ? vueDevTools() : null,
    ].filter(Boolean),
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url))
      },
    },
    base: './',
    base: './',
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              if (id.includes('element-plus')) return 'elementPlus'
              if (id.includes('wangeditor') || id.includes('marked')) return 'editor'
              return 'vendor'
            }
          }
        }
      }
    },
    server: {
      host: '0.0.0.0', // 监听所有网络地址
      port: 5173,
      proxy: {
        '/api': {
          target: 'http://localhost:8084', // 后端 Flask 或其他 API 服务器地址
          changeOrigin: true, // 如果后端是不同域名或端口，设置为 true
          rewrite: (path) => path.replace(/^\/api/, ''), // 重写路径，将 /api 去掉
        },
        '/chat': {
          target: 'ws://localhost:8084',
          changeOrigin: true,
          ws: true,
        },
      },
    },
  }
})
