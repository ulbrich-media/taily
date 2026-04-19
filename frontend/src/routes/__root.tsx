import { createRootRouteWithContext, Outlet } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'
import { AuthProvider } from '@/lib/auth'
import { ErrorInfoComponent } from '@/components/ErrorInfoComponent.tsx'
import { Route as DashboardRoute } from '@/routes/admin/_authenticated/index'
import { Route as LoginRoute } from '@/routes/admin/login'

export interface RouterContext {
  isAdmin: boolean
}

const RootLayout = () => {
  const navigateToDashboard = DashboardRoute.useNavigate()
  const navigateToLogin = LoginRoute.useNavigate()

  return (
    <AuthProvider
      onLoginSuccess={() => navigateToDashboard({})}
      onLogoutSuccess={() => navigateToLogin({})}
    >
      <Outlet />
      <TanStackRouterDevtools />
    </AuthProvider>
  )
}

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootLayout,
  errorComponent: (error) => (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <ErrorInfoComponent error={error.error} />
    </div>
  ),
})
