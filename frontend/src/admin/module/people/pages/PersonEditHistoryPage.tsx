import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardTitleIcon,
} from '@/shadcn/components/ui/card.tsx'
import { Clock } from 'lucide-react'

export function PersonEditHistoryPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <CardTitleIcon icon={Clock} />
          Verlauf
        </CardTitle>
        <CardDescription>
          Chronologische Übersicht aller Aktivitäten
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-center py-12 text-muted-foreground">
          <p className="text-lg font-medium">Wird bald verfügbar sein</p>
          <p className="text-sm mt-2">
            Hier wird der vollständige Aktivitätsverlauf dieser Person
            angezeigt.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
