import type { ReactNode } from 'react'
import { Key } from 'lucide-react'
import type { ApiTokenResource } from '@/api/types/api-tokens'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shadcn/components/ui/table'
import { Badge } from '@/shadcn/components/ui/badge.tsx'
import { PageHeader } from '@/components/layout/PageHeader'
import { TableListView } from '@/components/list/TableListView'

interface ApiTokenResourceListPageProps {
  tokens: ApiTokenResource[]
  createAction: ReactNode
  renderRowActions: (token: ApiTokenResource) => ReactNode
  formatDateTime: (value: string | null, fallback?: string) => string
}

export function ApiTokenListPage({
  tokens,
  createAction,
  renderRowActions,
  formatDateTime,
}: ApiTokenResourceListPageProps) {
  return (
    <div className="space-y-6">
      <PageHeader
        icon={Key}
        title="API Tokens"
        description="Verwalte API-Tokens für den externen Zugriff"
        actions={createAction}
      />

      <TableListView
        data={tokens}
        emptyState={{
          title: 'Keine API-Tokens vorhanden',
          description: 'Erstelle dein erstes Token!',
        }}
      >
        {(tokens) => (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Berechtigungen</TableHead>
                <TableHead>Erstellt am</TableHead>
                <TableHead>Letzter Zugriff</TableHead>
                <TableHead className="th-contain"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tokens.map((token) => (
                <TableRow key={token.id}>
                  <TableCell className="font-medium">{token.name}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {token.abilities.map((ability) => (
                        <Badge key={ability}>{ability}</Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>{formatDateTime(token.created_at)}</TableCell>
                  <TableCell>
                    {formatDateTime(token.last_used_at, 'Bisher ungenutzt')}
                  </TableCell>
                  <TableCell className="text-right">
                    {renderRowActions(token)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </TableListView>
    </div>
  )
}
