import { createFileRoute, Outlet } from '@tanstack/react-router'
import { queryClient } from '@/lib/queryClient.ts'
import { getAnimalQuery } from '@/admin/module/animals/api/queries.ts'
import { useSuspenseQuery } from '@tanstack/react-query'
import { AnimalSidebar } from '@/admin/module/animals/components/AnimalSidebar.tsx'
import { AnimalTabs } from '@/admin/module/animals/components/AnimalTabs.tsx'
import { Route as BasicRoute } from './index'
import { Route as MedicalRoute } from './medical'
import { Route as PlacementRoute } from './placement'
import { Route as StatusRoute } from './status'
import { Route as HistoryRoute } from './history'
import { Route as PicturesRoute } from './pictures'

export const Route = createFileRoute(
  '/admin/_authenticated/animals/_animalDetail/$animalTypeId/animal/$animalId'
)({
  loader: async ({ params }) => {
    await queryClient.ensureQueryData(getAnimalQuery(params.animalId))
  },
  component: RouteComponent,
})

const tabLinkClass =
  'px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground rounded-md hover:bg-accent transition-colors [&.active]:bg-accent [&.active]:text-foreground'

function RouteComponent() {
  const { animalId, animalTypeId } = Route.useParams()
  const { data: animal } = useSuspenseQuery(getAnimalQuery(animalId))

  const links = (
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
    </>
  )

  return (
    <div className="lg:grid lg:grid-cols-[320px_1fr] lg:gap-6">
      <AnimalSidebar animal={animal} />

      <div className="space-y-6 mt-6 lg:mt-0">
        <AnimalTabs
          links={links}
          onDelete={() => console.log('Delete animal', animalId)}
        />
        <Outlet />
      </div>
    </div>
  )
}
