import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, Pencil, Trash2, Undo2 } from 'lucide-react'
import { Badge } from '@/shadcn/components/ui/badge'
import { Button } from '@/shadcn/components/ui/button'
import type { FieldType } from '../api/types'
import { cn } from '@/shadcn/lib/utils'
import type { EditorField } from './shared/EditorField'
import { getFieldTypeDef } from './field-types'

export type { EditorField }

interface FieldCardProps {
  field: EditorField
  onEdit: (field: EditorField) => void
  onDelete: (id: string) => void
  onRestore: (id: string) => void
}

export function SortableFieldCard({
  field,
  onEdit,
  onDelete,
  onRestore,
}: FieldCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: field.id,
    disabled: !!field._deleted,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const def = getFieldTypeDef(field.type)
  const Icon = def.icon
  const chips = field._deleted ? [] : def.settingsChips(field.settings)

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'group flex items-center gap-3 rounded-md border bg-card p-3 transition-colors',
        isDragging && 'opacity-30',
        field._deleted
          ? 'border-destructive/30 bg-destructive/5'
          : 'hover:border-border'
      )}
    >
      {field._deleted ? (
        <div className="shrink-0 flex items-center justify-center w-4">
          <div className="size-2 rounded-full bg-destructive/60" />
        </div>
      ) : (
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground transition-colors shrink-0 touch-none"
          tabIndex={-1}
          aria-label="Feld verschieben"
        >
          <GripVertical className="size-4" />
        </button>
      )}

      <Icon
        className={cn(
          'size-4 shrink-0',
          field._deleted ? 'text-muted-foreground' : 'text-primary'
        )}
      />

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              'text-sm font-medium',
              field._deleted && 'line-through text-muted-foreground'
            )}
          >
            {field.label}
          </span>
          {!field._deleted && (
            <code className="text-[10px] font-mono text-muted-foreground bg-muted rounded px-1 py-0.5">
              {field.id}
            </code>
          )}
        </div>
        {field.description && !field._deleted && (
          <p className="text-xs text-muted-foreground truncate mt-0.5">
            {field.description}
          </p>
        )}
        <div className="flex flex-wrap items-center gap-1.5 mt-1">
          <Badge variant="secondary" className="text-xs h-4 px-1.5">
            {def.label}
          </Badge>
          {field.required && !field._deleted && (
            <Badge variant="outline" className="text-xs h-4 px-1.5">
              Pflichtfeld
            </Badge>
          )}
          {field._deleted && (
            <Badge
              variant="outline"
              className="text-xs h-4 px-1.5 border-destructive/40 text-destructive"
            >
              Wird gelöscht
            </Badge>
          )}
          {chips.map((chip) => (
            <Badge
              key={chip}
              variant="outline"
              className="text-xs h-4 px-1.5 text-muted-foreground bg-muted/50"
            >
              {chip}
            </Badge>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-0.5 shrink-0">
        {field._deleted ? (
          <Button
            size="sm"
            variant="ghost"
            className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
            onClick={() => onRestore(field.id)}
            title="Löschen rückgängig machen"
          >
            <Undo2 className="size-3.5" />
          </Button>
        ) : (
          <>
            <Button
              size="sm"
              variant="ghost"
              className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
              onClick={() => onEdit(field)}
              title="Feld bearbeiten"
            >
              <Pencil className="size-3.5" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
              onClick={() => onDelete(field.id)}
              title="Feld löschen"
            >
              <Trash2 className="size-3.5" />
            </Button>
          </>
        )}
      </div>
    </div>
  )
}

/** Static preview card rendered inside DragOverlay */
export function FieldCardDragPreview({ field }: { field: EditorField }) {
  const def = getFieldTypeDef(field.type)
  const Icon = def.icon
  return (
    <div className="flex items-center gap-3 rounded-md border bg-card p-3 shadow-2xl ring-2 ring-primary/30 cursor-grabbing">
      <GripVertical className="size-4 text-muted-foreground shrink-0" />
      <Icon className="size-4 text-primary shrink-0" />
      <span className="text-sm font-medium">{field.label}</span>
      <Badge variant="secondary" className="text-xs h-4 px-1.5 ml-auto">
        {def.label}
      </Badge>
    </div>
  )
}

/** Preview card for palette items being dragged */
export function PaletteDragPreview({ type }: { type: FieldType }) {
  const def = getFieldTypeDef(type)
  const Icon = def.icon
  return (
    <div className="flex items-center gap-2.5 rounded-md border bg-card p-2.5 shadow-2xl ring-2 ring-primary/30 cursor-grabbing min-w-[160px]">
      <GripVertical className="size-4 text-muted-foreground shrink-0" />
      <Icon className="size-4 text-primary shrink-0" />
      <span className="text-sm font-medium">{def.label}</span>
    </div>
  )
}
