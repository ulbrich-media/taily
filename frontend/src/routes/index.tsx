import { createFileRoute } from '@tanstack/react-router'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  CardTitleIcon,
} from '@/shadcn/components/ui/card'
import { Button } from '@/shadcn/components/ui/button'
import { Shield, Heart, Building, PawPrintIcon } from 'lucide-react'
import { Route as DashboardRoute } from '@/routes/admin/_authenticated/index'
import { Route as AdopterRoute } from '@/routes/adopter/index'
import { Route as OrgRoute } from '@/routes/organization/index'

export const Route = createFileRoute('/')({
  component: LandingPage,
})

function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="mb-4 flex justify-center items-center gap-3">
            <PawPrintIcon className="size-8 text-primary" />
            <span className="text-4xl font-bold text-foreground">Taily</span>
          </h1>
          <p className="text-xl text-muted-foreground">Wähle deinen Bereich</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>
                <CardTitleIcon icon={Shield} />
                Administratoren
              </CardTitle>
              <CardDescription>
                Verwaltung und Systemkonfiguration
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1">
              <p className="text-sm text-muted-foreground">
                Zugriff auf alle Verwaltungsfunktionen, Benutzerverwaltung und
                Systemeinstellungen.
              </p>
            </CardContent>
            <CardFooter>
              <Button className="w-full" asChild>
                <DashboardRoute.Link>Zum Admin-Bereich</DashboardRoute.Link>
              </Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>
                <CardTitleIcon icon={Heart} />
                Adoptanten
              </CardTitle>
              <CardDescription>
                Für Tierliebhaber und Adoptionswillige
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1">
              <p className="text-sm text-muted-foreground">
                Durchsuche verfügbare Hunde und verwalte deine Adoptionsanträge.
              </p>
            </CardContent>
            <CardFooter>
              <Button className="w-full" variant="outline" asChild>
                <AdopterRoute.Link>Demnächst verfügbar</AdopterRoute.Link>
              </Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>
                <CardTitleIcon icon={Building} />
                Organisationen
              </CardTitle>
              <CardDescription>
                Für Tierheime und Rettungsorganisationen
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1">
              <p className="text-sm text-muted-foreground">
                Melde uns verfügbare Tiere, denen wir ein neues Zuhause suchen
                können.
              </p>
            </CardContent>
            <CardFooter>
              <Button className="w-full" variant="outline" asChild>
                <OrgRoute.Link>Demnächst verfügbar</OrgRoute.Link>
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  )
}
