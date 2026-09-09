import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    globals: true,
    // increase timeout in case some tests wait for async timeouts
    testTimeout: 10000,
  },
})
