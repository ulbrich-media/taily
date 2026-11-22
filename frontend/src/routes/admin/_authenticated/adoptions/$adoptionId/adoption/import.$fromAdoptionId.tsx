import { createFileRoute, notFound } from '@tanstack/react-router'
import { useSuspenseQuery } from '@tanstack/react-query'
import { queryClient } from '@/lib/queryClient'
import { getRelatedAdoptionsQuery } from '@/admin/module/adoptions/api/queries'
import { AdoptionImportCaseFileDialog } from '@/admin/module/adoptions/pages/AdoptionImportCaseFileDialog'
import { Route as AdoptionOverviewRoute } from './route'

export const Route = createFileRoute(
  '/admin/_authenticated/adoptions/$adoptionId/adoption/import/$fromAdoptionId'
)({
  loader: async ({ params }) => {
    const related = await queryClient.ensureQueryData(
      getRelatedAdoptionsQuery(params.adoptionId)
    )
    if (!related.some((adoption) => adoption.id === params.fromAdoptionId)) {
      throw notFound()
    }
  },
  staticData: { breadcrumb: 'Angaben übernehmen', dialog: true },
  component: RouteComponent,
})

function RouteComponent() {
  const { adoptionId, fromAdoptionId } = Route.useParams()
  const navigate = AdoptionOverviewRoute.useNavigate()
  const { data: related } = useSuspenseQuery(
    getRelatedAdoptionsQuery(adoptionId)
  )
  const source = related.find((adoption) => adoption.id === fromAdoptionId)

  if (!source) return null

  return (
    <AdoptionImportCaseFileDialog
      adoptionId={adoptionId}
      source={source}
      onClose={() => navigate({ params: { adoptionId } })}
    />
  )
}
