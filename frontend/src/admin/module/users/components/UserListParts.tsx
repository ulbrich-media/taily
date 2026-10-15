import type { UserResource } from '@/api/types/users'
import { Badge } from '@/shadcn/components/ui/badge'

// Pieces shared by the table and the card view, so both show the same data.

export function UserName({ user }: { user: UserResource }) {
  return (
    <>
      {user.name} {user.role === 'admin' && <Badge>Admin</Badge>}
    </>
  )
}

export function UserPerson({ user }: { user: UserResource }) {
  if (!user.person) return <>-</>
  return <>{user.person.full_name}</>
}

export function UserTwoFactorStatus({ user }: { user: UserResource }) {
  if (user.two_factor_enabled) {
    return <Badge variant="success">Aktiv</Badge>
  }

  return <Badge variant="outline">Inaktiv</Badge>
}

function formatLastLogin(lastLogin: string) {
  const date = new Date(lastLogin)
  const now = new Date()
  const diffInMs = now.getTime() - date.getTime()
  const diffInHours = diffInMs / (1000 * 60 * 60)
  const diffInDays = diffInMs / (1000 * 60 * 60 * 24)

  if (diffInHours < 1) {
    const minutes = Math.floor(diffInMs / (1000 * 60))
    return `Vor ${minutes} Min.`
  } else if (diffInHours < 24) {
    const hours = Math.floor(diffInHours)
    return `Vor ${hours} Std.`
  } else if (diffInDays < 7) {
    const days = Math.floor(diffInDays)
    return `Vor ${days} Tag${days > 1 ? 'en' : ''}`
  }
  return date.toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

/** The last login, or the state of the invitation for users who never logged in. */
export function UserLastLogin({ user }: { user: UserResource }) {
  if (user.last_login_at) {
    return <>{formatLastLogin(user.last_login_at)}</>
  }

  if (!user.invitation) {
    return null
  }

  if (user.invitation.accepted_at) {
    return <Badge variant="outline">Einladung angenommen</Badge>
  }

  const isExpired = new Date(user.invitation.expires_at) < new Date()
  if (isExpired) {
    return <Badge variant="destructive">Einladung abgelaufen</Badge>
  }

  return <Badge variant="secondary">Einladung ausstehend</Badge>
}
