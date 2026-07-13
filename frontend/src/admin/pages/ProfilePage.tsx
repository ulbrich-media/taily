import { useAuth } from '@/lib/auth.hook'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/shadcn/components/ui/card'
import { Avatar, AvatarFallback } from '@/shadcn/components/ui/avatar'
import { Badge } from '@/shadcn/components/ui/badge'
import { Mail } from 'lucide-react'

export function ProfilePage() {
  const { user } = useAuth()

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <div className="flex justify-center">
      <Card className="w-full max-w-sm">
        <CardHeader className="flex flex-col items-center text-center">
          <Avatar className="h-24 w-24">
            <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
              {user && getInitials(user.name)}
            </AvatarFallback>
          </Avatar>
          <CardTitle className="mt-4 flex items-center gap-2">
            {user?.name}
            {user?.role === 'admin' && <Badge>Admin</Badge>}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Mail className="h-4 w-4" />
            {user?.email}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
