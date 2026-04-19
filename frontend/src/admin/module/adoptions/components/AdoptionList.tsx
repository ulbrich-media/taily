import type { ReactNode } from 'react'
import {
  Circle,
  Clock,
  CheckCircle2,
  XCircle,
  User,
  PawPrint,
} from 'lucide-react'
import type {
  AdoptionListResource,
  AdoptionStepStatus,
  AdoptionOverallStatus,
} from '@/api/types/adoptions'
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

function StepStatusIcon({ status }: { status: AdoptionStepStatus }) {
  if (status === 'finished') {
    return <CheckCircle2 className="size-5 text-green-500" />
  }
  if (status === 'in_progress') {
    return <Clock className="size-5 text-amber-500" />
  }
  return <Circle className="size-5 text-muted-foreground/40" />
}

function OverallStatusIcon({ status }: { status: AdoptionOverallStatus }) {
  if (status === 'completed') {
    return <CheckCircle2 className="size-5 text-green-500" />
  }
  if (status === 'rejected') {
    return <XCircle className="size-5 text-destructive" />
  }
  return <Clock className="size-5 text-amber-500" />
}

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
          <TableHead className="text-center th-contain">Vorkontrolle</TableHead>
          <TableHead className="text-center th-contain">Vertrag</TableHead>
          <TableHead className="text-center th-contain">Übergabe</TableHead>
          <TableHead className="text-center th-contain">Status</TableHead>
          <TableHead className="th-contain"></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {adoptions.map((adoption) => (
          <TableRow key={adoption.id}>
            {showAnimal && (
              <TableCell>
                <div className="flex gap-2 items-center">
                  <Avatar size="lg">
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
                  <Avatar size="lg">
                    {adoption.applicant.profile_picture_url && (
                      <AvatarImage
                        alt={adoption.applicant.full_name}
                        src={adoption.applicant.profile_picture_url}
                      />
                    )}
                    <AvatarFallback>
                      <User className="size-5 text-muted-foreground" />
                    </AvatarFallback>
                  </Avatar>
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
            <TableCell className="text-center">
              <div className="flex justify-center">
                <StepStatusIcon status={adoption.pre_inspection_status} />
              </div>
            </TableCell>
            <TableCell className="text-center">
              <div className="flex justify-center">
                <StepStatusIcon status={adoption.contract_status} />
              </div>
            </TableCell>
            <TableCell className="text-center">
              <div className="flex justify-center">
                <StepStatusIcon status={adoption.transfer_status} />
              </div>
            </TableCell>
            <TableCell className="text-center">
              <div className="flex justify-center">
                <OverallStatusIcon status={adoption.overall_status} />
              </div>
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
