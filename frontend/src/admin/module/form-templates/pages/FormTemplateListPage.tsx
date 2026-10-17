import type { ReactNode } from 'react'
import { FileText } from 'lucide-react'
import type { FormTemplateResource } from '@/api/types/form-templates'
import type { PaginatedResponse } from '@/api/types/pagination'
import { ListPage } from '@/components/list/ListPage'
import { ListFiltersToolbar } from '@/components/list/ListFiltersToolbar'
import type { PlainListSearch } from '@/components/list/plain-list-search'
import {
  FormTemplateCardGrid,
  FormTemplateList,
} from '@/admin/module/form-templates/components/FormTemplateList'

interface FormTemplateListPageProps {
  templates: PaginatedResponse<FormTemplateResource>
  search: PlainListSearch
  /** True while the previous result is shown and the next one is loading. */
  isUpdating?: boolean
  onSearchChange: (patch: Partial<PlainListSearch>) => void
  createAction?: ReactNode
  renderRowActions: (template: FormTemplateResource) => ReactNode
  breadcrumb?: ReactNode
}

export function FormTemplateListPage({
  templates,
  search,
  isUpdating = false,
  onSearchChange,
  createAction,
  renderRowActions,
  breadcrumb,
}: FormTemplateListPageProps) {
  return (
    <ListPage
      title="Formularvorlagen"
      description="Verwalte dynamische Formularvorlagen für Inspektionen, Bewerbungen und mehr"
      breadcrumb={breadcrumb}
      createAction={createAction}
      toolbar={
        <ListFiltersToolbar
          search={search}
          onChange={onSearchChange}
          label="Formularvorlagen"
        />
      }
      list={templates}
      view={search.view}
      isUpdating={isUpdating}
      onPageChange={(page) => onSearchChange({ page })}
      itemLabel="Formularvorlagen"
      empty={{
        icon: FileText,
        title: 'Keine Formularvorlagen vorhanden',
        descriptionFiltered: '',
        descriptionEmpty: 'Erstelle die erste Formularvorlage!',
        filtered: false,
        onReset: () => undefined,
      }}
      renderTable={(items) => (
        <FormTemplateList
          templates={items}
          renderRowActions={renderRowActions}
        />
      )}
      renderCards={(items, className) => (
        <FormTemplateCardGrid
          templates={items}
          renderRowActions={renderRowActions}
          className={className}
        />
      )}
    />
  )
}
