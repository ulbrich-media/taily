import type { ReactNode } from 'react'
import { Truck } from 'lucide-react'
import type { TransportListResource } from '@/api/types/transports'
import { TableListView } from '@/components/list/TableListView'
import { PageHeader } from '@/components/layout/PageHeader'
import { TransportList } from '@/admin/module/transports/components/TransportList'

interface TransportListPageProps {
  transports: TransportListResource[]
  createAction: ReactNode
  renderDetailAction: (t: TransportListResource) => ReactNode
}

export function TransportListPage({
  transports,
  createAction,
  renderDetailAction,
}: TransportListPageProps) {
  return (
    <div className="space-y-6">
      <PageHeader
        icon={Truck}
        title="Transporte"
        description="Verwalte alle Tiertransporte"
        actions={createAction}
      />

      <TableListView
        data={transports}
        emptyState={{
          title: 'Keine Transporte gefunden',
          description: 'Noch keine Transporte angelegt.',
        }}
      >
        {(transports) => (
          <TransportList
            transports={transports}
            renderDetailAction={renderDetailAction}
          />
        )}
      </TableListView>
    </div>
  )
}
