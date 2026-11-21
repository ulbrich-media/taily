import type { ReactNode } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/shadcn/components/ui/card'
import { Badge } from '@/shadcn/components/ui/badge'
import { InfoRow } from '@/shadcn/components/common/info-row'
import { formatApiDateTime } from '@/lib/dates.utils'
import type {
  ExportAttentionItem,
  ExportNotExportedItem,
  TiervermittlungExportStatus,
} from '@/admin/module/export-settings/api/types'

const LISTING_LABELS: {
  key: keyof TiervermittlungExportStatus['listings']
  label: string
}[] = [
  { key: 'veroeffentlicht', label: 'Veröffentlicht' },
  { key: 'nicht_veroeffentlicht', label: 'Nicht veröffentlicht' },
  { key: 'doppelt', label: 'Doppelt' },
  { key: 'abgelehnt', label: 'Abgelehnt' },
  { key: 'not_delivered', label: 'Noch nicht übermittelt' },
]

const ATTENTION_LABELS: Record<ExportAttentionItem['status'], string> = {
  abgelehnt: 'Abgelehnt',
  nicht_veroeffentlicht: 'Nicht veröffentlicht',
}

interface ExportStatusCardProps {
  status: TiervermittlungExportStatus
  /** Renders the link to an animal's status tab. */
  renderAnimalLink: (
    item: Pick<ExportNotExportedItem, 'animal_id' | 'animal_type_id' | 'name'>
  ) => ReactNode
}

export function ExportStatusCard({
  status,
  renderAnimalLink,
}: ExportStatusCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Status des Exports zu Tiervermittlung.de</CardTitle>
        <CardDescription>
          Taily übermittelt veröffentlichte Tiere automatisch an
          Tiervermittlung.de. Hier siehst du, ob der Export läuft und was damit
          passiert ist.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <Badge variant={status.enabled ? 'success' : 'outline'}>
            {status.enabled ? 'Export aktiviert' : 'Export deaktiviert'}
          </Badge>
          <Badge variant={status.api_key_configured ? 'success' : 'warning'}>
            {status.api_key_configured
              ? 'API-Schlüssel hinterlegt'
              : 'Kein API-Schlüssel hinterlegt'}
          </Badge>
        </div>

        {!status.enabled || !status.api_key_configured ? (
          <p className="text-muted-foreground text-sm">
            {!status.enabled
              ? 'Der Export ist deaktiviert, es werden keine Tiere übermittelt.'
              : 'Es ist kein API-Schlüssel hinterlegt, es werden keine Tiere übermittelt.'}
          </p>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              {LISTING_LABELS.map(({ key, label }) => (
                <InfoRow key={key} label={label}>
                  {status.listings[key]}
                </InfoRow>
              ))}
            </div>

            <InfoRow label="Letzte erfolgreiche Übermittlung">
              {status.last_delivery_at
                ? formatApiDateTime(status.last_delivery_at)
                : 'noch keine'}
            </InfoRow>

            {status.attention.length > 0 && (
              <div className="space-y-1">
                <p className="text-sm font-medium">Tiere mit Handlungsbedarf</p>
                <ul className="space-y-1 text-sm">
                  {status.attention.map((item) => (
                    <li
                      key={item.animal_id}
                      className="flex items-center gap-2"
                    >
                      {renderAnimalLink(item)}
                      <span className="text-muted-foreground">
                        {ATTENTION_LABELS[item.status]}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {status.not_exported.length > 0 && (
              <div className="space-y-1">
                <p className="text-sm font-medium">
                  Freigegeben, aber nicht exportiert
                </p>
                <p className="text-muted-foreground text-sm">
                  Diese Tiere konnten nicht an Tiervermittlung.de übermittelt
                  werden. Öffne das jeweilige Tier und prüfe die genannten
                  Gründe, um das Problem zu beheben.
                </p>
                <ul className="space-y-1 text-sm">
                  {status.not_exported.map((item) => (
                    <li key={item.animal_id}>
                      {renderAnimalLink(item)}
                      <span className="text-muted-foreground">
                        {' '}
                        – {item.reasons.join(' ')}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}
