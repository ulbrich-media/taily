import { PawPrint } from 'lucide-react'
import { Badge } from '@/shadcn/components/ui/badge.tsx'
import { Card, CardContent } from '@/shadcn/components/ui/card.tsx'
import type { AnimalDetailResource } from '@/api/types/animals'

interface AnimalSidebarProps {
  animal: AnimalDetailResource
}

export function AnimalSidebar({ animal }: AnimalSidebarProps) {
  const profilePicture = animal.pictures?.find((p) => p.type === 'image')

  return (
    <aside className="">
      <div className="lg:min-h-15 pb-3">
        <h1 className="text-2xl font-bold text-foreground">{animal.name}</h1>
        {animal.old_name && (
          <p className="text-sm text-muted-foreground">
            früher: {animal.old_name}
          </p>
        )}
      </div>
      <Card>
        <CardContent>
          {/* Profile Picture */}
          <div className="w-full aspect-square bg-muted rounded-lg flex items-center justify-center mb-6 overflow-hidden">
            {profilePicture ? (
              <img
                src={profilePicture.url}
                alt={animal.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <PawPrint className="h-20 w-20 text-muted-foreground" />
            )}
          </div>

          {/* Important Information */}
          <div className="space-y-4">
            <div>
              <span className="text-xs text-muted-foreground uppercase tracking-wide">
                Tiernummer
              </span>
              <p className="text-sm font-medium mt-1">{animal.animal_number}</p>
            </div>

            <div>
              <span className="text-xs text-muted-foreground uppercase tracking-wide">
                Geschlecht
              </span>
              <p className="text-sm font-medium mt-1">
                {animal.gender === 'male' ? 'Männlich' : 'Weiblich'}
              </p>
            </div>

            {animal.breed && (
              <div>
                <span className="text-xs text-muted-foreground uppercase tracking-wide">
                  Rasse
                </span>
                <p className="text-sm font-medium mt-1">{animal.breed}</p>
              </div>
            )}

            {animal.color && (
              <div>
                <span className="text-xs text-muted-foreground uppercase tracking-wide">
                  Farbe
                </span>
                <p className="text-sm font-medium mt-1">{animal.color}</p>
              </div>
            )}

            {animal.date_of_birth && (
              <div>
                <span className="text-xs text-muted-foreground uppercase tracking-wide">
                  Geburtsdatum
                </span>
                <p className="text-sm font-medium mt-1">
                  {new Date(animal.date_of_birth).toLocaleDateString('de-DE')}
                </p>
              </div>
            )}

            {/* Badges */}
            {animal.is_neutered && (
              <div className="pt-2 border-t">
                <span className="text-xs text-muted-foreground uppercase tracking-wide block mb-2">
                  Status
                </span>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline">Kastriert</Badge>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </aside>
  )
}
