import { useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/shadcn/components/ui/dialog'
import type { EditorField } from './shared/EditorField'
import { BaseFields } from './shared/BaseFields'
import { FormFooter } from './shared/FormFooter'
import { getFieldTypeDef } from './field-types'

function buildBaseSchema(existingNames: Set<string>, currentName: string) {
  return z.object({
    name: z
      .string()
      .min(1, 'Feldname ist erforderlich')
      .max(100)
      .regex(
        /^[a-z][a-z0-9_]*$/,
        'Nur Kleinbuchstaben, Ziffern und Unterstrich erlaubt (muss mit Buchstabe beginnen)'
      )
      .refine(
        (val) => val === currentName || !existingNames.has(val),
        'Dieser Feldname wird bereits verwendet'
      ),
    label: z.string().min(1, 'Bezeichnung ist erforderlich').max(255),
    description: z.string().max(500).optional(),
    required: z.boolean(),
  })
}

interface GenericFieldFormProps {
  field: EditorField
  existingNames: Set<string>
  onClose: () => void
  onSave: (updated: EditorField) => void
}

function GenericFieldForm({
  field,
  existingNames,
  onClose,
  onSave,
}: GenericFieldFormProps) {
  const def = getFieldTypeDef(field.type)
  const baseSchema = useMemo(
    () => buildBaseSchema(existingNames, field.id),
    [existingNames, field.id]
  )
  const fullSchema = baseSchema.merge(def.schema)

  const form = useForm({
    resolver: zodResolver(fullSchema),
    defaultValues: {
      name: field.id,
      label: field.label,
      description: field.description ?? '',
      required: field.required,
      ...def.getFormDefaults(field.settings),
    },
  })

  const onSubmit = form.handleSubmit((data) => {
    const { name, label, description, required, ...typeData } = data as {
      name: string
      label: string
      description?: string
      required: boolean
      [key: string]: unknown
    }
    onSave({
      ...field,
      id: name,
      label,
      description: description || undefined,
      required,
      settings: def.buildSettings(typeData),
    })
  })

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <BaseFields
        control={form.control}
        showRequired={def.showRequired !== false}
        isNew={!!field._isNew}
      />
      {def.SettingsSection && <def.SettingsSection control={form.control} />}
      <FormFooter onClose={onClose} />
    </form>
  )
}

interface EditFieldDialogProps {
  field: EditorField | null
  existingNames: Set<string>
  open: boolean
  onClose: () => void
  onSave: (updated: EditorField) => void
}

export function EditFieldDialog({
  field,
  existingNames,
  open,
  onClose,
  onSave,
}: EditFieldDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {field ? getFieldTypeDef(field.type).label : ''} bearbeiten
          </DialogTitle>
        </DialogHeader>

        {/* key forces full remount (and form reset) when the edited field changes */}
        {field && (
          <GenericFieldForm
            key={field.id}
            field={field}
            existingNames={existingNames}
            onClose={onClose}
            onSave={onSave}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}
