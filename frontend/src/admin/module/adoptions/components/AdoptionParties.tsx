import { PawPrint, User } from 'lucide-react'
import type { AdoptionListResource } from '@/api/types/adoptions'
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/shadcn/components/ui/avatar.tsx'

// The animal, applicant and mediator blocks of an adoption row or card.

export function AnimalSummary({
  animal,
}: {
  animal: AdoptionListResource['animal']
}) {
  return (
    <div className="flex gap-2 items-center">
      <Avatar size="lg" shape="square">
        {animal.profile_picture_url && (
          <AvatarImage alt={animal.name} src={animal.profile_picture_url} />
        )}
        <AvatarFallback>
          <PawPrint className="size-5 text-muted-foreground" />
        </AvatarFallback>
      </Avatar>
      <div>
        <p>
          {animal.name}
          {animal.old_name && ` (${animal.old_name})`}
        </p>
        <p className="text-muted-foreground">{animal.animal_type?.title}</p>
      </div>
    </div>
  )
}

export function ApplicantSummary({
  applicant,
}: {
  applicant: AdoptionListResource['applicant']
}) {
  return (
    <div className="flex gap-2 items-center">
      <div>
        <p>{applicant.full_name ?? ''}</p>
        {applicant.city && (
          <p className="text-muted-foreground">
            {applicant.postal_code} {applicant.city} ({applicant.country_code})
          </p>
        )}
      </div>
    </div>
  )
}

export function MediatorSummary({
  mediator,
}: {
  mediator: AdoptionListResource['mediator']
}) {
  if (!mediator) {
    return <span className="text-muted-foreground">Nicht zugewiesen</span>
  }

  return (
    <div className="flex gap-2 items-center">
      <Avatar size="lg">
        {mediator.profile_picture_url && (
          <AvatarImage
            alt={mediator.full_name}
            src={mediator.profile_picture_url}
          />
        )}
        <AvatarFallback>
          <User className="size-5 text-muted-foreground" />
        </AvatarFallback>
      </Avatar>
      <div>
        <p>{mediator.full_name ?? ''}</p>
      </div>
    </div>
  )
}
