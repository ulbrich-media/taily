import { createFileRoute } from '@tanstack/react-router'
import { queryClient } from '@/lib/queryClient.ts'
import { getAnimalQuery } from '@/admin/module/animals/api/queries.ts'
import { AnimalEditHistoryPage } from '@/admin/module/animals/pages/AnimalEditHistoryPage.tsx'

export const Route = createFileRoute(
  '/admin/_authenticated/animals/_animalDetail/$animalTypeId/animal/$animalId/history'
)({
  loader: async ({ params }) => {
    await queryClient.ensureQueryData(getAnimalQuery(params.animalId))
  },
  component: AnimalEditHistoryPage,
})
