import { createFileRoute } from '@tanstack/react-router'
import { SettingsPage } from '@/admin/pages/SettingsPage'
import { useBreadcrumbs } from '@/router/useBreadcrumbs'
import { BreadcrumbNav } from '@/router/BreadcrumbNav'
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
  const breadcrumbs = useBreadcrumbs()
  return (
    <SettingsPage
      breadcrumb={<BreadcrumbNav items={breadcrumbs} />}
      usersAction={
        <Button variant="default_outline" asChild>
          <UsersRoute.Link aria-label="Benutzerverwaltung öffnen">
            Öffnen
          </UsersRoute.Link>
        </Button>
      }
      animalTypesAction={
        <Button variant="default_outline" asChild>
          <AnimalTypesRoute.Link aria-label="Tierarten öffnen">
            Öffnen
          </AnimalTypesRoute.Link>
        </Button>
      }
      vaccinationsAction={
        <Button variant="default_outline" asChild>
          <VaccinationsRoute.Link aria-label="Impfungen öffnen">
            Öffnen
          </VaccinationsRoute.Link>
        </Button>
      }
      medicalTestsAction={
        <Button variant="default_outline" asChild>
          <MedicalTestsRoute.Link aria-label="Medizinische Tests öffnen">
            Öffnen
          </MedicalTestsRoute.Link>
        </Button>
      }
      organizationsAction={
        <Button variant="default_outline" asChild>
          <OrganizationsRoute.Link aria-label="Organisationen öffnen">
            Öffnen
          </OrganizationsRoute.Link>
        </Button>
      }
      formTemplatesAction={
        <Button variant="default_outline" asChild>
          <FormTemplatesRoute.Link aria-label="Formularvorlagen öffnen">
            Öffnen
          </FormTemplatesRoute.Link>
        </Button>
      }
    />
  )
}
