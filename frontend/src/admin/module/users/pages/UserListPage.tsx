import type { ReactNode } from 'react'
import { Users } from 'lucide-react'
import type { UserResource } from '@/api/types/users'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shadcn/components/ui/table'
import { Badge } from '@/shadcn/components/ui/badge'
import { PageHeader } from '@/components/layout/PageHeader'
import { TableListView } from '@/components/list/TableListView'

interface UserResourceListPageProps {
  users: UserResource[]
  createAction?: ReactNode
  renderRowActions?: (user: UserResource) => ReactNode
}

export function UserListPage({
  users,
  createAction,
  renderRowActions,
}: UserResourceListPageProps) {
  const getLastLogin = (user: UserResource) => {
    if (user.last_login_at) {
      return formatLastLogin(user.last_login_at)
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

  const formatLastLogin = (lastLogin: string | null) => {
    if (!lastLogin) {
      return <span className="text-muted-foreground">Noch nie</span>
    }

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
    } else {
      return date.toLocaleDateString('de-DE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      })
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Users}
        title="Benutzerverwaltung"
        description="Verwalte Benutzer und deren Berechtigungen"
        actions={createAction}
      />

      <TableListView
        data={users}
        emptyState={{
          title: 'Keine Benutzer vorhanden',
          description: 'Erstelle den ersten Benutzer!',
        }}
      >
        {(users) => (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>E-Mail</TableHead>
                <TableHead>Letzter Login</TableHead>
                {renderRowActions && (
                  <TableHead className="th-contain"></TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">
                    {user.name} {user.role === 'admin' && <Badge>Admin</Badge>}
                  </TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{getLastLogin(user)}</TableCell>
                  {renderRowActions && (
                    <TableCell className="text-right">
                      {renderRowActions(user)}
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </TableListView>
    </div>
  )
}
