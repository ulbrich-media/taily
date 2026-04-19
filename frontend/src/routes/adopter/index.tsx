import { createFileRoute } from '@tanstack/react-router'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardTitleIcon,
} from '@/shadcn/components/ui/card'
import { Button } from '@/shadcn/components/ui/button'
import { Heart, ArrowLeft } from 'lucide-react'
import { Route as RootRoute } from '@/routes/index'

export const Route = createFileRoute('/adopter/')({
  component: AdopterArea,
})

function AdopterArea() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="container mx-auto px-4 py-16">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="text-3xl text-center justify-center">
              <CardTitleIcon icon={Heart} className="size-8" />
              Adoptanten-Bereich
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center">
              <p className="text-6xl mb-4">🐕</p>
              <h2 className="text-2xl font-bold mb-4 text-foreground">
                Demnächst verfügbar
              </h2>
              <p className="text-muted-foreground mb-6">
                Der Adoptanten-Bereich befindet sich derzeit in der Entwicklung.
                Hier kannst du bald verfügbare Tiere durchsuchen und
                Adoptionsanträge stellen.
              </p>
            </div>
            <div className="flex justify-center">
              <Button asChild className="gap-2">
                <RootRoute.Link>
                  <ArrowLeft className="h-4 w-4" />
                  Zurück zur Startseite
                </RootRoute.Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
