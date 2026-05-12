import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
  server: {
    proxy: {
      '/n8n-api': {
        target: 'http://localhost:5678',
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/n8n-api/, ''),
      }
    }
  }
})
