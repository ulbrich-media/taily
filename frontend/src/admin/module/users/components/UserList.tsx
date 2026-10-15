import type { ReactNode } from 'react'
import type { UserResource } from '@/api/types/users'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shadcn/components/ui/table'
import { SortableHead } from '@/components/list/SortableHead'
import { formatApiDate } from '@/lib/dates.utils'
import {
  UserLastLogin,
  UserName,
  UserPerson,
  UserTwoFactorStatus,
} from './UserListParts'

interface UserListProps {
  users: UserResource[]
  /**
   * The API only exposes 2FA status, last login and invitation state to
   * admins, so the matching columns are only rendered for them.
   */
  isAdmin?: boolean
  /** Current sort value (e.g. `-created_at`). */
  sort: string
  onSortChange: (sort: string) => void
  renderRowActions?: (user: UserResource) => ReactNode
}

export function UserList({
  users,
  isAdmin = false,
  sort,
  onSortChange,
  renderRowActions,
}: UserListProps) {
  const header = (label: string, sortKey: string) => (
    <SortableHead
      label={label}
      sortKey={sortKey}
      sort={sort}
      onSortChange={onSortChange}
    />
  )

  return (
    <Table>
      <TableHeader>
        <TableRow>
          {header('Name', 'name')}
          {header('E-Mail', 'email')}
          <TableHead>Person</TableHead>
          {isAdmin && <TableHead>2FA</TableHead>}
          {header('Registriert', 'created_at')}
          {isAdmin && header('Letzter Login', 'last_login_at')}
          {renderRowActions && <TableHead className="th-contain"></TableHead>}
        </TableRow>
      </TableHeader>
      <TableBody>
        {users.map((user) => (
          <TableRow key={user.id}>
            <TableCell className="font-medium">
              <UserName user={user} />
            </TableCell>
            <TableCell>{user.email}</TableCell>
            <TableCell>
              <UserPerson user={user} />
            </TableCell>
            {isAdmin && (
              <TableCell>
                <UserTwoFactorStatus user={user} />
              </TableCell>
            )}
            <TableCell>{formatApiDate(user.created_at)}</TableCell>
            {isAdmin && (
              <TableCell>
                <UserLastLogin user={user} />
              </TableCell>
            )}
            {renderRowActions && (
              <TableCell className="text-right">
                {renderRowActions(user)}
              </TableCell>
            )}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
