import { useDraggable } from '@dnd-kit/core'
import { GripVertical } from 'lucide-react'
import { cn } from '@/shadcn/lib/utils'
import { allFieldTypes, type FieldTypeDefinition } from './field-types'

function PaletteItem({
  type,
  label,
  description,
  icon: Icon,
}: FieldTypeDefinition) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `palette:${type}`,
    data: { type },
  })

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={cn(
        'flex items-center gap-2.5 rounded-md border bg-card p-2.5',
        'cursor-grab active:cursor-grabbing select-none touch-none',
        'hover:border-primary/50 hover:bg-accent transition-colors',
        isDragging && 'opacity-40'
      )}
    >
      <GripVertical className="size-4 text-muted-foreground shrink-0" />
      <Icon className="size-4 text-primary shrink-0" />
      <div className="min-w-0">
        <div className="text-sm font-medium leading-none">{label}</div>
        <div className="text-xs text-muted-foreground mt-0.5 hidden md:block">
          {description}
        </div>
      </div>
    </div>
  )
}

export function FieldPalette() {
  return (
    <aside>
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-0.5">
        Feldtypen
      </p>
      <div className="grid grid-cols-2 gap-1.5 md:grid-cols-1">
        {allFieldTypes.map((item) => (
          <PaletteItem key={item.type} {...item} />
        ))}
      </div>
      <p className="text-xs text-muted-foreground mt-2 px-0.5 leading-relaxed hidden md:block">
        Felder in die Liste ziehen um sie hinzuzufügen.
      </p>
    </aside>
  )
}
