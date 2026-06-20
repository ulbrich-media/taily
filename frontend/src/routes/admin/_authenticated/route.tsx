import { createFileRoute } from '@tanstack/react-router'
import { AuthenticatedLayout } from '@/admin/components/layout/AuthenticatedLayout'
import { queryClient } from '@/lib/queryClient'
import { type User as AuthUser } from '@/lib/auth.types'
import { UserRole } from '@/api/types/users'
import { Route as DashboardRoute } from '@/routes/admin/_authenticated/index'
import { Route as AnimalsRoute } from '@/routes/admin/_authenticated/animals/_animalsList/route'
import { Route as PeopleRoute } from '@/routes/admin/_authenticated/people/index'
import { Route as AdoptionsRoute } from '@/routes/admin/_authenticated/adoptions/_list/index'
import { Route as TransportsRoute } from '@/routes/admin/_authenticated/transports/index'
import { Route as SettingsRoute } from '@/routes/admin/_authenticated/settings/index'
import { Route as ProfileRoute } from '@/routes/admin/_authenticated/profile/index'
import { Route as PersonalSettingsRoute } from '@/routes/admin/_authenticated/personal-settings/index'
import { Route as LoginRoute } from '@/routes/admin/login'
import { DropdownMenuItem } from '@/shadcn/components/ui/dropdown-menu'
import { User, Settings } from 'lucide-react'
import {
  NavigationMenuItem,
  NavigationMenuLink,
} from '@/shadcn/components/ui/navigation-menu.tsx'

export const Route = createFileRoute('/admin/_authenticated')({
  component: RouteComponent,
  beforeLoad: () => {
    const user = queryClient.getQueryData<AuthUser>(['profile'])
    const isAdmin = user?.role === UserRole.Admin

    return {
      isAdmin,
    }
  },
})

function RouteComponent() {
  const navigateToLogin = LoginRoute.useNavigate()

  const navLinks = (
    <>
      <NavigationMenuItem>
        <NavigationMenuLink asChild>
          <DashboardRoute.Link
            activeOptions={{ exact: true }}
            activeProps={{ 'data-active': true }}
          >
            Dashboard
          </DashboardRoute.Link>
        </NavigationMenuLink>
      </NavigationMenuItem>
      <NavigationMenuItem>
        <NavigationMenuLink asChild>
          <AnimalsRoute.Link activeProps={{ 'data-active': true }}>
            Tiere
          </AnimalsRoute.Link>
        </NavigationMenuLink>
      </NavigationMenuItem>
      <NavigationMenuItem>
        <NavigationMenuLink asChild>
          <PeopleRoute.Link activeProps={{ 'data-active': true }}>
            Personen
          </PeopleRoute.Link>
        </NavigationMenuLink>
      </NavigationMenuItem>
      <NavigationMenuItem>
        <NavigationMenuLink asChild>
          <AdoptionsRoute.Link activeProps={{ 'data-active': true }}>
            Vermittlungen
          </AdoptionsRoute.Link>
        </NavigationMenuLink>
      </NavigationMenuItem>
      <NavigationMenuItem>
        <NavigationMenuLink asChild>
          <TransportsRoute.Link activeProps={{ 'data-active': true }}>
            Transporte
          </TransportsRoute.Link>
        </NavigationMenuLink>
      </NavigationMenuItem>
      <NavigationMenuItem>
        <NavigationMenuLink asChild>
          <SettingsRoute.Link activeProps={{ 'data-active': true }}>
            Einstellungen
          </SettingsRoute.Link>
        </NavigationMenuLink>
      </NavigationMenuItem>
    </>
  )

  const dropdownUserItems = (
    <>
      <DropdownMenuItem asChild>
        <ProfileRoute.Link className="cursor-pointer">
          <User className="size-4" />
          Profil
        </ProfileRoute.Link>
      </DropdownMenuItem>
      <DropdownMenuItem asChild>
        <PersonalSettingsRoute.Link className="cursor-pointer">
          <Settings className="size-4" />
          Persönliche Einstellungen
        </PersonalSettingsRoute.Link>
      </DropdownMenuItem>
    </>
  )

  const mobileUserLinks = (
    <>
      <NavigationMenuItem>
        <NavigationMenuLink asChild>
          <ProfileRoute.Link activeProps={{ 'data-active': true }}>
            Profil
          </ProfileRoute.Link>
        </NavigationMenuLink>
      </NavigationMenuItem>
      <NavigationMenuItem>
        <NavigationMenuLink asChild>
          <PersonalSettingsRoute.Link activeProps={{ 'data-active': true }}>
            Persönliche Einstellungen
          </PersonalSettingsRoute.Link>
        </NavigationMenuLink>
      </NavigationMenuItem>
    </>
  )

  return (
    <AuthenticatedLayout
      navLinks={navLinks}
      dropdownUserItems={dropdownUserItems}
      mobileUserLinks={mobileUserLinks}
      onUnauthenticated={() => navigateToLogin({})}
    />
  )
}
