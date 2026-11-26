import { Card, CardContent } from '@/shadcn/components/ui/card'
import type { AnimalTypeResource } from '@/api/types/animal-types'
import { TIERVERMITTLUNG_SPECIES_LABELS } from '@/admin/module/animal-types/tiervermittlung-species'

interface AnimalTypeSidebarProps {
  animalType: AnimalTypeResource
}

export function AnimalTypeSidebar({ animalType }: AnimalTypeSidebarProps) {
  return (
    <aside>
      <Card>
        <CardContent>
          <div className="space-y-4">
            <div>
              <span className="text-xs text-muted-foreground uppercase tracking-wide">
                Name
              </span>
              <p className="text-sm font-medium mt-1">{animalType.title}</p>
            </div>

            <div>
              <span className="text-xs text-muted-foreground uppercase tracking-wide">
                Tierart auf Tiervermittlung.de
              </span>
              <p className="text-sm font-medium mt-1">
                {animalType.tiervermittlung_species
                  ? TIERVERMITTLUNG_SPECIES_LABELS[
                      animalType.tiervermittlung_species
                    ]
                  : 'Nicht exportieren'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </aside>
  )
}
