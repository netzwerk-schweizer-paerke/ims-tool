import path from 'path'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    name: 'unit',
    environment: 'node',
    include: ['src/**/*.test.ts'],
    exclude: ['node_modules/**', 'dist/**', '.next/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      reportsDirectory: './coverage',
      exclude: [
        'node_modules/**',
        'dist/**',
        '.next/**',
        'src/**/*.test.ts',
        'src/tests/**',
        'src/payload-types.ts',
        'src/migrations/**',
      ],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
})
