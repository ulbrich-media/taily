import type { ReactNode } from 'react'
import type { AnimalListResource } from '@/api/types/animals'
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from '@/shadcn/components/ui/card'
import { InfoRow } from '@/shadcn/components/common/info-row'
import { cn } from '@/shadcn/lib/utils'
import { AnimalAvatar, AnimalPublishBadges } from './AnimalStatusBadges'

interface AnimalCardGridProps {
  animals: AnimalListResource[]
  renderRowActions: (animal: AnimalListResource) => ReactNode
  className?: string
}

export function AnimalCardGrid({
  animals,
  renderRowActions,
  className,
}: AnimalCardGridProps) {
  return (
    <ul
      className={cn(
        'grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5',
        className
      )}
    >
      {animals.map((animal) => (
        <li key={animal.id} className="flex">
          <Card className="w-full py-4 gap-4">
            <CardHeader className="px-4">
              <div className="flex gap-2 items-center">
                <AnimalAvatar animal={animal} />
                <div>
                  <p>
                    {animal.name}
                    {animal.old_name && (
                      <span className="text-muted-foreground">
                        {' '}
                        (früher {animal.old_name})
                      </span>
                    )}
                  </p>
                  <p className="text-muted-foreground">
                    {animal.animal_type?.title}
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 px-4">
              <InfoRow label="Rasse">{animal.breed || '-'}</InfoRow>
              <InfoRow label="Farbe">{animal.color || '-'}</InfoRow>
              <InfoRow label="Status">
                <AnimalPublishBadges animal={animal} />
              </InfoRow>
            </CardContent>
            <CardFooter className="px-4 mt-auto justify-end">
              {renderRowActions(animal)}
            </CardFooter>
          </Card>
        </li>
      ))}
    </ul>
  )
}
