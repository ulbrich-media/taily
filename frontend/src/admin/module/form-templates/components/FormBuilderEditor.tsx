import { useForm, FormProvider } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { DndContext, DragOverlay } from '@dnd-kit/core'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { ClipboardList, Save } from 'lucide-react'
import { Button } from '@/shadcn/components/ui/button'
import { Badge } from '@/shadcn/components/ui/badge'
import { TextInput } from '@/components/field/TextInput'
import { updateFormTemplate } from '../api/requests'
import { formTemplateQueryKeys } from '../api/queries'
import type { FormTemplateResource } from '@/api/types/form-templates'
import { FieldCardDragPreview, PaletteDragPreview } from './FieldCard'
import { EditFieldDialog } from './EditFieldDialog'
import { FieldBuilderSection } from './FieldBuilderSection'
import { useFieldBuilder } from './useFieldBuilder'
import { parseJsonSchema, buildJsonSchema } from './schema'
import { FormBlocker } from '@/components/form/FormBlocker.tsx'
import { useMemo } from 'react'

const templateNameSchema = z.object({
  name: z.string().min(1, 'Name ist erforderlich').max(255),
})

type TemplateNameFormData = z.infer<typeof templateNameSchema>

interface FormBuilderEditorProps {
  template: FormTemplateResource
  onCancel: () => void
  onNewVersion: (id: string) => void
}

export function FormBuilderEditor({
  template,
  onCancel,
  onNewVersion,
}: FormBuilderEditorProps) {
  const queryClient = useQueryClient()

  const nameForm = useForm<TemplateNameFormData>({
    resolver: zodResolver(templateNameSchema),
    defaultValues: { name: template.name },
    mode: 'onChange',
  })

  const fb = useFieldBuilder(
    parseJsonSchema(template.schema, template.ui_schema)
  )
  const existingNames = useMemo(
    () => new Set(fb.fields.filter((f) => !f._deleted).map((f) => f.id)),
    [fb.fields]
  )

  const saveMutation = useMutation({
    mutationFn: (data: TemplateNameFormData) => {
      const { schema, uiSchema } = buildJsonSchema(fb.fields, data.name)
      return updateFormTemplate(template.id, {
        name: data.name,
        schema,
        ui_schema: uiSchema,
      })
    },
    onSuccess: async (data) => {
      await queryClient.invalidateQueries({
        queryKey: formTemplateQueryKeys.all,
      })

      if (data.new_version_created) {
        // New version = new template ID — navigate to it so the URL and query update
        toast.success(`Neue Version v${data.data.version} wurde erstellt`)
        onNewVersion(data.data.id)
      } else {
        // Same template — reset forms to saved state so the blocker clears
        nameForm.reset({ name: data.data.name })
        fb.reset(parseJsonSchema(data.data.schema, data.data.ui_schema))
        toast.success(data.message)
      }
    },
    onError: () => {
      toast.error('Fehler beim Speichern der Formularvorlage')
    },
  })

  const handleSave = nameForm.handleSubmit(async (data) => {
    await saveMutation.mutateAsync(data)
  })

  return (
    <FormProvider {...nameForm}>
      <DndContext
        sensors={fb.sensors}
        onDragStart={fb.handleDragStart}
        onDragOver={fb.handleDragOver}
        onDragEnd={fb.handleDragEnd}
        onDragCancel={fb.handleDragCancel}
      >
        <FormBlocker isDirty={fb.isDirty} />

        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center gap-3">
            <ClipboardList className="size-5 text-primary shrink-0" />
            <h1 className="text-lg font-semibold">Formular bearbeiten</h1>
          </div>

          {/* Meta card */}
          <div className="rounded-lg border bg-card p-4 flex flex-col sm:flex-row sm:items-start gap-4">
            <div className="flex-1 max-w-sm">
              <TextInput
                name="name"
                control={nameForm.control}
                label="Name"
                required
              />
            </div>
            <div className="flex items-center gap-6 sm:pt-6 shrink-0">
              <div className="flex flex-col gap-1">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Typ
                </span>
                <code className="bg-muted rounded px-2 py-1 text-sm font-mono">
                  {template.type}
                </code>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Version
                </span>
                <Badge variant="secondary" className="w-fit">
                  v{template.version}
                </Badge>
              </div>
            </div>
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
              onClick={onCancel}
              disabled={saveMutation.isPending}
            >
              Abbrechen
            </Button>
            <Button
              onClick={handleSave}
              disabled={saveMutation.isPending || !nameForm.formState.isValid}
              className="gap-1.5"
            >
              <Save className="size-4" />
              {saveMutation.isPending ? 'Speichert…' : 'Speichern'}
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
    </FormProvider>
  )
}
