import type { ReactNode } from 'react'
import { Copy, Check } from 'lucide-react'
import { useState } from 'react'
import type {
  PreInspectionResource,
  PreInspectionVerdict,
} from '@/api/types/pre-inspections'
import { Badge } from '@/shadcn/components/ui/badge'
import { Button } from '@/shadcn/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shadcn/components/ui/table'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/shadcn/components/ui/tooltip.tsx'
import { formatApiDate } from '@/lib/dates.utils.ts'

function VerdictBadge({ verdict }: { verdict: PreInspectionVerdict }) {
  if (verdict === 'approved') {
    return <Badge variant="success">Geeignet</Badge>
  }
  if (verdict === 'rejected') {
    return <Badge variant="error">Nicht geeignet</Badge>
  }
  return <Badge variant="outline">Ausstehend</Badge>
}

function CopyLinkButton({ url }: { url: string }) {
  const [copied, setCopied] = useState(false)
  const [copyFailed, setCopyFailed] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy link:', err)
      setCopyFailed(true)
      setTimeout(() => setCopyFailed(false), 2000)
    }
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            size="icon-sm"
            variant={copyFailed ? 'destructive' : 'outline'}
            onClick={handleCopy}
            title={copyFailed ? 'Kopieren fehlgeschlagen' : 'Link kopieren'}
          >
            {copied ? (
              <Check className="size-4" />
            ) : (
              <Copy className="size-4" />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          Link zum öffentlichen Formular dieser Vorkontrolle kopieren
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

interface PreInspectionListProps {
  inspections: PreInspectionResource[]
  renderDetailLink?: (inspection: PreInspectionResource) => ReactNode
}

export function PreInspectionList({
  inspections,
  renderDetailLink,
}: PreInspectionListProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Datum</TableHead>
          <TableHead>Tierart</TableHead>
          <TableHead>Kontrolleur</TableHead>
          <TableHead>Bewertung</TableHead>
          <TableHead></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {inspections.map((inspection) => (
          <TableRow key={inspection.id}>
            <TableCell>{formatApiDate(inspection.created_at)}</TableCell>
            <TableCell className="font-medium">
              {inspection.animal_type.title}
            </TableCell>
            <TableCell>
              {inspection.inspector?.full_name ?? (
                <span className="text-muted-foreground">Nicht zugewiesen</span>
              )}
            </TableCell>
            <TableCell>
              <VerdictBadge verdict={inspection.verdict} />
            </TableCell>
            <TableCell className="text-right">
              <div className="flex justify-end gap-2">
                {inspection.submission_url &&
                  inspection.verdict === 'pending' && (
                    <CopyLinkButton url={inspection.submission_url} />
                  )}
                {renderDetailLink && (
                  <Button size="sm" variant="outline" asChild>
                    {renderDetailLink(inspection)}
                  </Button>
                )}
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
