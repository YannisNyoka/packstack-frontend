import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: './src/test/setup.js',
    globals: true,
    // The default "forks" pool hangs waiting for its worker to respond in
    // this environment (sandboxed process spawning, most likely) - threads
    // (worker_threads, no child process) runs reliably instead.
    pool: 'threads',
  },
})
