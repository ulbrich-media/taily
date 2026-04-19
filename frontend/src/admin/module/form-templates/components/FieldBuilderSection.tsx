import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { useDroppable } from '@dnd-kit/core'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Trash2 } from 'lucide-react'
import { Badge } from '@/shadcn/components/ui/badge'
import { Button } from '@/shadcn/components/ui/button'
import { FieldPalette } from './FieldPalette'
import { SortableFieldCard } from './FieldCard'
import type { EditorField } from './shared/EditorField'
import { getFieldTypeDef } from './field-types'
import { DROPPABLE_ID } from './schema'

const PLACEHOLDER_ID = '__placeholder__'

function PlaceholderCard({ field }: { field: EditorField }) {
  const { setNodeRef, transform, transition } = useSortable({
    id: PLACEHOLDER_ID,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const def = getFieldTypeDef(field.type)
  const Icon = def.icon

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 rounded-md border-2 border-dashed border-primary/40 bg-primary/5 p-3"
    >
      <Icon className="size-4 text-primary/60 shrink-0" />
      <span className="text-sm font-medium text-primary/60">{def.label}</span>
      <Badge
        variant="secondary"
        className="text-xs h-4 px-1.5 ml-auto opacity-60"
      >
        Neues Feld
      </Badge>
    </div>
  )
}

function DroppableList({
  children,
  isEmpty,
}: {
  children: React.ReactNode
  isEmpty: boolean
}) {
  const { setNodeRef } = useDroppable({ id: DROPPABLE_ID })

  return (
    <div
      ref={setNodeRef}
      className={[
        'flex flex-col gap-2 min-h-48 rounded-md',
        isEmpty
          ? 'justify-center items-center border-2 border-dashed p-8'
          : 'pb-24',
      ].join(' ')}
    >
      {isEmpty ? (
        <p className="text-sm text-muted-foreground text-center">
          Felder hierher ziehen um das Formular aufzubauen
        </p>
      ) : (
        children
      )}
    </div>
  )
}

interface FieldBuilderSectionProps {
  fields: EditorField[]
  sortableIds: string[]
  deletedCount: number
  onEdit: (field: EditorField) => void
  onDelete: (id: string) => void
  onRestore: (id: string) => void
  onRestoreAll: () => void
}

export function FieldBuilderSection({
  fields,
  sortableIds,
  deletedCount,
  onEdit,
  onDelete,
  onRestore,
  onRestoreAll,
}: FieldBuilderSectionProps) {
  const activeCount = fields.filter(
    (f) => !f._deleted && f.id !== PLACEHOLDER_ID
  ).length

  return (
    <div className="flex flex-col gap-6">
      {/* Two-column builder */}
      <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] gap-6 items-start">
        <FieldPalette />

        <div className="flex flex-col gap-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Formularfelder
            {activeCount > 0 && (
              <span className="ml-1.5 font-normal normal-case">
                ({activeCount})
              </span>
            )}
          </p>

          <SortableContext
            items={sortableIds}
            strategy={verticalListSortingStrategy}
          >
            <DroppableList isEmpty={fields.length === 0}>
              {fields.map((field) =>
                field.id === PLACEHOLDER_ID ? (
                  <PlaceholderCard key={field.id} field={field} />
                ) : (
                  <SortableFieldCard
                    key={field.id}
                    field={field}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    onRestore={onRestore}
                  />
                )
              )}
            </DroppableList>
          </SortableContext>
        </div>
      </div>

      {/* Deletion counter (shown inline below the builder) */}
      {deletedCount > 0 && (
        <div className="flex items-center gap-2 text-sm text-destructive">
          <Trash2 className="size-4" />
          <span>
            {deletedCount} {deletedCount === 1 ? 'Feld' : 'Felder'} zum Löschen
            vorgemerkt
          </span>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 text-xs text-muted-foreground hover:text-foreground"
            onClick={onRestoreAll}
          >
            Alle wiederherstellen
          </Button>
        </div>
      )}
    </div>
  )
}
