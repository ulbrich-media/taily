import type { ReactNode } from 'react'
import type { UserResource } from '@/api/types/users'
import { ListCard, ListCardGrid } from '@/components/list/ListCardGrid'
import { InfoRow } from '@/shadcn/components/common/info-row'
import { formatApiDate } from '@/lib/dates.utils'
import {
  UserLastLogin,
  UserName,
  UserPerson,
  UserTwoFactorStatus,
} from './UserListParts'

interface UserCardGridProps {
  users: UserResource[]
  isAdmin?: boolean
  renderRowActions?: (user: UserResource) => ReactNode
  className?: string
}

export function UserCardGrid({
  users,
  isAdmin = false,
  renderRowActions,
  className,
}: UserCardGridProps) {
  return (
    <ListCardGrid
      items={users}
      getKey={(user) => user.id}
      className={className}
    >
      {(user) => (
        <ListCard
          header={
            <>
              <p className="font-medium">
                <UserName user={user} />
              </p>
              <p className="text-muted-foreground text-sm">{user.email}</p>
            </>
          }
          footer={renderRowActions?.(user)}
        >
          <InfoRow label="Person">
            <UserPerson user={user} />
          </InfoRow>
          {isAdmin && (
            <InfoRow label="2FA">
              <UserTwoFactorStatus user={user} />
            </InfoRow>
          )}
          <InfoRow label="Registriert">
            {formatApiDate(user.created_at)}
          </InfoRow>
          {isAdmin && (
            <InfoRow label="Letzter Login">
              <UserLastLogin user={user} />
            </InfoRow>
          )}
        </ListCard>
      )}
    </ListCardGrid>
  )
}
