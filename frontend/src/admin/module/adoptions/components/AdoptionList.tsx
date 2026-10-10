import type { ReactNode } from 'react'
import { User, PawPrint } from 'lucide-react'
import type { AdoptionListResource } from '@/api/types/adoptions'
import { AdoptionStatusIndicator } from './AdoptionStatusIndicator'
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
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/shadcn/components/ui/avatar.tsx'

interface AdoptionListProps {
  adoptions: AdoptionListResource[]
  showAnimal?: boolean
  showApplicant?: boolean
  showMediator?: boolean
  renderDetailLink?: (adoption: AdoptionListResource) => ReactNode
}

export function AdoptionList({
  adoptions,
  showAnimal = true,
  showApplicant = true,
  showMediator = true,
  renderDetailLink,
}: AdoptionListProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          {showAnimal && <TableHead>Tier</TableHead>}
          {showApplicant && <TableHead>Interessent</TableHead>}
          {showMediator && <TableHead>Vermittler</TableHead>}
          <TableHead>Status</TableHead>
          <TableHead className="th-contain"></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {adoptions.map((adoption) => (
          <TableRow key={adoption.id}>
            {showAnimal && (
              <TableCell>
                <div className="flex gap-2 items-center">
                  <Avatar size="lg" shape="square">
                    {adoption.animal.profile_picture_url && (
                      <AvatarImage
                        alt={adoption.animal.name}
                        src={adoption.animal.profile_picture_url}
                      />
                    )}
                    <AvatarFallback>
                      <PawPrint className="size-5 text-muted-foreground" />
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p>
                      {adoption.animal.name}
                      {adoption.animal.old_name &&
                        ` (${adoption.animal.old_name})`}
                    </p>
                    <p className="text-muted-foreground">
                      {adoption.animal.animal_type?.title}
                    </p>
                  </div>
                </div>
              </TableCell>
            )}
            {showApplicant && (
              <TableCell>
                <div className="flex gap-2 items-center">
                  <div>
                    <p>{adoption.applicant.full_name ?? ''}</p>
                    {adoption.applicant.city && (
                      <p className="text-muted-foreground">
                        {adoption.applicant.postal_code}{' '}
                        {adoption.applicant.city} (
                        {adoption.applicant.country_code})
                      </p>
                    )}
                  </div>
                </div>
              </TableCell>
            )}
            {showMediator && (
              <TableCell>
                {adoption.mediator ? (
                  <div className="flex gap-2 items-center">
                    <Avatar size="lg">
                      {adoption.mediator.profile_picture_url && (
                        <AvatarImage
                          alt={adoption.mediator.full_name}
                          src={adoption.mediator.profile_picture_url}
                        />
                      )}
                      <AvatarFallback>
                        <User className="size-5 text-muted-foreground" />
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p>{adoption.mediator.full_name ?? ''}</p>
                    </div>
                  </div>
                ) : (
                  <span className="text-muted-foreground">
                    Nicht zugewiesen
                  </span>
                )}
              </TableCell>
            )}
            <TableCell>
              <AdoptionStatusIndicator adoption={adoption} />
            </TableCell>
            <TableCell className="text-right">
              {renderDetailLink && (
                <Button size="sm" variant="outline" asChild>
                  {renderDetailLink(adoption)}
                </Button>
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
