import { createFileRoute } from '@tanstack/react-router'
import { SettingsPage } from '@/admin/pages/SettingsPage'
import { Route as UsersRoute } from '@/routes/admin/_authenticated/settings/users/route'
import { Route as AnimalTypesRoute } from '@/routes/admin/_authenticated/settings/animal-types/route'
import { Route as VaccinationsRoute } from '@/routes/admin/_authenticated/settings/vaccinations/route'
import { Route as MedicalTestsRoute } from '@/routes/admin/_authenticated/settings/medical-tests/route'
import { Route as OrganizationsRoute } from '@/routes/admin/_authenticated/settings/organizations/index'
import { Route as FormTemplatesRoute } from '@/routes/admin/_authenticated/settings/form-templates/index'
import { Button } from '@/shadcn/components/ui/button'

export const Route = createFileRoute('/admin/_authenticated/settings/')({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <SettingsPage
      usersAction={
        <Button asChild>
          <UsersRoute.Link>Öffnen</UsersRoute.Link>
        </Button>
      }
      animalTypesAction={
        <Button asChild>
          <AnimalTypesRoute.Link>Öffnen</AnimalTypesRoute.Link>
        </Button>
      }
      vaccinationsAction={
        <Button asChild>
          <VaccinationsRoute.Link>Öffnen</VaccinationsRoute.Link>
        </Button>
      }
      medicalTestsAction={
        <Button asChild>
          <MedicalTestsRoute.Link>Öffnen</MedicalTestsRoute.Link>
        </Button>
      }
      organizationsAction={
        <Button asChild>
          <OrganizationsRoute.Link>Öffnen</OrganizationsRoute.Link>
        </Button>
      }
      formTemplatesAction={
        <Button asChild>
          <FormTemplatesRoute.Link>Öffnen</FormTemplatesRoute.Link>
        </Button>
      }
    />
  )
}
