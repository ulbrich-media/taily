import { createFileRoute } from '@tanstack/react-router'
import { AuthenticatedLayout } from '@/admin/components/layout/AuthenticatedLayout'
import { queryClient } from '@/lib/queryClient'
import { type User as AuthUser } from '@/lib/auth.types'
import { UserRole } from '@/api/types/users'
import { Route as DashboardRoute } from '@/routes/admin/_authenticated/index'
import { Route as AnimalsRoute } from '@/routes/admin/_authenticated/animals/_animalsList/route'
import { Route as PeopleRoute } from '@/routes/admin/_authenticated/people/index'
import { Route as AdoptionsRoute } from '@/routes/admin/_authenticated/adoptions/_list/route'
import { Route as SettingsRoute } from '@/routes/admin/_authenticated/settings/index'
import { Route as ProfileRoute } from '@/routes/admin/_authenticated/profile/index'
import { Route as PersonalSettingsRoute } from '@/routes/admin/_authenticated/personal-settings/index'
import { Route as LoginRoute } from '@/routes/admin/login'
import { DropdownMenuItem } from '@/shadcn/components/ui/dropdown-menu'
import { User, Settings } from 'lucide-react'

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

const navLinkClass =
  'px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground rounded-md hover:bg-accent transition-colors [&.active]:bg-accent [&.active]:text-foreground'

const mobileUserLinkClass =
  'flex items-center px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground rounded-md hover:bg-accent transition-colors'

function RouteComponent() {
  const navigateToLogin = LoginRoute.useNavigate()

  const navLinks = (
    <>
      <DashboardRoute.Link
        className={navLinkClass}
        activeOptions={{ exact: true }}
      >
        Dashboard
      </DashboardRoute.Link>
      <AnimalsRoute.Link className={navLinkClass}>Tiere</AnimalsRoute.Link>
      <PeopleRoute.Link className={navLinkClass}>Personen</PeopleRoute.Link>
      <AdoptionsRoute.Link className={navLinkClass}>
        Vermittlungen
      </AdoptionsRoute.Link>
      <SettingsRoute.Link className={navLinkClass}>
        Einstellungen
      </SettingsRoute.Link>
    </>
  )

  const dropdownUserItems = (
    <>
      <DropdownMenuItem asChild>
        <ProfileRoute.Link className="cursor-pointer">
          <User className="mr-2 h-4 w-4" />
          Profil
        </ProfileRoute.Link>
      </DropdownMenuItem>
      <DropdownMenuItem asChild>
        <PersonalSettingsRoute.Link className="cursor-pointer">
          <Settings className="mr-2 h-4 w-4" />
          Persönliche Einstellungen
        </PersonalSettingsRoute.Link>
      </DropdownMenuItem>
    </>
  )

  const mobileUserLinks = (
    <>
      <ProfileRoute.Link className={mobileUserLinkClass}>
        <User className="mr-2 h-4 w-4" />
        Profil
      </ProfileRoute.Link>
      <PersonalSettingsRoute.Link className={mobileUserLinkClass}>
        <Settings className="mr-2 h-4 w-4" />
        Persönliche Einstellungen
      </PersonalSettingsRoute.Link>
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
