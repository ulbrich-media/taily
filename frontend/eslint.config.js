import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

// Custom plugin: ban generic router hooks and route imports outside src/routes/
const routerRulesPlugin = {
  rules: {
    'no-generic-router-hooks': {
      meta: {
        type: 'problem',
        docs: {
          description:
            'Disallow generic useNavigate, useParams, useRouter, useRouteContext, Link from @tanstack/react-router. Use Route.useNavigate(), Route.useParams(), Route.Link, or useRouter() instead.',
        },
        schema: [],
        messages: {
          noGenericHook:
            "'{{ name }}' from '@tanstack/react-router' is banned. Use route-specific variants (Route.useNavigate(), Route.useParams(), Route.Link) instead. See docs/coding-patterns/route-hooks-and-components.md",
        },
      },
      create(context) {
        return {
          ImportDeclaration(node) {
            if (node.source.value !== '@tanstack/react-router') return
            const banned = new Set([
              'useNavigate',
              'useParams',
              'useRouteContext',
              'useRouter',
              'Link',
            ])
            for (const specifier of node.specifiers) {
              if (
                specifier.type === 'ImportSpecifier' &&
                banned.has(specifier.imported.name)
              ) {
                context.report({
                  node: specifier,
                  messageId: 'noGenericHook',
                  data: { name: specifier.imported.name },
                })
              }
            }
          },
        }
      },
    },
    'no-route-imports-outside-routes': {
      meta: {
        type: 'problem',
        docs: {
          description:
            'Files outside src/routes/ must not import from src/routes/**.',
        },
        schema: [],
        messages: {
          noRouteImport:
            "Files outside 'src/routes/' must not import from route files ('{{ source }}'). Receive data and navigation callbacks as props instead. See docs/coding-patterns/decoupled-route-and-page.md",
        },
      },
      create(context) {
        const filename = context.filename ?? context.getFilename?.() ?? ''
        // Normalize to forward slashes
        const normalized = filename.replace(/\\/g, '/')
        // Only apply to files NOT in src/routes/
        if (normalized.includes('/src/routes/')) return {}

        return {
          ImportDeclaration(node) {
            const src = node.source.value
            // Detect imports from src/routes/** using various forms
            if (src.includes('/routes/') || src.startsWith('@/routes/')) {
              context.report({
                node,
                messageId: 'noRouteImport',
                data: { source: src },
              })
            }
          },
        }
      },
    },
  },
}

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    plugins: {
      'router-rules': routerRulesPlugin,
    },
    rules: {
      'router-rules/no-generic-router-hooks': 'error',
      'router-rules/no-route-imports-outside-routes': 'error',
    },
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
  },
  {
    files: ['src/routes/**/*.{ts,tsx}'],
    rules: {
      'react-refresh/only-export-components': 'off',
    },
  },
])
