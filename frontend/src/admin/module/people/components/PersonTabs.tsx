import type { ReactNode } from 'react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/shadcn/components/ui/dropdown-menu.tsx'
import { Button } from '@/shadcn/components/ui/button.tsx'
import { MoreVertical } from 'lucide-react'

interface PersonTabsProps {
  links: ReactNode
  onDelete?: () => void
}

export function PersonTabs({ links, onDelete }: PersonTabsProps) {
  const handleDelete = () => {
    onDelete?.()
  }

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
          <DropdownMenuItem onClick={handleDelete} className="text-destructive">
            Löschen
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </nav>
  )
}
