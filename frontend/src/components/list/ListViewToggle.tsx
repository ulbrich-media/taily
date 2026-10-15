import { LayoutGrid, Table2 } from 'lucide-react'
import {
  ToggleGroup,
  ToggleGroupItem,
} from '@/shadcn/components/ui/toggle-group'
import { LIST_VIEWS, type ListView } from './list-search'

const VIEWS = {
  table: { label: 'Tabelle', icon: Table2 },
  cards: { label: 'Karten', icon: LayoutGrid },
} satisfies Record<ListView, unknown>

interface ListViewToggleProps {
  value: ListView
  onChange: (view: ListView) => void
}

/** Switch between the table and the cards renderer; only offered from `lg` up, where the table exists. */
export function ListViewToggle({ value, onChange }: ListViewToggleProps) {
  return (
    <ToggleGroup
      type="single"
      variant="outline"
      size="sm"
      aria-label="Ansicht"
      value={value}
      onValueChange={(view) => {
        // A single toggle group reports '' when the active item is clicked again.
        if (view) onChange(view as ListView)
      }}
      className="hidden lg:flex"
    >
      {LIST_VIEWS.map((view) => {
        const { icon: Icon, label } = VIEWS[view]
        return (
          <ToggleGroupItem key={view} value={view}>
            <Icon className="size-4" />
            <span className="sr-only">{label}</span>
          </ToggleGroupItem>
        )
      })}
    </ToggleGroup>
  )
}
