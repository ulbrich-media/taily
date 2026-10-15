import type { ReactNode } from 'react'
import { Building2 } from 'lucide-react'
import type { OrganizationResource } from '@/api/types/organizations'
import type { PaginatedResponse } from '@/api/types/pagination'
import { ListPage } from '@/components/list/ListPage'
import { ListFiltersToolbar } from '@/components/list/ListFiltersToolbar'
import { OrganizationList } from '@/admin/module/organizations/components/OrganizationList'
import { OrganizationCardGrid } from '@/admin/module/organizations/components/OrganizationCardGrid'
import {
  hasActiveOrganizationFilters,
  resetSearchPatch,
  type OrganizationListSearch,
} from '@/admin/module/organizations/organization-list.search'

interface OrganizationListPageProps {
  organizations: PaginatedResponse<OrganizationResource>
  search: OrganizationListSearch
  /** True while the previous result is shown and the next one is loading. */
  isUpdating?: boolean
  onSearchChange: (patch: Partial<OrganizationListSearch>) => void
  createAction: ReactNode
  renderRowActions: (organization: OrganizationResource) => ReactNode
  breadcrumb?: ReactNode
}

export function OrganizationListPage({
  organizations,
  search,
  isUpdating = false,
  onSearchChange,
  createAction,
  renderRowActions,
  breadcrumb,
}: OrganizationListPageProps) {
  return (
    <ListPage
      title="Organisationen"
      description="Verwalte alle Organisationen im System"
      breadcrumb={breadcrumb}
      createAction={createAction}
      toolbar={
        <ListFiltersToolbar
          search={search}
          onChange={onSearchChange}
          resetPatch={resetSearchPatch}
          canReset={hasActiveOrganizationFilters(search)}
          label="Organisationen filtern"
          searchLabel="Organisationen durchsuchen"
          searchPlaceholder="Suche nach Name, E-Mail, Ort …"
        />
      }
      list={organizations}
      view={search.view}
      isUpdating={isUpdating}
      onPageChange={(page) => onSearchChange({ page })}
      itemLabel="Organisationen"
      empty={{
        icon: Building2,
        title: 'Keine Organisationen gefunden',
        descriptionFiltered: 'Mit der Suche gibt es keine Treffer.',
        descriptionEmpty: 'Füge jetzt eine Organisation hinzu!',
        filtered: hasActiveOrganizationFilters(search),
        onReset: () => onSearchChange(resetSearchPatch),
      }}
      renderTable={(items) => (
        <OrganizationList
          organizations={items}
          renderRowActions={renderRowActions}
        />
      )}
      renderCards={(items, className) => (
        <OrganizationCardGrid
          organizations={items}
          renderRowActions={renderRowActions}
          className={className}
        />
      )}
    />
  )
}
