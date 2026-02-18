import { defineConfig, mergeConfig } from 'vitest/config'
import viteConfig from './vite.config'

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      globals: true,
      environment: 'happy-dom',
      setupFiles: (process.env.TEST_TYPE === 'integration')
        ? ['./tests/setup-integration.ts']
        : ['./tests/setup.ts'],
      globalSetup: (process.env.TEST_TYPE === 'integration')
        ? ['./tests/global-setup.ts']
        : undefined,
      include: ['tests/**/*.test.{ts,tsx}'],
      exclude: ['node_modules', 'dist'],
      testTimeout: 10000, // Increase timeout for integration tests
      hookTimeout: 30000, // Increase hook timeout for server startup
      coverage: {
        provider: 'v8',
        reporter: ['text', 'html', 'lcov'],
        include: ['src/**/*.{ts,tsx}'],
        exclude: [
          'src/main.tsx',
          'src/**/*.test.{ts,tsx}',
          'tests/**',
          'src/**/*.d.ts',
        ],
        thresholds: {
          lines: 80,
          functions: 80,
          branches: 80,
          statements: 80,
        },
      },
    },
  })
)
