import { createFileRoute, Outlet } from '@tanstack/react-router'
import { queryClient } from '@/lib/queryClient.ts'
import { getAnimalQuery } from '@/admin/module/animals/api/queries.ts'
import { useSuspenseQuery } from '@tanstack/react-query'
import { AnimalSidebar } from '@/admin/module/animals/components/AnimalSidebar.tsx'
import { Route as BasicRoute } from './index'
import { Route as MedicalRoute } from './medical'
import { Route as PlacementRoute } from './placement'
import { Route as StatusRoute } from './status'
import { Route as HistoryRoute } from './history'
import { Route as PicturesRoute } from './pictures'
import { PageHeader, tabLinkClass } from '@/components/layout/PageHeader.tsx'
import { useBreadcrumbs } from '@/router/useBreadcrumbs'
import { BreadcrumbNav } from '@/router/BreadcrumbNav'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/shadcn/components/ui/dropdown-menu.tsx'
import { MoreVertical } from 'lucide-react'
import { Button } from '@/shadcn/components/ui/button.tsx'

export const Route = createFileRoute(
  '/admin/_authenticated/animals/_animalDetail/$animalTypeId/animal/$animalId'
)({
  loader: async ({ params }) => {
    const animal = await queryClient.ensureQueryData(
      getAnimalQuery(params.animalId)
    )
    return { breadcrumb: animal.name }
  },
  component: RouteComponent,
})

function RouteComponent() {
  const breadcrumbs = useBreadcrumbs()
  const { animalId, animalTypeId } = Route.useParams()
  const { data: animal } = useSuspenseQuery(getAnimalQuery(animalId))

  return (
    <>
      <div className="mb-6">
        <PageHeader
          breadcrumb={<BreadcrumbNav items={breadcrumbs} />}
          title={animal.name}
          description={
            animal.old_name ? `früher: ${animal.old_name}` : undefined
          }
          links={
            <>
              <BasicRoute.Link
                params={{ animalTypeId, animalId }}
                className={tabLinkClass}
                activeOptions={{ exact: true }}
              >
                Basis
              </BasicRoute.Link>
              <MedicalRoute.Link
                params={{ animalTypeId, animalId }}
                className={tabLinkClass}
              >
                Medizinisch
              </MedicalRoute.Link>
              <PlacementRoute.Link
                params={{ animalTypeId, animalId }}
                className={tabLinkClass}
              >
                Vermittlung
              </PlacementRoute.Link>
              <StatusRoute.Link
                params={{ animalTypeId, animalId }}
                className={tabLinkClass}
              >
                Status
              </StatusRoute.Link>
              <HistoryRoute.Link
                params={{ animalTypeId, animalId }}
                className={tabLinkClass}
              >
                Verlauf
              </HistoryRoute.Link>
              <PicturesRoute.Link
                params={{ animalTypeId, animalId }}
                className={tabLinkClass}
              >
                Bilder
              </PicturesRoute.Link>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreVertical className="size-4" />
                    <span className="sr-only">Optionen öffnen</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={() => console.log('Delete animal', animalId)}
                    className="text-destructive"
                  >
                    Löschen
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          }
        />
      </div>

      <div className="lg:grid lg:grid-cols-[320px_1fr] lg:gap-6">
        <AnimalSidebar animal={animal} />

        <div className="space-y-6 mt-6 lg:mt-0">
          <Outlet />
        </div>
      </div>
    </>
  )
}
