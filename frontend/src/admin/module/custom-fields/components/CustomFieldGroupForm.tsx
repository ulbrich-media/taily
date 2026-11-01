import { useEffect, type ReactNode } from 'react'
import {
  Controller,
  FormProvider,
  useForm,
  useWatch,
  type Control,
} from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import type {
  CustomFieldEntity,
  CustomFieldGroupResource,
  CustomFieldPersonRole,
  CustomFieldSection,
} from '@/api/types/custom-fields'
import type { AnimalTypeResource } from '@/api/types/animal-types'
import type { FormTemplateResource } from '@/api/types/form-templates'
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldDescription,
  FieldError,
} from '@/shadcn/components/ui/field'
import { Checkbox } from '@/shadcn/components/ui/checkbox'
import { Input } from '@/shadcn/components/ui/input'
import { Switch } from '@/shadcn/components/ui/switch'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shadcn/components/ui/table'
import { FormBlocker } from '@/components/form/FormBlocker'
import { FormFieldWrapper } from '@/components/form/FormFieldWrapper'
import { TextInput } from '@/components/field/TextInput'
import { SelectInput } from '@/components/field/SelectInput'
import { FormTemplateSelect } from '@/components/field/FormTemplateSelect'
import { zFieldString } from '@/components/field/TextInput.utils'
import { ApiValidationError } from '@/lib/api'
import type { CustomFieldGroupInput } from '../api/types'
import {
  CUSTOM_FIELD_ENTITY_LABELS,
  CUSTOM_FIELD_PERSON_ROLES,
  CUSTOM_FIELD_SECTIONS,
} from '../custom-field.labels'
import { templateFields } from '../custom-field-group.utils'

const groupFormSchema = z.object({
  entity: z.enum(['animal', 'person']),
  section: z.string().min(1, 'Bitte einen Bereich wählen'),
  animal_type_ids: z.array(z.string()),
  person_roles: z.array(z.string()),
  form_template_id: z
    .string({ error: 'Bitte eine Formularvorlage wählen' })
    .min(1, 'Bitte eine Formularvorlage wählen'),
  title: zFieldString({ required: true }),
  position: z
    .number({ error: 'Bitte eine Zahl eingeben' })
    .int('Bitte eine ganze Zahl eingeben')
    .min(0, 'Mindestwert: 0'),
  field_settings: z.record(
    z.string(),
    z.object({ public: z.boolean().optional() })
  ),
})

export type CustomFieldGroupFormData = z.infer<typeof groupFormSchema>

const FORM_FIELDS = Object.keys(groupFormSchema.shape)

interface CustomFieldGroupFormProps {
  group?: CustomFieldGroupResource
  animalTypes: AnimalTypeResource[]
  formTemplates: FormTemplateResource[]
  onSubmit: (data: CustomFieldGroupInput) => Promise<void>
  /** Rendered at the end of the form (dialog footer with the submit button). */
  footer: ReactNode
}

