import type { ReactNode } from 'react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/shadcn/components/ui/dropdown-menu'
import { Button } from '@/shadcn/components/ui/button'
import { MoreVertical } from 'lucide-react'

interface OrganizationTabsProps {
  links: ReactNode
  deleteLink: ReactNode
}

export function OrganizationTabs({ links, deleteLink }: OrganizationTabsProps) {
  return (
    <nav className="flex gap-1">
      {links}

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreVertical className="h-4 w-4" />
            <span className="sr-only">Optionen öffnen</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem className="text-destructive" asChild>
            {deleteLink}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </nav>
  )
}
