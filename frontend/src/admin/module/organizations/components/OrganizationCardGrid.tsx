import type { ReactNode } from 'react'
import type { OrganizationResource } from '@/api/types/organizations'
import { ListCard, ListCardGrid } from '@/components/list/ListCardGrid'
import { InfoRow } from '@/shadcn/components/common/info-row'

interface OrganizationCardGridProps {
  organizations: OrganizationResource[]
  renderRowActions: (organization: OrganizationResource) => ReactNode
  className?: string
}

export function OrganizationCardGrid({
  organizations,
  renderRowActions,
  className,
}: OrganizationCardGridProps) {
  return (
    <ListCardGrid
      items={organizations}
      getKey={(organization) => organization.id}
      className={className}
    >
      {(organization) => (
        <ListCard
          header={<p className="font-medium">{organization.name}</p>}
          footer={renderRowActions(organization)}
        >
          <InfoRow label="E-Mail">{organization.email || '-'}</InfoRow>
          <InfoRow label="Stadt">{organization.city || '-'}</InfoRow>
          <InfoRow label="Personen">{organization.people_count || 0}</InfoRow>
        </ListCard>
      )}
    </ListCardGrid>
  )
}
