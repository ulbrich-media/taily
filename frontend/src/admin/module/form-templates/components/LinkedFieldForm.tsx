import { Controller, useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQuery } from '@tanstack/react-query'
import { Checkbox } from '@/shadcn/components/ui/checkbox'
import { Label } from '@/shadcn/components/ui/label'
import { Input } from '@/shadcn/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shadcn/components/ui/select'
import { TextInput } from '@/components/field/TextInput'
import { FormFieldWrapper } from '@/components/form/FormFieldWrapper'
import { linkableFieldsQuery } from '@/admin/module/custom-fields/api/queries'
import type { CustomFieldEntity } from '@/api/types/custom-fields'
import type { LinkedSettings } from '../api/types'
import type { EditorField } from './shared/EditorField'
import { FormFooter } from './shared/FormFooter'
import {
  LINK_ENTITY_LABELS,
  editorFieldFromSource,
  findLinkSource,
  linkableFieldLabel,
} from './linked-field'

const linkedFieldFormSchema = z.object({
  entity: z.enum(['person', 'animal']),
  field: z.string().min(1, 'Bitte ein Feld auswählen'),
  label: z.string().min(1, 'Bezeichnung ist erforderlich').max(255),
  description: z.string().max(500).optional(),
  placeholder: z.string().max(255).optional(),
  required: z.boolean(),
})

type LinkedFieldFormData = z.infer<typeof linkedFieldFormSchema>

const entityOptions = (
  Object.keys(LINK_ENTITY_LABELS) as CustomFieldEntity[]
).map((value) => ({ value, label: LINK_ENTITY_LABELS[value] }))

interface LinkedFieldFormProps {
  field: EditorField
  existingNames: Set<string>
  onClose: () => void
  onSave: (updated: EditorField) => void
}

/**
 * Edit form of a "Feld übernehmen" field. A new field picks its source
 * (entity, then field); afterwards the source and key are fixed and only
 * the wording can change.
 */
export function LinkedFieldForm({
  field,
  existingNames,
  onClose,
  onSave,
}: LinkedFieldFormProps) {
  const settings = field.settings as LinkedSettings
  const canPick = !!field._isNew && !settings.link

  const form = useForm<LinkedFieldFormData>({
    resolver: zodResolver(linkedFieldFormSchema),
    defaultValues: {
      entity: settings.link?.entity ?? 'person',
      field: settings.link?.field ?? '',
      label: settings.link ? field.label : '',
      description: field.description ?? '',
      placeholder: settings.placeholder ?? '',
      required: field.required,
    },
  })

  const entity = useWatch({ control: form.control, name: 'entity' })
  const selectedField = useWatch({ control: form.control, name: 'field' })
  const linkable = useQuery(linkableFieldsQuery(entity))
  const sources = linkable.data ?? []
  const source = selectedField
    ? findLinkSource({ entity, field: selectedField }, sources)
    : undefined
  const key = canPick ? (source?.key ?? '') : field.id

  function pickSource(value: string) {
    form.setValue('field', value, { shouldValidate: true })
    const picked = findLinkSource({ entity, field: value }, sources)
    if (!picked) return
    const copy = editorFieldFromSource(picked)
    form.setValue('label', copy.label, { shouldValidate: true })
    form.setValue('description', copy.description ?? '')
    form.setValue(
      'placeholder',
      (copy.settings as LinkedSettings).placeholder ?? ''
    )
  }

  const onSubmit = form.handleSubmit((data) => {
    let base: EditorField = field
    if (canPick) {
      if (!source) {
        form.setError('field', { message: 'Bitte ein Feld auswählen' })
        return
      }
      if (source.key !== field.id && existingNames.has(source.key)) {
        form.setError('field', {
          message: 'Dieses Feld ist bereits im Formular enthalten',
        })
        return
      }
      base = { ...editorFieldFromSource(source), _isNew: field._isNew }
    }
    onSave({
      ...base,
      label: data.label,
      description: data.description || undefined,
      required: data.required,
      settings: {
        ...(base.settings as LinkedSettings),
        placeholder: data.placeholder || undefined,
      },
    })
  })

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <FormFieldWrapper
        name="entity"
        control={form.control}
        label="Übernehmen von"
        required
        render={({ field: rhf }) => (
          <Select
            value={rhf.value}
            onValueChange={(value) => {
              rhf.onChange(value)
              form.setValue('field', '')
            }}
            disabled={!canPick}
          >
            <SelectTrigger id={rhf.name} className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {entityOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      />
      <FormFieldWrapper
        name="field"
        control={form.control}
        label="Feld"
        required
        description={
          canPick
            ? undefined
            : 'Die Quelle eines eingefügten Feldes kann nicht geändert werden.'
        }
        render={({ field: rhf, fieldState }) => (
          <Select
            value={rhf.value}
            onValueChange={pickSource}
            disabled={!canPick || linkable.isPending}
          >
            <SelectTrigger
              id={rhf.name}
              aria-invalid={fieldState.invalid}
              className="w-full"
            >
              <SelectValue
                placeholder={linkable.isPending ? 'Lädt…' : 'Feld auswählen…'}
              >
                {source ? linkableFieldLabel(source) : rhf.value}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {sources.map((s) => (
                <SelectItem key={s.field} value={s.field}>
                  {linkableFieldLabel(s)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      />
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="linked-field-key">Feldname</Label>
        <Input
          id="linked-field-key"
          value={key}
          readOnly
          placeholder="Wird aus dem Feld übernommen"
        />
      </div>
      <TextInput
        name="label"
        control={form.control}
        label="Bezeichnung"
        required
      />
      <TextInput
        name="description"
        control={form.control}
        label="Beschreibung"
      />
      <TextInput
        name="placeholder"
        control={form.control}
        label="Platzhalter"
      />
      <Controller
        name="required"
        control={form.control}
        render={({ field: rhf }) => (
          <div className="flex items-center gap-2">
            <Checkbox
              id="field-required"
              checked={rhf.value}
              onCheckedChange={rhf.onChange}
            />
            <Label
              htmlFor="field-required"
              className="cursor-pointer font-normal"
            >
              Pflichtfeld
            </Label>
          </div>
        )}
      />
      <p className="text-xs text-muted-foreground">
        Typ und Optionen werden aus dem Feld übernommen und können nicht
        geändert werden.
      </p>
      <FormFooter onClose={onClose} />
    </form>
  )
}
