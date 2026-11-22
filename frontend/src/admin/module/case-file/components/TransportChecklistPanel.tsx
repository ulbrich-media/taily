import type { ReactNode } from 'react'
import { useQuery } from '@tanstack/react-query'
import { CircleCheck } from 'lucide-react'
import { Spinner } from '@/shadcn/components/ui/spinner'
import { Badge } from '@/shadcn/components/ui/badge'
import { getTransportChecklistQuery } from '../api/queries'
import { ChecklistItemIcon } from './ChecklistSummary'

interface TransportChecklistPanelProps {
  transportId: string
  renderAdoptionLink: (adoptionId: string, label: string) => ReactNode
}

/**
 * What is still missing for every adoption on a planned run, so nobody has
 * to open each adoption, animal and person by hand
 * (docs/features/transport.md#checklist).
 */
export function TransportChecklistPanel({
  transportId,
  renderAdoptionLink,
}: TransportChecklistPanelProps) {
  const { data, isLoading, isError } = useQuery(
    getTransportChecklistQuery(transportId)
  )

  if (isLoading) {
    return (
      <p className="text-sm text-muted-foreground flex gap-2 items-baseline">
        <Spinner className="size-3" />
        Lade Checkliste...
      </p>
    )
  }

  if (isError || !data) {
    return (
      <p className="text-sm text-destructive">
        Fehler beim Laden der Checkliste.
      </p>
    )
  }

  if (data.total === 0) return null

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Badge variant={data.complete === data.total ? 'success' : 'warning'}>
          {data.complete} von {data.total} vollständig
        </Badge>
      </div>
      <ul className="space-y-2 text-sm">
        {data.adoptions.map((row) => {
          const open = row.checklist.items.filter(
            (item) => item.status !== 'done'
          )
          return (
            <li key={row.adoption_id} className="space-y-1">
              <div className="font-medium">
                {renderAdoptionLink(
                  row.adoption_id,
                  `${row.animal.name} → ${row.applicant.full_name}`
                )}
              </div>
              {open.length === 0 ? (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <CircleCheck className="size-4 text-green-600" />
                  Vollständig
                </div>
              ) : (
                <ul className="space-y-1 pl-1">
                  {open.map((item) => (
                    <li key={item.key} className="flex items-center gap-2">
                      <ChecklistItemIcon item={item} />
                      {item.label}
                      {item.status === 'awaiting_review' && (
                        <span className="text-muted-foreground">
                          (Prüfung offen)
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}
