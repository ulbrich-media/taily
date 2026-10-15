import { ListFiltersToolbar } from '@/components/list/ListFiltersToolbar'
import { defineFilter, yesNoGroup } from '@/components/list/toolbar-filters'
import {
  hasActiveUserFilters,
  resetSearchPatch,
  type UserListSearch,
} from '../user-list.search'
import {
  ROLE_OPTIONS,
  hasLoggedInOptions,
  hasPersonOptions,
  hasTwoFactorOptions,
  sortOptions,
} from '../user-list.labels'

interface UserListFiltersProps {
  search: UserListSearch
  /** Two-factor and login state are only known to admins, so only they can filter by them. */
  isAdmin: boolean
  onChange: (patch: Partial<UserListSearch>) => void
}

export function UserListFilters({
  search,
  isAdmin,
  onChange,
}: UserListFiltersProps) {
  // In priority order: the last filters collapse first on narrow screens.
  const filters = [
    defineFilter({
      type: 'multi',
      key: 'role',
      label: 'Berechtigung',
      options: ROLE_OPTIONS,
      value: search.role,
      onChange: (role) => onChange({ role }),
    }),
    defineFilter({
      type: 'sections',
      key: 'status',
      label: 'Status',
      sections: [
        yesNoGroup('has_person', hasPersonOptions, search.has_person, onChange),
        ...(isAdmin
          ? [
              yesNoGroup(
                'has_two_factor',
                hasTwoFactorOptions,
                search.has_two_factor,
                onChange
              ),
              yesNoGroup(
                'has_logged_in',
                hasLoggedInOptions,
                search.has_logged_in,
                onChange
              ),
            ]
          : []),
      ],
    }),
  ]

  return (
    <ListFiltersToolbar
      search={search}
      onChange={onChange}
      resetPatch={resetSearchPatch}
      canReset={hasActiveUserFilters(search)}
      filters={filters}
      sortOptions={sortOptions(isAdmin)}
      label="Benutzer filtern"
      searchLabel="Benutzer durchsuchen"
      searchPlaceholder="Suche nach Name, E-Mail, Person …"
    />
  )
}
