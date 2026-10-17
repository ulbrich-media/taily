import type { ReactNode } from 'react'
import { FlaskConical } from 'lucide-react'
import type { AnimalTypeResource } from '@/api/types/animal-types'
import type { MedicalTestResource } from '@/api/types/medical-tests'
import type { PaginatedResponse } from '@/api/types/pagination'
import { AnimalTypeItemListPage } from '@/admin/module/animal-types/pages/AnimalTypeItemListPage'
import type { AnimalTypeItemListSearch } from '@/admin/module/animal-types/animal-type-item-list.search'

interface MedicalTestListPageProps {
  medicalTests: PaginatedResponse<MedicalTestResource>
  search: AnimalTypeItemListSearch
  animalTypes: AnimalTypeResource[]
  /** True while the previous result is shown and the next one is loading. */
  isUpdating?: boolean
  onSearchChange: (patch: Partial<AnimalTypeItemListSearch>) => void
  createAction?: ReactNode
  renderRowActions?: (medicalTest: MedicalTestResource) => ReactNode
  breadcrumb?: ReactNode
}

export function MedicalTestListPage({
  medicalTests,
  ...props
}: MedicalTestListPageProps) {
  return (
    <AnimalTypeItemListPage
      title="Tests"
      description="Verwalte die verfügbaren medizinischen Tests der Tiere"
      viewKey="medical-tests"
      itemLabel="Tests"
      icon={FlaskConical}
      emptyTitle="Keine Tests vorhanden"
      emptyDescription="Erstelle den ersten Test!"
      items={medicalTests}
      {...props}
    />
  )
}
