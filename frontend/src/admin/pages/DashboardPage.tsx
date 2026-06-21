import { useAuth } from '@/lib/auth.hook'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardTitleIcon,
} from '@/shadcn/components/ui/card'
import { PawPrint, Heart, Building } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader.tsx'

export function DashboardPage() {
  const { user } = useAuth()

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description={
          user?.name ? `Willkommen zurück, ${user.name}!` : 'Willkommen zurück!'
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Tiere</CardTitle>
            <CardTitleIcon icon={PawPrint} />
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-heading font-bold text-primary">
              0
            </div>
            <CardDescription className="mt-1">
              Gesamtzahl der Tiere im System
            </CardDescription>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Adoptionen</CardTitle>
            <CardTitleIcon icon={Heart} />
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-heading font-bold text-primary">
              0
            </div>
            <CardDescription className="mt-1">
              Ausstehende Adoptionsanträge
            </CardDescription>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Organisationen</CardTitle>
            <CardTitleIcon icon={Building} />
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-heading font-bold text-primary">
              0
            </div>
            <CardDescription className="mt-1">
              Registrierte Organisationen
            </CardDescription>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
