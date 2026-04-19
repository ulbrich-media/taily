import { useState, useMemo, useCallback, useRef } from 'react'
import {
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
  type UniqueIdentifier,
} from '@dnd-kit/core'
import { arrayMove } from '@dnd-kit/sortable'
import type { FieldType } from '../api/types'
import type { EditorField } from './shared/EditorField'
import { getFieldTypeDef } from './field-types'
import { DROPPABLE_ID } from './schema'

const PLACEHOLDER_ID = '__placeholder__'

/** Generate a unique snake_case field name like "text_1", "select_2", etc. */
function generateFieldName(
  type: FieldType,
  existingFields: EditorField[]
): string {
  const existingIds = new Set(existingFields.map((f) => f.id))
  let counter = 1
  let name = `${type}_${counter}`
  while (existingIds.has(name)) {
    counter++
    name = `${type}_${counter}`
  }
  return name
}

export interface UseFieldBuilderReturn {
  fields: EditorField[]
  setFields: React.Dispatch<React.SetStateAction<EditorField[]>>
  activeFields: EditorField[]
  deletedCount: number
  isDirty: boolean
  sortableIds: string[]
  sensors: ReturnType<typeof useSensors>
  activeDragId: UniqueIdentifier | null
  activeDragField: EditorField | null
  activeDragType: FieldType | null
  editingField: EditorField | null
  setEditingField: (field: EditorField | null) => void
  handleDragStart: (event: DragStartEvent) => void
  handleDragOver: (event: DragOverEvent) => void
  handleDragEnd: (event: DragEndEvent) => void
  handleDragCancel: () => void
  handleDelete: (id: string) => void
  handleRestore: (id: string) => void
  handleSaveField: (updated: EditorField) => void
  restoreAll: () => void
  /** Reset fields to new data and clear dirty state (e.g. after successful save). */
  reset: (newFields: EditorField[]) => void
}

