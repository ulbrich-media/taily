import type { ReactNode } from 'react'
import type { PersonListResource } from '@/api/types/people'
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from '@/shadcn/components/ui/card'
import { InfoRow } from '@/shadcn/components/common/info-row'
import { cn } from '@/shadcn/lib/utils'
import {
  PersonAvatar,
  PersonNameAndEmail,
  PersonOrganization,
  PersonOrigin,
  PersonRoleBadges,
} from './PersonListParts'

interface PersonCardGridProps {
  people: PersonListResource[]
  renderRowActions: (person: PersonListResource) => ReactNode
  className?: string
}

export function PersonCardGrid({
  people,
  renderRowActions,
  className,
}: PersonCardGridProps) {
  return (
    <ul
      className={cn(
        'grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5',
        className
      )}
    >
      {people.map((person) => (
        <li key={person.id} className="flex">
          <Card className="w-full py-4 gap-4">
            <CardHeader className="px-4">
              <div className="flex gap-2 items-center">
                <PersonAvatar person={person} />
                <div className="min-w-0 break-words">
                  <PersonNameAndEmail person={person} />
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 px-4">
              <InfoRow label="Organisation">
                <PersonOrganization person={person} />
              </InfoRow>
              <InfoRow label="Herkunft">
                <PersonOrigin person={person} />
              </InfoRow>
              <InfoRow label="Rollen">
                <PersonRoleBadges person={person} />
              </InfoRow>
            </CardContent>
            <CardFooter className="px-4 mt-auto justify-end">
              {renderRowActions(person)}
            </CardFooter>
          </Card>
        </li>
      ))}
    </ul>
  )
}
