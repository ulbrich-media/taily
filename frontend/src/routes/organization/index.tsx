import { createFileRoute } from '@tanstack/react-router'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardTitleIcon,
} from '@/shadcn/components/ui/card'
import { Button } from '@/shadcn/components/ui/button'
import { Building, ArrowLeft } from 'lucide-react'
import { Route as RootRoute } from '@/routes/index'

export const Route = createFileRoute('/organization/')({
  component: OrganizationArea,
})

function OrganizationArea() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="container mx-auto px-4 py-16">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="text-3xl text-center justify-center">
              <CardTitleIcon icon={Building} className="size-8" />
              Organisations-Bereich
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center">
              <p className="text-6xl mb-4">🏠</p>
              <h2 className="text-2xl font-bold mb-4 text-foreground">
                Demnächst verfügbar
              </h2>
              <p className="text-muted-foreground mb-6">
                Der Organisations-Bereich befindet sich derzeit in der
                Entwicklung. Hier können Tierheime und Rettungsorganisationen
                bald ihre Tiere und Adoptionen verwalten.
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
