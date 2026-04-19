import type { ReactNode } from 'react'
import { Users, User } from 'lucide-react'
import { cn } from '@/shadcn/lib/utils.ts'
import type { PersonListResource } from '@/api/types/people'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shadcn/components/ui/table'
import { Badge } from '@/shadcn/components/ui/badge'
import { TableListView } from '@/components/list/TableListView'
import { PageHeader } from '@/components/layout/PageHeader'

interface PersonListResourceListPageProps {
  people: PersonListResource[]
  createAction: ReactNode
  renderRowActions: (person: PersonListResource) => ReactNode
}

export function PersonListPage({
  people,
  createAction,
  renderRowActions,
}: PersonListResourceListPageProps) {
  return (
    <div className="space-y-6">
      <PageHeader
        icon={Users}
        title="Personen"
        description="Verwalte alle Personen und Kontakte"
        actions={createAction}
      />

      <TableListView
        data={people}
        emptyState={{
          title: 'Keine Personen gefunden',
          description: 'Füge jetzt eine Person hinzu!',
        }}
      >
        {(people) => (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12"></TableHead>
                <TableHead>Name, E-Mail</TableHead>
                <TableHead>Organisation</TableHead>
                <TableHead>Herkunft</TableHead>
                <TableHead>Rollen</TableHead>
                <TableHead className="th-contain"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {people.map((person) => (
                <TableRow key={person.id}>
                  <TableCell className="w-12">
                    <div
                      className={cn(
                        'size-10 rounded-md bg-muted flex items-center justify-center overflow-hidden shrink-0',
                        person.profile_picture_url && 'bg-transparent'
                      )}
                    >
                      {person.profile_picture_url ? (
                        <img
                          src={person.profile_picture_url}
                          alt={person.full_name}
                          className="size-full object-cover"
                        />
                      ) : (
                        <User className="size-5 text-muted-foreground" />
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">
                    <p>
                      {person.full_name ||
                        `${person.first_name} ${person.last_name}`}
                    </p>
                    {person.email && (
                      <p className="text-muted-foreground text-sm">
                        {person.email}
                      </p>
                    )}
                  </TableCell>
                  <TableCell>
                    {person.organization && (
                      <>
                        <p>{person.organization.name}</p>
                        {person.organization_role && (
                          <p className="text-muted-foreground text-sm">
                            {person.organization_role}
                          </p>
                        )}
                      </>
                    )}
                  </TableCell>
                  <TableCell>
                    {person.postal_code &&
                      person.city &&
                      person.country_code && (
                        <p>
                          {person.postal_code} {person.city} (
                          {person.country_code})
                        </p>
                      )}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1 flex-wrap">
                      {person.roles && person.roles.length > 0 ? (
                        person.roles.map((role) => (
                          <Badge key={role} variant="secondary">
                            {role}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-muted-foreground text-sm">
                          Keine
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    {renderRowActions(person)}
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
