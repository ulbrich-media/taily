import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { DndContext, DragOverlay } from '@dnd-kit/core'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Save } from 'lucide-react'
import { Button } from '@/shadcn/components/ui/button'
import { TextInput } from '@/components/field/TextInput'
import { createFormTemplate } from '../api/requests'
import { formTemplateQueryKeys } from '../api/queries'
import { FieldCardDragPreview, PaletteDragPreview } from './FieldCard'
import { EditFieldDialog } from './EditFieldDialog'
import { FieldBuilderSection } from './FieldBuilderSection'
import { useFieldBuilder } from './useFieldBuilder'
import { type ReactNode, useMemo } from 'react'
import { buildJsonSchema } from './schema'
import { PageHeader } from '@/components/layout/PageHeader.tsx'
import { FormGrid } from '@/components/form/FormGrid.tsx'
import { Card, CardContent } from '@/shadcn/components/ui/card.tsx'

const createTemplateSchema = z.object({
  name: z.string().min(1, 'Name ist erforderlich').max(255),
})

type CreateTemplateFormData = z.infer<typeof createTemplateSchema>

interface FormBuilderCreateProps {
  onCreated: () => void
  onCancel: () => void
  breadcrumb: ReactNode
}

export function FormBuilderCreate({
  onCreated,
  onCancel,
  breadcrumb,
}: FormBuilderCreateProps) {
  const queryClient = useQueryClient()

  const form = useForm<CreateTemplateFormData>({
    resolver: zodResolver(createTemplateSchema),
    defaultValues: { name: '' },
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
        <PageHeader title={'Neue Formularvorlage'} breadcrumb={breadcrumb} />

        <Card>
          <CardContent>
            <FormGrid>
              <TextInput
                name="name"
                control={form.control}
                label="Name"
                required
              />
            </FormGrid>
          </CardContent>
        </Card>

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
