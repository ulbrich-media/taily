import { ExternalLink } from 'lucide-react'
import type { AnimalTiervermittlungState } from '@/api/types/animals'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/shadcn/components/ui/card.tsx'
import { Badge } from '@/shadcn/components/ui/badge.tsx'
import { formatApiDateTime } from '@/lib/dates.utils.ts'
import { summarizeTiervermittlung } from '@/admin/module/animals/tiervermittlung-status.ts'

function ReasonList({ title, items }: { title: string; items: string[] }) {
  if (items.length === 0) return null

  return (
    <div className="space-y-1">
      <p className="text-sm font-medium">{title}</p>
      <ul className="list-disc pl-5 text-sm text-muted-foreground">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  )
}

interface AnimalTiervermittlungCardProps {
  tiervermittlung: AnimalTiervermittlungState
}

export function AnimalTiervermittlungCard({
  tiervermittlung,
}: AnimalTiervermittlungCardProps) {
  const summary = summarizeTiervermittlung(tiervermittlung)
  const { listing, exclusion_reasons } = tiervermittlung

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Tiervermittlung.de
          <Badge variant={summary.variant}>{summary.label}</Badge>
        </CardTitle>
        <CardDescription>{summary.description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <ReasonList title="Gründe" items={exclusion_reasons} />
        {listing && (
          <>
            {listing.last_error && (
              <ReasonList title="Fehler" items={[listing.last_error]} />
            )}
            <ReasonList
              title="Gründe von Tiervermittlung.de"
              items={listing.reasons}
            />
            <ReasonList title="Hinweise" items={listing.warnings} />
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
              {listing.last_sent_at && (
                <span>
                  Zuletzt gesendet: {formatApiDateTime(listing.last_sent_at)}
                </span>
              )}
              {listing.url && (
                <a
                  href={listing.url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-primary underline-offset-4 hover:underline"
                >
                  Anzeige{listing.tv_id ? ` Nr. ${listing.tv_id}` : ''} öffnen
                  <ExternalLink className="size-3" />
                </a>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
