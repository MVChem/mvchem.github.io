import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'

const contentVersion = createHash('sha256')
  .update(readFileSync(new URL('../backend/content/reference.json', import.meta.url)))
  .digest('hex').slice(0, 16)

export default defineConfig({
  plugins: [react()],
  define: { 'import.meta.env.VITE_CONTENT_VERSION': JSON.stringify(contentVersion) },
  server: { host: '127.0.0.1', port: 5178, proxy: { '/api': 'http://127.0.0.1:8038' } },
  build: { sourcemap: false },
})
