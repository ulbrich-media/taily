import type { ReactNode } from 'react'
import { Badge } from '@/shadcn/components/ui/badge'
import { Card, CardContent } from '@/shadcn/components/ui/card'
import type {
  AdoptionDetailResource,
  AdoptionOverallStatus,
} from '@/api/types/adoptions'
import { Heart, PawPrint, User } from 'lucide-react'
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/shadcn/components/ui/avatar.tsx'
import { Button } from '@/shadcn/components/ui/button.tsx'
import { InfoRow } from '@/shadcn/components/common/info-row.tsx'
import { formatApiDate } from '@/lib/dates.utils.ts'

function OverallStatusBadge({ status }: { status: AdoptionOverallStatus }) {
  if (status === 'completed') {
    return <Badge variant="success">Abgeschlossen</Badge>
  }
  if (status === 'rejected') {
    return <Badge variant="destructive">Abgelehnt</Badge>
  }
  return <Badge variant="warning">In Bearbeitung</Badge>
}

interface AdoptionSidebarProps {
  adoption: AdoptionDetailResource
  mediatorEditLink?: ReactNode
}

export function AdoptionSidebar({
  adoption,
  mediatorEditLink,
}: AdoptionSidebarProps) {
  return (
    <aside>
      <div className="lg:min-h-15 pb-3">
        <h1 className="text-2xl font-bold text-foreground">
          Vermittlung von {adoption.animal.name}
        </h1>
      </div>

      <Card>
        <CardContent>
          <div className="space-y-4 flex flex-col gap-4">
            <div className="flex">
              <div className="w-[calc(50%-1rem)]">
                <div className="w-24 mx-auto aspect-square bg-muted rounded-full flex items-center justify-center mb-4 overflow-hidden">
                  {adoption.animal.pictures?.[0]?.url ? (
                    <img
                      src={adoption.animal.pictures[0].url}
                      alt={adoption.animal.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <PawPrint className="size-12 text-muted-foreground" />
                  )}
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium">{adoption.animal.name}</p>
                  {adoption.animal.animal_type?.title && (
                    <p className="text-xs text-muted-foreground">
                      {adoption.animal.animal_type.title}
                    </p>
                  )}
                </div>
              </div>
              <div className="w-8 pt-10">
                <div className="size-8 rounded-full bg-muted pt-2">
                  <Heart className="size-4 mx-auto" />
                </div>
              </div>
              <div className="w-[calc(50%-1rem)]">
                <div className="w-24 mx-auto aspect-square bg-muted rounded-full flex items-center justify-center mb-4 overflow-hidden">
                  {adoption.applicant.pictures?.[0]?.url ? (
                    <img
                      src={adoption.applicant.pictures[0].url}
                      alt={adoption.applicant.full_name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="size-12 text-muted-foreground" />
                  )}
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium">
                    {adoption.applicant.full_name}
                  </p>
                  <p className="text-xs text-muted-foreground">Interessent</p>
                </div>
              </div>
            </div>

            <div className="border-t"></div>

            {adoption.mediator && (
              <div className="flex gap-2 items-center">
                <Avatar size="lg" key={adoption.mediator.id}>
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
                <div className="flex-1">
                  <p>{adoption.mediator.full_name}</p>
                  <p className="text-xs text-muted-foreground">Vermittler</p>
                </div>
                {mediatorEditLink && (
                  <div>
                    <Button size="icon" variant="secondary" asChild>
                      {mediatorEditLink}
                    </Button>
                  </div>
                )}
              </div>
            )}

            <InfoRow label="Status">
              <OverallStatusBadge status={adoption.overall_status} />
            </InfoRow>

            <InfoRow label="Erstellt am">
              {formatApiDate(adoption.created_at)}
            </InfoRow>
          </div>
        </CardContent>
      </Card>
    </aside>
  )
}
