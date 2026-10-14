import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { createRouter, RouterProvider } from '@tanstack/react-router'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from './lib/queryClient.ts'
import { ThemeProvider } from './lib/theme.tsx'
import ErrorBoundary from '@/components/ErrorBoundary.tsx'
import { shouldResetScroll } from '@/router/scroll.ts'
import { Toaster } from '@/shadcn/components/ui/sonner.tsx'

// Import the generated route tree
import { routeTree } from './routeTree.gen'

const router = createRouter({
  routeTree,
  context: {
    isAdmin: false,
  },
})

// Dialog routes must not move the page behind them. The router resets scroll
// once per navigation via its one-shot `_scroll.n` flag (set from `resetScroll`
// on navigate/Link). We only ever turn it off here, never back on, so an
// explicit `resetScroll: false` is respected.
router.subscribe('onBeforeLoad', ({ fromLocation, toLocation }) => {
  const reset = shouldResetScroll(
    fromLocation ? router.matchRoutes(fromLocation) : [],
    router.matchRoutes(toLocation)
  )
  if (!reset) {
    router._scroll.n = false
  }
})

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <ThemeProvider>
        <QueryClientProvider client={queryClient}>
          <RouterProvider router={router} />
          <ReactQueryDevtools />
          <Toaster />
        </QueryClientProvider>
      </ThemeProvider>
    </ErrorBoundary>
  </StrictMode>
)
