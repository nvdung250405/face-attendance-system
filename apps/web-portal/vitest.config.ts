import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'happy-dom',
    globals: true,
    include: ['tests/**/*.{test,spec}.{ts,tsx}'],
    env: {
      VITE_API_BASE_URL: 'http://localhost:8080',
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'lcov', 'html'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/**/*.d.ts',
        'src/types/**',
        'src/views/dev/**',
        'src/views/NotFoundView.tsx',
        'src/views/UnauthorizedView.tsx',
        'src/components/common/Badge.tsx',
        'src/components/common/Button.tsx',
        'src/components/common/Card.tsx',
        'src/components/common/Input.tsx',
        'src/components/common/Modal.tsx',
        'src/components/common/TableSkeleton.tsx',
        'src/**/index.ts',
        'src/main.tsx',
      ],
      thresholds: {
        lines: 80,
        functions: 75,
        branches: 65,
        statements: 78,
      },
    },
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '@tests': fileURLToPath(new URL('./tests', import.meta.url)),
    },
  },
})
