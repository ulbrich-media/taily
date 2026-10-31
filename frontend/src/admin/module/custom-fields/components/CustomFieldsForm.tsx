import { FormProvider, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { FieldGroup } from '@/shadcn/components/ui/field'
import { Button } from '@/shadcn/components/ui/button'
import { FormBlocker } from '@/components/form/FormBlocker'
import { useDynamicFormSchema } from '@/components/form/useDynamicFormSchema'
import type { CustomFieldDefinitionGroup } from '@/api/types/custom-fields'
import { CustomFieldSections } from './CustomFieldSections'
import {
  buildCustomFieldDefaults,
  CUSTOM_FIELDS_KEY,
} from '../custom-fields.schema'
import { applyCustomFieldErrors } from '../custom-fields.errors'
import {
  useMergedCustomFieldSchema,
  useSyncCustomFieldDefaults,
} from '../useCustomFieldsForm'

const staticSchema = z.object({})

export interface CustomFieldsFormData {
  custom_fields: Record<string, unknown>
}

interface CustomFieldsFormProps {
  /** The groups of the section this form edits. */
  groups: CustomFieldDefinitionGroup[]
  values: Record<string, unknown>
  onSubmit: (data: CustomFieldsFormData) => Promise<void>
  isSubmitting?: boolean
}

/** A form that only edits custom fields, for tabs made of Field Groups only. */
export function CustomFieldsForm({
  groups,
  values,
  onSubmit,
  isSubmitting = false,
}: CustomFieldsFormProps) {
  const customFieldSchema = useMergedCustomFieldSchema(groups)
  const schema = useDynamicFormSchema(
    staticSchema,
    customFieldSchema,
    CUSTOM_FIELDS_KEY
  )

  const form = useForm<CustomFieldsFormData>({
    resolver: zodResolver(schema) as never,
    defaultValues: {
      custom_fields: buildCustomFieldDefaults(groups, values),
    },
  })

  useSyncCustomFieldDefaults(form, groups, values)

  const handleFormSubmit = async (data: CustomFieldsFormData) => {
    try {
      await onSubmit(data)
    } catch (error) {
      applyCustomFieldErrors(error, form.setError)
      return
    }
    form.reset(data)
  }

  return (
    <FormProvider {...form}>
      <form
        onSubmit={form.handleSubmit(handleFormSubmit)}
        className="space-y-6"
      >
        <FormBlocker />

        <FieldGroup>
          <CustomFieldSections
            groups={groups}
            control={form.control}
            separatorBefore={false}
          />
        </FieldGroup>

        <div className="flex justify-end gap-3">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Speichert...' : 'Speichern'}
          </Button>
        </div>
      </form>
    </FormProvider>
  )
}
