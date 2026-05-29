import type { ReactNode } from 'react'

export const adoptionSectionTabLinkClass =
  'px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground rounded-md hover:bg-accent transition-colors [&.active]:bg-accent [&.active]:text-foreground'

interface AdoptionSectionTabsProps {
  children: ReactNode
}

export function AdoptionSectionTabs({ children }: AdoptionSectionTabsProps) {
  return (
    <nav className="flex gap-1 border-b pb-1 mb-2">{children}</nav>
  )
}