export function CustomFieldGroupForm({
  group,
  animalTypes,
  formTemplates,
  onSubmit,
  footer,
}: CustomFieldGroupFormProps) {
  const isEdit = !!group

  const form = useForm<CustomFieldGroupFormData>({
    resolver: zodResolver(groupFormSchema),
    defaultValues: {
      entity: group?.entity ?? 'animal',
      section: group?.section ?? 'basic',
      animal_type_ids: group?.animal_type_ids ?? [],
      person_roles: group?.person_roles ?? [],
      form_template_id: group?.form_template_id ?? '',
      title: group?.title ?? '',
      position: group?.position ?? 0,
      field_settings: group?.field_settings ?? {},
    },
  })

  const entity = useWatch({ control: form.control, name: 'entity' })
  const templateId = useWatch({
    control: form.control,
    name: 'form_template_id',
  })
  const template = formTemplates.find((t) => t.id === templateId)
  const fields = templateFields(template)
  const sections = CUSTOM_FIELD_SECTIONS[entity]

  // Sections and scope belong to an entity; switching entity on create resets them.
  useEffect(() => {
    if (isEdit) return
    const section = form.getValues('section')
    if (!CUSTOM_FIELD_SECTIONS[entity].some((s) => s.value === section)) {
      form.setValue('section', CUSTOM_FIELD_SECTIONS[entity][0].value)
    }
  }, [entity, isEdit, form])

  // The title defaults to the template name.
  useEffect(() => {
    if (template && !form.getValues('title')) {
      form.setValue('title', template.name, { shouldValidate: true })
    }
  }, [template, form])

  const handleSubmit = async (data: CustomFieldGroupFormData) => {
    const keys = new Set(fields.map((f) => f.key))
    const payload: CustomFieldGroupInput = {
      entity: data.entity as CustomFieldEntity,
      section: data.section as CustomFieldSection,
      animal_type_ids: data.entity === 'animal' ? data.animal_type_ids : [],
      person_roles:
        data.entity === 'person'
          ? (data.person_roles as CustomFieldPersonRole[])
          : [],
      form_template_id: data.form_template_id,
      title: data.title,
      position: data.position,
      // Only keys the template still has; `public` only applies to animals.
      field_settings: Object.fromEntries(
        Object.entries(data.field_settings)
          .filter(([key]) => keys.has(key))
          .map(([key, settings]) => [
            key,
            { public: data.entity === 'animal' && !!settings.public },
          ])
      ),
    }

    try {
      await onSubmit(payload)
    } catch (error) {
      if (error instanceof ApiValidationError && error.errors) {
        for (const [name, messages] of Object.entries(error.errors)) {
          const field = name.split('.')[0]
          if (FORM_FIELDS.includes(field) && messages?.[0]) {
            form.setError(field as keyof CustomFieldGroupFormData, {
              type: 'server',
              message: messages[0],
            })
          }
        }
      }
      return
    }
    form.reset(form.getValues())
  }

  return (
    <FormProvider {...form}>
      <form
        onSubmit={form.handleSubmit(handleSubmit)}
        className="space-y-4"
        noValidate
      >
        <FormBlocker />

        <FieldGroup>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <SelectInput
              name="entity"
              control={form.control}
              label="Datensatz"
              required
              disabled={isEdit}
              options={Object.entries(CUSTOM_FIELD_ENTITY_LABELS).map(
                ([value, label]) => ({ value, label })
              )}
            />
            <SelectInput
              name="section"
              control={form.control}
              label="Bereich"
              required
              options={sections.map((s) => ({
                value: s.value,
                label: s.label,
              }))}
            />
          </div>

          {entity === 'animal' ? (
            <ScopeCheckboxes
              name="animal_type_ids"
              control={form.control}
              label="Tierarten"
              options={animalTypes.map((type) => ({
                value: type.id,
                label: type.title,
              }))}
            />
          ) : (
            <ScopeCheckboxes
              name="person_roles"
              control={form.control}
              label="Rollen"
              options={CUSTOM_FIELD_PERSON_ROLES}
            />
          )}

          <FormTemplateSelect
            name="form_template_id"
            control={form.control}
            label="Formularvorlage"
            placeholder="Formularvorlage wählen"
            formTemplates={formTemplates}
            required
          />

          <div className="grid grid-cols-1 md:grid-cols-[1fr_8rem] gap-4">
            <TextInput
              name="title"
              control={form.control}
              label="Titel"
              required
            />
            <FormFieldWrapper
              name="position"
              control={form.control}
              label="Position"
              render={({ field, fieldState }) => (
                <Input
                  {...field}
                  id={field.name}
                  type="number"
                  min={0}
                  aria-invalid={fieldState.invalid}
                  onChange={(e) =>
                    field.onChange(
                      e.target.value === '' ? undefined : e.target.valueAsNumber
                    )
                  }
                />
              )}
            />
          </div>

          {entity === 'animal' && fields.length > 0 && (
            <Field>
              <FieldLabel>Felder</FieldLabel>
              <FieldDescription>
                Öffentliche Felder werden über die Public API ausgegeben, z. B.
                für die Website.
              </FieldDescription>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Bezeichnung</TableHead>
                    <TableHead>Feldname</TableHead>
                    <TableHead className="text-right">Öffentlich</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {fields.map((field) => (
                    <TableRow key={field.key}>
                      <TableCell>{field.label}</TableCell>
                      <TableCell className="font-mono text-xs">
                        {field.key}
                      </TableCell>
                      <TableCell className="text-right">
                        <Controller
                          name={`field_settings.${field.key}.public`}
                          control={form.control}
                          render={({ field: switchField }) => (
                            <Switch
                              aria-label={`${field.label} öffentlich`}
                              checked={!!switchField.value}
                              onCheckedChange={switchField.onChange}
                            />
                          )}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Field>
          )}
        </FieldGroup>

        {footer}
      </form>
    </FormProvider>
  )
}

function ScopeCheckboxes({
  name,
  control,
  label,
  options,
}: {
  name: 'animal_type_ids' | 'person_roles'
  control: Control<CustomFieldGroupFormData>
  label: string
  options: { value: string; label: string }[]
}) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => {
        const selected = new Set(field.value)
        const toggle = (value: string, checked: boolean) => {
          const next = new Set(selected)
          if (checked) next.add(value)
          else next.delete(value)
          field.onChange(options.map((o) => o.value).filter((v) => next.has(v)))
        }
        return (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel>{label}</FieldLabel>
            <FieldDescription>
              Keine Auswahl bedeutet: gilt für alle.
            </FieldDescription>
            <div className="flex flex-wrap gap-x-6 gap-y-2">
              {options.map((option) => {
                const id = `${name}-${option.value}`
                return (
                  <Field
                    key={option.value}
                    orientation="horizontal"
                    className="w-auto"
                  >
                    <Checkbox
                      id={id}
                      checked={selected.has(option.value)}
                      onCheckedChange={(checked) =>
                        toggle(option.value, checked === true)
                      }
                    />
                    <FieldLabel htmlFor={id} className="font-normal">
                      {option.label}
                    </FieldLabel>
                  </Field>
                )
              })}
            </div>
            <FieldError errors={[fieldState.error]} />
          </Field>
        )
      }}
    />
  )
}
