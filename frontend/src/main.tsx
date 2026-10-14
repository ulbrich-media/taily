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

// Whether the navigation currently in flight may scroll the page to the top.
let resetScrollOnRender = true

const router = createRouter({
  routeTree,
  context: {
    isAdmin: false,
  },
  // Called after a navigation rendered; returning false skips the scroll reset.
  scrollRestoration: () => resetScrollOnRender,
})

router.subscribe('onBeforeLoad', ({ fromLocation, toLocation }) => {
  resetScrollOnRender = shouldResetScroll(
    fromLocation ? router.matchRoutes(fromLocation) : [],
    router.matchRoutes(toLocation)
  )
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
