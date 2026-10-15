import { User } from 'lucide-react'
import type { PersonListResource } from '@/api/types/people'
import { Badge } from '@/shadcn/components/ui/badge'
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/shadcn/components/ui/avatar'
import { personName } from '../person-name'

// Pieces shared by the table and the card view, so both show the same data.

export function PersonAvatar({ person }: { person: PersonListResource }) {
  return (
    <Avatar size="lg">
      {person.profile_picture_url && (
        <AvatarImage
          alt={personName(person)}
          src={person.profile_picture_url}
        />
      )}
      <AvatarFallback>
        <User className="size-5 text-muted-foreground" />
      </AvatarFallback>
    </Avatar>
  )
}

export function PersonNameAndEmail({ person }: { person: PersonListResource }) {
  return (
    <>
      <p>{personName(person)}</p>
      {person.email && (
        <p className="text-muted-foreground text-sm">{person.email}</p>
      )}
    </>
  )
}

export function PersonOrganization({ person }: { person: PersonListResource }) {
  if (!person.organization) return <>-</>
  return (
    <>
      <p>{person.organization.name}</p>
      {person.organization_role && (
        <p className="text-muted-foreground text-sm">
          {person.organization_role}
        </p>
      )}
    </>
  )
}

export function PersonOrigin({ person }: { person: PersonListResource }) {
  if (!person.postal_code || !person.city || !person.country_code) {
    return <>-</>
  }
  return (
    <p>
      {person.postal_code} {person.city} ({person.country_code})
    </p>
  )
}

export function PersonRoleBadges({ person }: { person: PersonListResource }) {
  if (!person.roles || person.roles.length === 0) {
    return <span className="text-muted-foreground text-sm">Keine</span>
  }
  return (
    <div className="flex gap-1 flex-wrap">
      {person.roles.map((role) => (
        <Badge key={role} variant="secondary">
          {role}
        </Badge>
      ))}
    </div>
  )
}
