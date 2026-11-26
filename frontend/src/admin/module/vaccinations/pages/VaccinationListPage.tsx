import type { ReactNode } from 'react'
import { Syringe } from 'lucide-react'
import type { AnimalTypeResource } from '@/api/types/animal-types'
import type { PaginatedResponse } from '@/api/types/pagination'
import type { VaccinationResource } from '@/api/types/vaccinations'
import { AnimalTypeItemListPage } from '@/admin/module/animal-types/pages/AnimalTypeItemListPage'
import type { AnimalTypeItemListSearch } from '@/admin/module/animal-types/animal-type-item-list.search'

interface VaccinationListPageProps {
  vaccinations: PaginatedResponse<VaccinationResource>
  search: AnimalTypeItemListSearch
  /** Omit inside an animal type's page, where the list is scoped already. */
  animalTypes?: AnimalTypeResource[]
  /** True while the previous result is shown and the next one is loading. */
  isUpdating?: boolean
  onSearchChange: (patch: Partial<AnimalTypeItemListSearch>) => void
  createAction?: ReactNode
  renderRowActions?: (vaccination: VaccinationResource) => ReactNode
  breadcrumb?: ReactNode
}

export function VaccinationListPage({
  vaccinations,
  ...props
}: VaccinationListPageProps) {
  return (
    <AnimalTypeItemListPage
      title="Impfungen"
      description="Verwalte die verfügbaren Impfungen der Tiere"
      viewKey="vaccinations"
      itemLabel="Impfungen"
      icon={Syringe}
      emptyTitle="Keine Impfungen vorhanden"
      emptyDescription="Erstelle die erste Impfung!"
      items={vaccinations}
      {...props}
    />
  )
}
