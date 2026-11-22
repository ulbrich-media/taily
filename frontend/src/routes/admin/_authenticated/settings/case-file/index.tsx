import { createFileRoute, redirect } from '@tanstack/react-router'
import { queryClient } from '@/lib/queryClient'
import { listAnimalTypesQuery } from '@/admin/module/animal-types/api/queries'

// The configuration is per animal type; open the first one.
export const Route = createFileRoute(
  '/admin/_authenticated/settings/case-file/'
)({
  loader: async () => {
    const animalTypes = await queryClient.ensureQueryData(listAnimalTypesQuery)
    const first = [...animalTypes.data].sort((a, b) =>
      a.title.localeCompare(b.title)
    )[0]

    if (first) {
      throw redirect({
        to: '/admin/settings/case-file/$animalTypeId',
        params: { animalTypeId: first.id },
      })
    }
  },
  component: () => (
    <p className="text-muted-foreground">
      Lege zuerst eine Tierart an, um ihre Angaben zu konfigurieren.
    </p>
  ),
})
