import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/shadcn/components/ui/card'
import { Button } from '@/shadcn/components/ui/button'
import { Users, Plus } from 'lucide-react'

export function PeoplePage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <Users className="h-8 w-8 text-primary" />
            Personen
          </h1>
          <p className="text-muted-foreground mt-2">
            Verwalte alle Personen und Benutzer
          </p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Person hinzufügen
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Personenliste</CardTitle>
          <CardDescription>
            Hier werden alle registrierten Personen angezeigt
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            Noch keine Personen vorhanden. Füge die erste Person hinzu!
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
