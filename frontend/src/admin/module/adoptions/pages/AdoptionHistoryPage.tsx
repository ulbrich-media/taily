import { History } from 'lucide-react'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardTitleIcon,
} from '@/shadcn/components/ui/card'

export function AdoptionHistoryPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <CardTitleIcon icon={History} />
          Verlauf
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center py-12 text-muted-foreground">
          <p className="text-lg font-medium">Wird bald verfügbar sein</p>
          <p className="text-sm mt-2">
            Hier wird der Verlauf aller Änderungen angezeigt.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
