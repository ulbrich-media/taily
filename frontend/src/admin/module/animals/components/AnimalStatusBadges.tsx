import { Bookmark, Eye, EyeOff, PawPrint } from 'lucide-react'
import type { AnimalListResource } from '@/api/types/animals'
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/shadcn/components/ui/avatar.tsx'
import { Badge } from '@/shadcn/components/ui/badge.tsx'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/shadcn/components/ui/tooltip.tsx'

export function AnimalAvatar({ animal }: { animal: AnimalListResource }) {
  return (
    <Avatar size="lg" shape="square">
      {animal.profile_picture_url && (
        <AvatarImage alt={animal.name} src={animal.profile_picture_url} />
      )}
      <AvatarFallback>
        <PawPrint className="size-5 text-muted-foreground" />
      </AvatarFallback>
    </Avatar>
  )
}

export function AnimalPublishBadges({
  animal,
}: {
  animal: AnimalListResource
}) {
  return (
    <div className="flex gap-1">
      <PublishStatusIndicator published={animal.do_publish} />
      {animal.do_publish && animal.is_reserved && <ReservedStatusIndicator />}
    </div>
  )
}

function PublishStatusIndicator({ published }: { published: boolean }) {
  const label = published ? 'Veröffentlicht' : 'Nicht veröffentlicht'
  const Icon = published ? Eye : EyeOff

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant={published ? 'success' : 'outline'}>
            <Icon />
            <span className="sr-only">{label}</span>
          </Badge>
        </TooltipTrigger>
        <TooltipContent>{label}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

function ReservedStatusIndicator() {
  const label = 'Reserviert'

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant="warning">
            <Bookmark />
            <span className="sr-only">{label}</span>
          </Badge>
        </TooltipTrigger>
        <TooltipContent>{label}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
