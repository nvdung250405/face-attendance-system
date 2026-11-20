import { fileURLToPath, URL } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const rootDir = fileURLToPath(new URL('../../', import.meta.url))
  // 1. Nạp Global .env từ Monorepo Root (làm giá trị mặc định chung)
  const globalEnv = loadEnv(mode, rootDir, '')
  // 2. Nạp Local .env từ app/web-portal (ghi đè cấu hình riêng cho dev nếu có)
  const localEnv = loadEnv(mode, process.cwd(), '')
  // 3. Hợp nhất cấu hình phân tầng: Local ghi đè Global (Hierarchical Cascading)
  const env = { ...globalEnv, ...localEnv }

  const backendTarget = env.VITE_BACKEND_TARGET || 'http://localhost:8080'

  // Đảm bảo mọi biến VITE_* từ cả Global và Local đều được đưa vào client bundle
  const envDefines: Record<string, string> = {}
  for (const [key, val] of Object.entries(env)) {
    if (key.startsWith('VITE_')) {
      envDefines[`import.meta.env.${key}`] = JSON.stringify(val)
    }
  }

  return {
    plugins: [react(), tailwindcss()],
    define: {
      global: 'window',
      ...envDefines,
    },
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    build: {
      chunkSizeWarningLimit: 600,
      rollupOptions: {
        output: {
          manualChunks(id: string) {
            const normalized = id.replace(/\\/g, '/')
            if (
              normalized.includes('/node_modules/react/') ||
              normalized.includes('/node_modules/react-dom/') ||
              normalized.includes('/node_modules/react-router-dom/')
            ) {
              return 'vendor-react'
            }
            if (normalized.includes('/node_modules/@tanstack/react-query/')) {
              return 'vendor-query'
            }
            if (
              normalized.includes('/node_modules/@stomp/stompjs/') ||
              normalized.includes('/node_modules/sockjs-client/')
            ) {
              return 'vendor-stomp'
            }
            if (
              normalized.includes('/node_modules/lucide-react/') ||
              normalized.includes('/node_modules/clsx/') ||
              normalized.includes('/node_modules/tailwind-merge/') ||
              normalized.includes('/node_modules/class-variance-authority/')
            ) {
              return 'vendor-ui'
            }
            if (normalized.includes('/node_modules/@radix-ui/')) {
              return 'vendor-radix'
            }
          },
        },
      },
    },
    server: {
      port: 5173,
      proxy: {
        '/api': {
          target: backendTarget,
          changeOrigin: true,
          secure: false,
        },
        '/ws-attendance': {
          target: backendTarget,
          changeOrigin: true,
          ws: true,
        },
        '/ws': {
          target: backendTarget,
          changeOrigin: true,
          ws: true,
        },
      },
    },
  }
})

