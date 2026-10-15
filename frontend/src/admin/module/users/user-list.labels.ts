import type { FilterOption } from '@/components/list/toolbar-filters'
import type { UserListRole, UserListSearch } from './user-list.search'

export const ROLE_OPTIONS: FilterOption<UserListRole>[] = [
  { value: 'admin', label: 'Administrator' },
  { value: 'user', label: 'Benutzer' },
]

export const hasPersonOptions: FilterOption<'1' | '0'>[] = [
  { value: '1', label: 'Mit verknüpfter Person' },
  { value: '0', label: 'Ohne verknüpfte Person' },
]

export const hasTwoFactorOptions: FilterOption<'1' | '0'>[] = [
  { value: '1', label: 'Mit 2FA' },
  { value: '0', label: 'Ohne 2FA' },
]

export const hasLoggedInOptions: FilterOption<'1' | '0'>[] = [
  { value: '1', label: 'Schon angemeldet' },
  {
    value: '0',
    label: 'Noch nie angemeldet (eingeladen oder Einladung abgelaufen)',
  },
]

const NAME_SORTS: FilterOption<UserListSearch['sort']>[] = [
  { value: 'name', label: 'Name (A–Z)' },
  { value: '-name', label: 'Name (Z–A)' },
  { value: 'email', label: 'E-Mail (A–Z)' },
  { value: '-email', label: 'E-Mail (Z–A)' },
]

const LOGIN_SORTS: FilterOption<UserListSearch['sort']>[] = [
  { value: '-last_login_at', label: 'Zuletzt angemeldet' },
  { value: 'last_login_at', label: 'Am längsten nicht angemeldet' },
]

const CREATED_SORTS: FilterOption<UserListSearch['sort']>[] = [
  { value: '-created_at', label: 'Neueste zuerst' },
  { value: 'created_at', label: 'Älteste zuerst' },
]

/** The last login is only known to admins, so only they can sort by it. */
export const sortOptions = (isAdmin: boolean) => [
  ...NAME_SORTS,
  ...(isAdmin ? LOGIN_SORTS : []),
  ...CREATED_SORTS,
]
