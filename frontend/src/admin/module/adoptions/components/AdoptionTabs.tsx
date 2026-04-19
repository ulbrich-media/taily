import type { ReactNode } from 'react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/shadcn/components/ui/dropdown-menu'
import { Button } from '@/shadcn/components/ui/button'
import { MoreVertical } from 'lucide-react'

interface AdoptionTabsProps {
  links: ReactNode
}

export function AdoptionTabs({ links }: AdoptionTabsProps) {
  return (
    <nav className="flex gap-1">
      {links}

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon">
            <MoreVertical className="size-4" />
            <span className="sr-only">Optionen öffnen</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem disabled className="text-destructive">
            Löschen
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </nav>
  )
}
