import type { ReactNode } from 'react'
import type { RelatedAdoption } from '@/api/types/adoptions'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/shadcn/components/ui/card'
import { Badge } from '@/shadcn/components/ui/badge'
import { formatApiDate } from '@/lib/dates.utils'

const STATUS_LABELS: Record<RelatedAdoption['status'], string> = {
  unconfirmed: 'Nicht bestätigt',
  pending: 'Neu',
  in_progress: 'Läuft',
  done: 'Abgeschlossen',
  canceled: 'Abgebrochen',
}

interface RelatedAdoptionsCardProps {
  related: RelatedAdoption[]
  renderOpenLink: (adoption: RelatedAdoption) => ReactNode
  renderImportAction: (adoption: RelatedAdoption) => ReactNode
}

/**
 * The applicant's other adoptions — the same email or the same referenced
 * Person (ADR-017). Hidden while there are none.
 */
export function RelatedAdoptionsCard({
  related,
  renderOpenLink,
  renderImportAction,
}: RelatedAdoptionsCardProps) {
  if (related.length === 0) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle>Frühere Vermittlungen</CardTitle>
        <CardDescription>
          Vermittlungen mit derselben E-Mail-Adresse oder derselben verknüpften
          Person.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="divide-y rounded-md border">
          {related.map((adoption) => (
            <li
              key={adoption.id}
              className="flex flex-col gap-2 p-3 sm:flex-row sm:items-center"
            >
              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium">
                    {adoption.animal?.name ?? 'Unbekanntes Tier'}
                  </span>
                  {adoption.animal?.animal_type && (
                    <span className="text-xs text-muted-foreground">
                      {adoption.animal.animal_type}
                    </span>
                  )}
                  <Badge variant="outline">
                    {STATUS_LABELS[adoption.status]}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  {formatApiDate(adoption.created_at)} ·{' '}
                  {adoption.applicant.full_name}
                  {' · '}
                  {matchLabel(adoption.matched_by)}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2 self-end sm:self-center">
                {renderImportAction(adoption)}
                {renderOpenLink(adoption)}
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}

function matchLabel(matchedBy: RelatedAdoption['matched_by']): string {
  if (matchedBy.includes('email') && matchedBy.includes('person'))
    return 'gleiche E-Mail und Person'
  return matchedBy.includes('person') ? 'gleiche Person' : 'gleiche E-Mail'
}
