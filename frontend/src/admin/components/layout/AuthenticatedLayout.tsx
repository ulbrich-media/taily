import { type ReactNode, useEffect } from 'react'
import { Outlet } from '@tanstack/react-router'
import { useAuth } from '@/lib/auth.hook'
import { Header } from './Header'

interface AuthenticatedLayoutProps {
  navLinks: ReactNode
  dropdownUserItems: ReactNode
  mobileUserLinks: ReactNode
  onUnauthenticated: () => void
}

export function AuthenticatedLayout({
  navLinks,
  dropdownUserItems,
  mobileUserLinks,
  onUnauthenticated,
}: AuthenticatedLayoutProps) {
  const { isAuthenticated, isLoading } = useAuth()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      onUnauthenticated()
    }
  }, [isAuthenticated, isLoading, onUnauthenticated])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Lädt...</p>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      <Header
        navLinks={navLinks}
        dropdownUserItems={dropdownUserItems}
        mobileUserLinks={mobileUserLinks}
      />
      <main className="container mx-auto px-4 py-8">
        <Outlet />
      </main>
    </div>
  )
}
