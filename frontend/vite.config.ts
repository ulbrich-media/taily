import { defineConfig, loadEnv } from 'vite'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import * as fs from 'node:fs'
import tanstackRouter from '@tanstack/router-plugin/vite'
import babel from '@rolldown/plugin-babel'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Worktrees run on their own host/port, see scripts/worktree-init.sh
  const env = loadEnv(mode, process.cwd(), 'VITE_DEV_')
  const devHost = env.VITE_DEV_HOST || 'taily.ddev.site'
  const devPort = Number(env.VITE_DEV_PORT) || 5544

  return {
    base: process.env.ASSET_BASE_URL ?? '/',
    build: {
      outDir: 'dist',
    },
    plugins: [
      tanstackRouter({
        target: 'react',
        autoCodeSplitting: true,
      }),
      react({}),
      babel({
        presets: [reactCompilerPreset()],
      }),
      tailwindcss(),
    ],
    optimizeDeps: {
      include: ['@dnd-kit/core', '@dnd-kit/sortable', '@dnd-kit/utilities'],
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },

    server: {
      host: true,
      port: devPort,
      strictPort: true,
      allowedHosts: ['.ddev.site'],
      ...(fs.existsSync('.cert/key.pem') && {
        https: {
          key: fs.readFileSync('.cert/key.pem'),
          cert: fs.readFileSync('.cert/cert.pem'),
        },
      }),
      hmr: {
        host: devHost,
        clientPort: devPort,
        protocol: 'wss',
      },
    },
  }
})
