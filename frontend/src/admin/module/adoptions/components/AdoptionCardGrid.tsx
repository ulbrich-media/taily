import type { ReactNode } from 'react'
import type { AdoptionListResource } from '@/api/types/adoptions'
import { AdoptionStatusIndicator } from './AdoptionStatusIndicator'
import {
  AnimalSummary,
  ApplicantSummary,
  MediatorSummary,
} from './AdoptionParties'
import { Button } from '@/shadcn/components/ui/button'
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from '@/shadcn/components/ui/card'
import { InfoRow } from '@/shadcn/components/common/info-row'
import { cn } from '@/shadcn/lib/utils'

interface AdoptionCardGridProps {
  adoptions: AdoptionListResource[]
  renderDetailLink?: (adoption: AdoptionListResource) => ReactNode
  className?: string
}

export function AdoptionCardGrid({
  adoptions,
  renderDetailLink,
  className,
}: AdoptionCardGridProps) {
  return (
    <ul
      className={cn(
        'grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5',
        className
      )}
    >
      {adoptions.map((adoption) => (
        <li key={adoption.id} className="flex">
          <Card className="w-full py-4 gap-4">
            <CardHeader className="px-4">
              <AnimalSummary animal={adoption.animal} />
            </CardHeader>
            <CardContent className="space-y-4 px-4">
              <InfoRow label="Interessent">
                <ApplicantSummary applicant={adoption.applicant} />
              </InfoRow>
              <InfoRow label="Vermittler">
                <MediatorSummary mediator={adoption.mediator} />
              </InfoRow>
              <InfoRow label="Status">
                <AdoptionStatusIndicator adoption={adoption} />
              </InfoRow>
            </CardContent>
            {renderDetailLink && (
              <CardFooter className="px-4 mt-auto justify-end">
                <Button size="sm" variant="outline" asChild>
                  {renderDetailLink(adoption)}
                </Button>
              </CardFooter>
            )}
          </Card>
        </li>
      ))}
    </ul>
  )
}
