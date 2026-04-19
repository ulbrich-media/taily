import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import * as fs from 'node:fs'
import tanstackRouter from '@tanstack/router-plugin/vite'

// https://vite.dev/config/
export default defineConfig({
  base: process.env.ASSET_BASE_URL ?? '/',
  build: {
    outDir: 'dist',
  },
  plugins: [
    tanstackRouter({
      target: 'react',
      autoCodeSplitting: true,
    }),
    react({
      babel: {
        plugins: [['babel-plugin-react-compiler']],
      },
    }),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },

  server: {
    host: true,
    port: 5544,
    strictPort: true,
    allowedHosts: ['.ddev.site'],
    ...(fs.existsSync('.cert/key.pem') && {
      https: {
        key: fs.readFileSync('.cert/key.pem'),
        cert: fs.readFileSync('.cert/cert.pem'),
      },
    }),
    hmr: {
      host: 'taily.ddev.site',
      clientPort: 5544,
      protocol: 'wss',
    },
  },
})
