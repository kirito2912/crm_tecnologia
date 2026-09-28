import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    // increase timeout in case some tests wait for async timeouts
    testTimeout: 10000,
  },
})
