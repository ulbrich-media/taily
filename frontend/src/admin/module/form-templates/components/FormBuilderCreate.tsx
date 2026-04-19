import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { DndContext, DragOverlay } from '@dnd-kit/core'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { ClipboardList, Save } from 'lucide-react'
import { Button } from '@/shadcn/components/ui/button'
import { TextInput } from '@/components/field/TextInput'
import { createFormTemplate } from '../api/requests'
import { formTemplateQueryKeys } from '../api/queries'
import { FieldCardDragPreview, PaletteDragPreview } from './FieldCard'
import { EditFieldDialog } from './EditFieldDialog'
import { FieldBuilderSection } from './FieldBuilderSection'
import { useFieldBuilder } from './useFieldBuilder'
import { useMemo } from 'react'
import { buildJsonSchema } from './schema'

const createTemplateSchema = z.object({
  type: z
    .string()
    .min(1, 'Typ ist erforderlich')
    .max(100)
    .regex(
      /^[a-z0-9_-]+$/,
      'Nur Kleinbuchstaben, Ziffern, Unterstrich und Bindestrich erlaubt'
    ),
  name: z.string().min(1, 'Name ist erforderlich').max(255),
})

type CreateTemplateFormData = z.infer<typeof createTemplateSchema>

interface FormBuilderCreateProps {
  onCreated: () => void
  onCancel: () => void
}

export function FormBuilderCreate({
  onCreated,
  onCancel,
}: FormBuilderCreateProps) {
  const queryClient = useQueryClient()

  const form = useForm<CreateTemplateFormData>({
    resolver: zodResolver(createTemplateSchema),
    defaultValues: { type: '', name: '' },
    mode: 'onChange',
  })

  const fb = useFieldBuilder([])
  const existingNames = useMemo(
    () => new Set(fb.fields.filter((f) => !f._deleted).map((f) => f.id)),
    [fb.fields]
  )

  const createMutation = useMutation({
    mutationFn: (data: CreateTemplateFormData) => {
      const { schema, uiSchema } = buildJsonSchema(fb.fields, data.name)
      return createFormTemplate({
        type: data.type,
        name: data.name,
        schema,
        ui_schema: uiSchema,
      })
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: formTemplateQueryKeys.all })
      toast.success(data.message)
      onCreated()
    },
    onError: () => {
      toast.error('Fehler beim Erstellen der Formularvorlage')
    },
  })

  const handleSave = form.handleSubmit((data) => createMutation.mutate(data))

  return (
    <DndContext
      sensors={fb.sensors}
      onDragStart={fb.handleDragStart}
      onDragOver={fb.handleDragOver}
      onDragEnd={fb.handleDragEnd}
      onDragCancel={fb.handleDragCancel}
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <ClipboardList className="size-5 text-primary shrink-0" />
          <h1 className="text-lg font-semibold">Neue Formularvorlage</h1>
        </div>

        {/* Meta card */}
        <div className="rounded-lg border bg-card p-4 grid sm:grid-cols-2 gap-4">
          <TextInput
            name="type"
            control={form.control}
            label="Typ"
            required
            description="Eindeutiger Bezeichner, z. B. inspection oder adoption_application"
          />
          <TextInput name="name" control={form.control} label="Name" required />
        </div>

        {/* Field builder */}
        <FieldBuilderSection
          fields={fb.fields}
          sortableIds={fb.sortableIds}
          deletedCount={fb.deletedCount}
          onEdit={fb.setEditingField}
          onDelete={fb.handleDelete}
          onRestore={fb.handleRestore}
          onRestoreAll={fb.restoreAll}
        />

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 border-t pt-4">
          <Button
            variant="outline"
            onClick={() => onCancel()}
            disabled={createMutation.isPending}
          >
            Abbrechen
          </Button>
          <Button
            onClick={handleSave}
            disabled={createMutation.isPending || !form.formState.isValid}
            className="gap-1.5"
          >
            <Save className="size-4" />
            {createMutation.isPending ? 'Erstellt…' : 'Vorlage erstellen'}
          </Button>
        </div>
      </div>

      <DragOverlay dropAnimation={null}>
        {fb.activeDragField && (
          <FieldCardDragPreview field={fb.activeDragField} />
        )}
        {fb.activeDragType && <PaletteDragPreview type={fb.activeDragType} />}
      </DragOverlay>

      <EditFieldDialog
        field={fb.editingField}
        existingNames={existingNames}
        open={!!fb.editingField}
        onClose={() => fb.setEditingField(null)}
        onSave={fb.handleSaveField}
      />
    </DndContext>
  )
}
