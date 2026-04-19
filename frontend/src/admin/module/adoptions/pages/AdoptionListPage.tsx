import type { ReactNode } from 'react'
import { Heart } from 'lucide-react'
import type { AdoptionListResource } from '@/api/types/adoptions'
import { TableListView } from '@/components/list/TableListView'
import { PageHeader } from '@/components/layout/PageHeader'
import { AdoptionList } from '@/admin/module/adoptions/components/AdoptionList'

interface AdoptionListPageProps {
  adoptions: AdoptionListResource[]
  createAction: ReactNode
  renderDetailLink?: (adoption: AdoptionListResource) => ReactNode
}

export function AdoptionListPage({
  adoptions,
  createAction,
  renderDetailLink,
}: AdoptionListPageProps) {
  return (
    <div className="space-y-6">
      <PageHeader
        icon={Heart}
        title="Vermittlungen"
        description="Verwalte alle Vermittlungsvorgänge"
        actions={createAction}
      />

      <TableListView
        data={adoptions}
        emptyState={{
          title: 'Keine Vermittlungen gefunden',
          description: 'Noch keine Vermittlungsvorgänge vorhanden.',
        }}
      >
        {(adoptions) => (
          <AdoptionList
            adoptions={adoptions}
            renderDetailLink={renderDetailLink}
          />
        )}
      </TableListView>
    </div>
  )
}
