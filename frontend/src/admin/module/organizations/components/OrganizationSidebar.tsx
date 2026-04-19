import { Building2 } from 'lucide-react'
import { Card, CardContent } from '@/shadcn/components/ui/card'
import type { OrganizationResource } from '@/api/types/organizations'

interface OrganizationSidebarProps {
  organization: OrganizationResource
}

export function OrganizationSidebar({
  organization,
}: OrganizationSidebarProps) {
  return (
    <aside>
      <div className="lg:min-h-15 pb-3">
        <h1 className="text-2xl font-bold text-foreground">
          {organization.name}
        </h1>
      </div>

      <Card>
        <CardContent>
          {/* OrganizationResource Icon */}
          <div className="w-full aspect-square bg-muted rounded-lg flex items-center justify-center mb-6">
            <Building2 className="h-20 w-20 text-muted-foreground" />
          </div>

          {/* Important Information */}
          <div className="space-y-4">
            {organization.email && (
              <div>
                <span className="text-xs text-muted-foreground uppercase tracking-wide">
                  E-Mail
                </span>
                <p className="text-sm font-medium mt-1 break-all">
                  {organization.email}
                </p>
              </div>
            )}

            {organization.phone && (
              <div>
                <span className="text-xs text-muted-foreground uppercase tracking-wide">
                  Telefon
                </span>
                <p className="text-sm font-medium mt-1">{organization.phone}</p>
              </div>
            )}

            {organization.mobile && (
              <div>
                <span className="text-xs text-muted-foreground uppercase tracking-wide">
                  Mobil
                </span>
                <p className="text-sm font-medium mt-1">
                  {organization.mobile}
                </p>
              </div>
            )}

            {organization.city && (
              <div>
                <span className="text-xs text-muted-foreground uppercase tracking-wide">
                  Stadt
                </span>
                <p className="text-sm font-medium mt-1">{organization.city}</p>
              </div>
            )}

            {organization.people_count !== undefined && (
              <div>
                <span className="text-xs text-muted-foreground uppercase tracking-wide">
                  Zugeordnete Personen
                </span>
                <p className="text-sm font-medium mt-1">
                  {organization.people_count}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </aside>
  )
}
