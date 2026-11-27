import { createFileRoute, Outlet } from '@tanstack/react-router'
import { useSuspenseQuery } from '@tanstack/react-query'
import { MoreVertical, Trash2 } from 'lucide-react'
import { queryClient } from '@/lib/queryClient'
import { useAuth } from '@/lib/auth.hook'
import { getAnimalTypeQuery } from '@/admin/module/animal-types/api/queries'
import { AnimalTypeSidebar } from '@/admin/module/animal-types/components/AnimalTypeSidebar'
import { PageHeader, tabLinkClass } from '@/components/layout/PageHeader'
import { useBreadcrumbs } from '@/router/useBreadcrumbs'
import { BreadcrumbNav } from '@/router/BreadcrumbNav'
import { Button } from '@/shadcn/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/shadcn/components/ui/dropdown-menu'
import { Route as BasicRoute } from './index'
import { Route as VaccinationsRoute } from './vaccinations/route'
import { Route as MedicalTestsRoute } from './medical-tests/route'
import { Route as ContractsRoute } from './contracts/route'
import { Route as CaseFileRoute } from './case-file/route'
import { Route as DeleteRoute } from './delete'

export const Route = createFileRoute(
  '/admin/_authenticated/settings/animal-types/$animalTypeId'
)({
  loader: async ({ params }) => {
    const animalType = await queryClient.ensureQueryData(
      getAnimalTypeQuery(params.animalTypeId)
    )
    return { breadcrumb: animalType.title }
  },
  component: RouteComponent,
})

function RouteComponent() {
  const breadcrumbs = useBreadcrumbs()
  const { isAdmin } = useAuth()
  const { animalTypeId } = Route.useParams()
  const { data: animalType } = useSuspenseQuery(
    getAnimalTypeQuery(animalTypeId)
  )

  return (
    <>
      <div className="mb-6">
        <PageHeader
          breadcrumb={<BreadcrumbNav items={breadcrumbs} />}
          title={animalType.title}
          description="Konfiguration dieser Tierart"
          links={
            <>
              <BasicRoute.Link
                params={{ animalTypeId }}
                className={tabLinkClass}
                activeOptions={{ exact: true }}
              >
                Basis
              </BasicRoute.Link>
              <VaccinationsRoute.Link
                params={{ animalTypeId }}
                className={tabLinkClass}
              >
                Impfungen
              </VaccinationsRoute.Link>
              <MedicalTestsRoute.Link
                params={{ animalTypeId }}
                className={tabLinkClass}
              >
                Tests
              </MedicalTestsRoute.Link>
              <ContractsRoute.Link
                params={{ animalTypeId }}
                className={tabLinkClass}
              >
                Verträge
              </ContractsRoute.Link>

              <CaseFileRoute.Link
                params={{ animalTypeId }}
                className={tabLinkClass}
              >
                Angaben
              </CaseFileRoute.Link>

              {isAdmin && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreVertical className="size-4" />
                      <span className="sr-only">Optionen öffnen</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild className="text-destructive">
                      <DeleteRoute.Link params={{ animalTypeId }}>
                        <Trash2 />
                        Löschen
                      </DeleteRoute.Link>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </>
          }
        />
      </div>

      <div className="lg:grid lg:grid-cols-[320px_1fr] lg:gap-6">
        <AnimalTypeSidebar animalType={animalType} />

        <div className="space-y-6 mt-6 lg:mt-0">
          <Outlet />
        </div>
      </div>
    </>
  )
}