export function useFieldBuilder(
  initialFields: EditorField[]
): UseFieldBuilderReturn {
  const [fields, setFieldsRaw] = useState<EditorField[]>(initialFields)
  const [isDirty, setIsDirty] = useState(false)
  const [activeDragId, setActiveDragId] = useState<UniqueIdentifier | null>(
    null
  )
  const [editingField, setEditingField] = useState<EditorField | null>(null)

  // Track placeholder state to avoid redundant updates that cause infinite loops.
  // We track the index (not the overId) because inserting the placeholder shifts
  // field positions, making overId-based dedup unreliable.
  const hasPlaceholder = useRef(false)
  const placeholderIndex = useRef(-1)
  const dragOverRaf = useRef(0)

  /** Wrapper that marks fields as dirty whenever they change. */
  const setFields: React.Dispatch<React.SetStateAction<EditorField[]>> = (
    action
  ) => {
    setFieldsRaw(action)
    setIsDirty(true)
  }

  const activeFields = useMemo(
    () => fields.filter((f) => !f._deleted),
    [fields]
  )
  const deletedCount = useMemo(
    () => fields.filter((f) => f._deleted).length,
    [fields]
  )
  const sortableIds = useMemo(
    () => activeFields.map((f) => f.id),
    [activeFields]
  )

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 200, tolerance: 5 },
    })
  )

  const activeDragField = useMemo(() => {
    if (!activeDragId) return null
    const id = String(activeDragId)
    if (id.startsWith('palette:')) return null
    return fields.find((f) => f.id === id) ?? null
  }, [activeDragId, fields])

  const activeDragType = useMemo(() => {
    if (!activeDragId) return null
    const id = String(activeDragId)
    if (!id.startsWith('palette:')) return null
    return id.replace('palette:', '') as FieldType
  }, [activeDragId])

  /** Create a placeholder field for the given palette type. */
  function makePlaceholder(type: FieldType): EditorField {
    const def = getFieldTypeDef(type)
    return {
      id: PLACEHOLDER_ID,
      type,
      label: def.label,
      required: false,
      settings: def.defaultSettings(),
      _isNew: true,
    }
  }

  /** Remove any placeholder from the fields array. */
  const removePlaceholder = useCallback(() => {
    cancelAnimationFrame(dragOverRaf.current)
    if (!hasPlaceholder.current) return
    setFieldsRaw((prev) => prev.filter((f) => f.id !== PLACEHOLDER_ID))
    hasPlaceholder.current = false
    placeholderIndex.current = -1
  }, [])

  function handleDragStart(event: DragStartEvent) {
    setActiveDragId(event.active.id)
  }

  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event
    const activeId = String(active.id)

    // Only handle palette drags — existing field reorder is handled by sortable
    if (!activeId.startsWith('palette:')) return

    if (!over) {
      removePlaceholder()
      return
    }

    const overId = String(over.id)

    // Ignore hovering over palette items or the placeholder itself
    if (overId.startsWith('palette:') || overId === PLACEHOLDER_ID) return

    // Debounce via rAF — dnd-kit fires onDragOver many times per frame
    // and inserting the placeholder shifts items which triggers more events.
    cancelAnimationFrame(dragOverRaf.current)
    dragOverRaf.current = requestAnimationFrame(() => {
      const type = activeId.replace('palette:', '') as FieldType

      setFieldsRaw((prev) => {
        const without = prev.filter((f) => f.id !== PLACEHOLDER_ID)

        let targetIdx: number
        if (overId === DROPPABLE_ID) {
          targetIdx = without.length // append
        } else {
          const idx = without.findIndex((f) => f.id === overId)
          targetIdx = idx === -1 ? without.length : idx
        }

        // Skip if placeholder is already at this index
        if (hasPlaceholder.current && placeholderIndex.current === targetIdx) {
          return prev
        }

        placeholderIndex.current = targetIdx
        hasPlaceholder.current = true
        return [
          ...without.slice(0, targetIdx),
          makePlaceholder(type),
          ...without.slice(targetIdx),
        ]
      })
    })
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    cancelAnimationFrame(dragOverRaf.current)
    setActiveDragId(null)
    placeholderIndex.current = -1

    const activeId = String(active.id)

    if (activeId.startsWith('palette:')) {
      if (hasPlaceholder.current) {
        // Replace placeholder with a real field
        const type = activeId.replace('palette:', '') as FieldType
        const def = getFieldTypeDef(type)

        if (over) {
          setFields((prev) => {
            const newField: EditorField = {
              id: generateFieldName(type, prev),
              type,
              label: def.label,
              required: false,
              settings: def.defaultSettings(),
              _isNew: true,
            }
            return prev.map((f) => (f.id === PLACEHOLDER_ID ? newField : f))
          })
        } else {
          // Dropped outside — just remove the placeholder
          setFieldsRaw((prev) => prev.filter((f) => f.id !== PLACEHOLDER_ID))
        }
        hasPlaceholder.current = false
      } else if (over) {
        // No placeholder (shouldn't happen normally) — fallback to append
        const type = activeId.replace('palette:', '') as FieldType
        const def = getFieldTypeDef(type)
        setFields((prev) => {
          const newField: EditorField = {
            id: generateFieldName(type, prev),
            type,
            label: def.label,
            required: false,
            settings: def.defaultSettings(),
            _isNew: true,
          }
          return [...prev, newField]
        })
      }
    } else {
      // Reorder existing fields
      removePlaceholder()
      if (over && active.id !== over.id) {
        setFields((prev) => {
          const activeIdx = prev.findIndex((f) => f.id === active.id)
          const overIdx = prev.findIndex((f) => f.id === over.id)
          if (activeIdx === -1 || overIdx === -1) return prev
          return arrayMove(prev, activeIdx, overIdx)
        })
      }
    }
  }

  function handleDragCancel() {
    setActiveDragId(null)
    removePlaceholder()
  }

  function handleDelete(id: string) {
    setFields((prev) => {
      const field = prev.find((f) => f.id === id)
      if (!field) return prev
      return field._isNew
        ? prev.filter((f) => f.id !== id)
        : prev.map((f) => (f.id === id ? { ...f, _deleted: true } : f))
    })
  }

  function handleRestore(id: string) {
    setFields((prev) =>
      prev.map((f) => (f.id === id ? { ...f, _deleted: false } : f))
    )
  }

  function handleSaveField(updated: EditorField) {
    const oldId = editingField?.id
    setFields((prev) => prev.map((f) => (f.id === oldId ? updated : f)))
    setEditingField(null)
  }

  function restoreAll() {
    setFields((prev) => prev.map((f) => ({ ...f, _deleted: false })))
  }

  function reset(newFields: EditorField[]) {
    setFieldsRaw(newFields)
    setIsDirty(false)
  }

  return {
    fields,
    setFields,
    activeFields,
    deletedCount,
    isDirty,
    sortableIds,
    sensors,
    activeDragId,
    activeDragField,
    activeDragType,
    editingField,
    setEditingField,
    handleDragStart,
    handleDragOver,
    handleDragEnd,
    handleDragCancel,
    handleDelete,
    handleRestore,
    handleSaveField,
    restoreAll,
    reset,
  }
}
