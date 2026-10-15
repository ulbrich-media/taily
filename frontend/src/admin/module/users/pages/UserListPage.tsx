import type { ReactNode } from 'react'
import { Users } from 'lucide-react'
import type { UserResource } from '@/api/types/users'
import type { PaginatedResponse } from '@/api/types/pagination'
import { ListPage } from '@/components/list/ListPage'
import { UserList } from '@/admin/module/users/components/UserList'
import { UserCardGrid } from '@/admin/module/users/components/UserCardGrid'
import { UserListFilters } from '@/admin/module/users/components/UserListFilters'
import {
  hasActiveUserFilters,
  isUserSort,
  resetSearchPatch,
  type UserListSearch,
} from '@/admin/module/users/user-list.search'

interface UserListPageProps {
  users: PaginatedResponse<UserResource>
  search: UserListSearch
  /**
   * The API only exposes 2FA status, last login and invitation state to
   * admins, so the matching columns and filters are only offered to them.
   */
  isAdmin?: boolean
  /** True while the previous result is shown and the next one is loading. */
  isUpdating?: boolean
  onSearchChange: (patch: Partial<UserListSearch>) => void
  createAction?: ReactNode
  renderRowActions?: (user: UserResource) => ReactNode
  breadcrumb?: ReactNode
}

export function UserListPage({
  users,
  search,
  isAdmin = false,
  isUpdating = false,
  onSearchChange,
  createAction,
  renderRowActions,
  breadcrumb,
}: UserListPageProps) {
  return (
    <ListPage
      title="Benutzerverwaltung"
      description="Verwalte Benutzer und deren Berechtigungen"
      breadcrumb={breadcrumb}
      createAction={createAction}
      toolbar={
        <UserListFilters
          search={search}
          isAdmin={isAdmin}
          onChange={onSearchChange}
        />
      }
      list={users}
      view={search.view}
      isUpdating={isUpdating}
      onPageChange={(page) => onSearchChange({ page })}
      itemLabel="Benutzer"
      empty={{
        icon: Users,
        title: 'Keine Benutzer gefunden',
        descriptionFiltered: 'Mit den gewählten Filtern gibt es keine Treffer.',
        descriptionEmpty: 'Erstelle den ersten Benutzer!',
        filtered: hasActiveUserFilters(search),
        onReset: () => onSearchChange(resetSearchPatch),
      }}
      renderTable={(items) => (
        <UserList
          users={items}
          isAdmin={isAdmin}
          sort={search.sort}
          onSortChange={(sort) => isUserSort(sort) && onSearchChange({ sort })}
          renderRowActions={renderRowActions}
        />
      )}
      renderCards={(items, className) => (
        <UserCardGrid
          users={items}
          isAdmin={isAdmin}
          renderRowActions={renderRowActions}
          className={className}
        />
      )}
    />
  )
}
