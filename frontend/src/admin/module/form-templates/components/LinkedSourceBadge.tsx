import { useQuery } from '@tanstack/react-query'
import { RefreshCw, TriangleAlert } from 'lucide-react'
import { Badge } from '@/shadcn/components/ui/badge'
import { Button } from '@/shadcn/components/ui/button'
import { linkableFieldsQuery } from '@/admin/module/custom-fields/api/queries'
import type { LinkedSettings } from '../api/types'
import type { EditorField } from './shared/EditorField'
import {
  findLinkSource,
  linkSourceStatus,
  recopyLinkedField,
} from './linked-field'

interface LinkedSourceBadgeProps {
  field: EditorField
  onUpdate?: (field: EditorField) => void
}

/**
 * Flags a linked field whose copied fragment no longer matches its source,
 * and offers to re-copy it.
 */
export function LinkedSourceBadge({ field, onUpdate }: LinkedSourceBadgeProps) {
  const settings = field.settings as LinkedSettings
  const { data: linkable } = useQuery({
    ...linkableFieldsQuery(settings.link?.entity ?? 'person'),
    enabled: !!settings.link,
  })

  if (!settings.link || !linkable) return null
  const status = linkSourceStatus(settings, linkable)
  if (status === 'current') return null

  const source = findLinkSource(settings.link, linkable)

  return (
    <>
      <Badge
        variant="outline"
        className="text-xs h-4 px-1.5 gap-1 border-amber-500/50 text-amber-700 dark:text-amber-400"
        title={
          status === 'removed'
            ? 'Das übernommene Feld existiert nicht mehr.'
            : 'Typ oder Optionen des übernommenen Feldes haben sich geändert.'
        }
      >
        <TriangleAlert className="size-3" />
        Quelle geändert
      </Badge>
      {source && onUpdate && (
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className="h-5 px-1.5 text-xs gap-1"
          onClick={() => onUpdate(recopyLinkedField(field, source))}
        >
          <RefreshCw className="size-3" />
          Aktualisieren
        </Button>
      )}
    </>
  )
}
