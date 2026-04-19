import { useAuth } from '@/lib/auth.hook'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/shadcn/components/ui/card'
import { Avatar, AvatarFallback } from '@/shadcn/components/ui/avatar'
import { Button } from '@/shadcn/components/ui/button'
import { User, Mail, Edit } from 'lucide-react'

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
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
          <User className="h-8 w-8 text-primary" />
          Dein Profil
        </h1>
        <p className="text-muted-foreground mt-2">
          Verwalte deine persönlichen Informationen
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Profilbild</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center space-y-4">
            <Avatar className="h-24 w-24">
              <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                {user && getInitials(user.name)}
              </AvatarFallback>
            </Avatar>
            <Button variant="outline" size="sm" className="gap-2">
              <Edit className="h-4 w-4" />
              Bild ändern
            </Button>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Profil-Informationen</CardTitle>
            <CardDescription>Deine persönlichen Daten</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <User className="h-4 w-4" />
                Name
              </div>
              <p className="text-foreground font-medium">{user?.name}</p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Mail className="h-4 w-4" />
                E-Mail
              </div>
              <p className="text-foreground font-medium">{user?.email}</p>
            </div>
            <Button className="gap-2">
              <Edit className="h-4 w-4" />
              Profil bearbeiten
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
