import { User } from 'lucide-react'
import { Badge } from '@/shadcn/components/ui/badge.tsx'
import { Card, CardContent } from '@/shadcn/components/ui/card.tsx'
import type { PersonDetailResource } from '@/api/types/people'

interface PersonSidebarProps {
  person: PersonDetailResource
}

export function PersonSidebar({ person }: PersonSidebarProps) {
  const fullName =
    person.full_name || `${person.first_name} ${person.last_name}`

  return (
    <aside>
      <div className="lg:min-h-15 pb-3">
        <h1 className="text-2xl font-bold text-foreground">{fullName}</h1>
        {person.organization && (
          <p className="text-sm text-muted-foreground">
            {person.organization.name}
            {person.organization_role && ` · ${person.organization_role}`}
          </p>
        )}
      </div>

      <Card>
        <CardContent>
          {/* Profile Picture */}
          <div className="w-full aspect-square bg-muted rounded-lg flex items-center justify-center mb-6 overflow-hidden">
            {person.pictures?.[0]?.url ? (
              <img
                src={person.pictures[0].url}
                alt={person.full_name}
                className="w-full h-full object-cover"
              />
            ) : (
              <User className="h-20 w-20 text-muted-foreground" />
            )}
          </div>

          {/* Important Information */}
          <div className="space-y-4">
            {person.email && (
              <div>
                <span className="text-xs text-muted-foreground uppercase tracking-wide">
                  E-Mail
                </span>
                <p className="text-sm font-medium mt-1 break-all">
                  {person.email}
                </p>
              </div>
            )}

            {person.phone && (
              <div>
                <span className="text-xs text-muted-foreground uppercase tracking-wide">
                  Telefon
                </span>
                <p className="text-sm font-medium mt-1">{person.phone}</p>
              </div>
            )}

            {person.mobile && (
              <div>
                <span className="text-xs text-muted-foreground uppercase tracking-wide">
                  Mobil
                </span>
                <p className="text-sm font-medium mt-1">{person.mobile}</p>
              </div>
            )}

            {person.city && (
              <div>
                <span className="text-xs text-muted-foreground uppercase tracking-wide">
                  Stadt
                </span>
                <p className="text-sm font-medium mt-1">
                  {person.postal_code} {person.city} ({person.country_code})
                </p>
              </div>
            )}

            {person.date_of_birth && (
              <div>
                <span className="text-xs text-muted-foreground uppercase tracking-wide">
                  Geburtsdatum
                </span>
                <p className="text-sm font-medium mt-1">
                  {new Date(person.date_of_birth).toLocaleDateString('de-DE')}
                </p>
              </div>
            )}

            {/* Roles */}
            {person.roles && person.roles.length > 0 && (
              <div className="pt-2 border-t">
                <span className="text-xs text-muted-foreground uppercase tracking-wide block mb-2">
                  Rollen
                </span>
                <div className="flex flex-wrap gap-2">
                  {person.roles.map((role) => (
                    <Badge key={role} variant="secondary">
                      {role}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </aside>
  )
}
