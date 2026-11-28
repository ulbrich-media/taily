import type { ReactNode } from 'react'
import {
  FormProvider,
  useForm,
  useWatch,
  type Control,
  type FieldValues,
} from 'react-hook-form'
import { FileUp, Lock } from 'lucide-react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/shadcn/components/ui/card'
import { FieldGroup } from '@/shadcn/components/ui/field'
import { ApiValidationError } from '@/lib/api'
import { CaseFileFieldInput } from '@/admin/module/case-file/components/CaseFileFieldInput'
import {
  fieldApplies,
  formatValue,
  isFileField,
  toApiValue,
  type CaseFileValues,
} from '@/admin/module/case-file/case-file.utils'
import { caseFileResolver } from '@/admin/module/case-file/case-file.schema'
import type { AdoptionStep } from '@/api/types/case-file'
import type { ApplicantField, ApplicantGroup } from '../api/types'
import { applicantRequirement } from '../applicant.utils'

interface FormData {
  values: CaseFileValues
}

interface ApplicantCaseFileFormProps {
  groups: ApplicantGroup[]
  // The step the applicant is asked for data up to.
  currentStep: AdoptionStep
  readOnly?: boolean
  onSubmit: (values: Record<string, unknown>) => Promise<unknown>
  // Rendered below the groups, e.g. the submit button.
  footer: (state: { isSubmitting: boolean }) => ReactNode
}

const isWritable = (field: ApplicantField) =>
  field.type !== 'info' && !isFileField(field) && !field.locked

/**
 * The applicant's data as the organization configured it: the catalogue's
 * groups, their intros and Info Blocks, and conditional fields that appear
 * while the applicant answers. Used by the application form and the portal.
 */
export function ApplicantCaseFileForm({
  groups,
  currentStep,
  readOnly = false,
  onSubmit,
  footer,
}: ApplicantCaseFileFormProps) {
  const allFields = groups.flatMap((group) => group.fields)
  const fieldsByKey = new Map(allFields.map((field) => [field.key, field]))

  const form = useForm<FormData>({
    // Format checks only; the server decides what is still missing.
    resolver: caseFileResolver(
      allFields.filter(isWritable),
      fieldsByKey,
      Object.fromEntries(allFields.map((f) => [f.key, f.value]))
    ),
    defaultValues: {
      values: Object.fromEntries(
        allFields
          .filter(isWritable)
          .map((field) => [field.key, field.value ?? ''])
      ),
    },
  })

  const watched = useWatch({ control: form.control, name: 'values' })
  const liveValues = {
    ...Object.fromEntries(allFields.map((f) => [f.key, f.value])),
    ...watched,
  }
  const applies = (field: ApplicantField) =>
    fieldApplies(field, liveValues, fieldsByKey)

  const submit = form.handleSubmit(async (data) => {
    const values = Object.fromEntries(
      allFields
        .filter((field) => isWritable(field) && applies(field))
        .map((field) => [field.key, toApiValue(field, data.values[field.key])])
    )
    try {
      await onSubmit(values)
      form.reset(data)
    } catch (error) {
      if (error instanceof ApiValidationError && error.errors) {
        for (const [key, messages] of Object.entries(error.errors)) {
          form.setError(key as `values.${string}`, { message: messages[0] })
        }
      }
    }
  })

  return (
    <FormProvider {...form}>
      <form onSubmit={submit} className="space-y-6" noValidate>
        {groups.map((group) => {
          const fields = group.fields.filter(applies)
          if (fields.length === 0) return null
          return (
            <Card key={group.id}>
              <CardHeader>
                <CardTitle>{group.title}</CardTitle>
                {group.intro && (
                  <CardDescription>{group.intro}</CardDescription>
                )}
              </CardHeader>
              <CardContent>
                <FieldGroup>
                  {fields.map((field) => (
                    <ApplicantFieldRow
                      key={field.key}
                      field={field}
                      readOnly={readOnly}
                      currentStep={currentStep}
                      control={form.control as unknown as Control<FieldValues>}
                    />
                  ))}
                </FieldGroup>
              </CardContent>
            </Card>
          )
        })}
        {footer({ isSubmitting: form.formState.isSubmitting })}
      </form>
    </FormProvider>
  )
}

function ApplicantFieldRow({
  field,
  readOnly,
  currentStep,
  control,
}: {
  field: ApplicantField
  readOnly: boolean
  currentStep: AdoptionStep
  control: Control<FieldValues>
}) {
  if (field.type === 'info') {
    return (
      <p className="text-sm text-muted-foreground border-l-2 pl-3">
        {field.label}
      </p>
    )
  }

  if (readOnly || field.locked) {
    return (
      <div className="space-y-1">
        <p className="flex items-center gap-1.5 text-sm font-medium">
          {field.label}
          {field.locked && (
            <Lock
              className="size-3 text-muted-foreground"
              aria-label="Nicht änderbar"
            />
          )}
        </p>
        <p className="text-sm text-muted-foreground">
          {formatValue(field, field.value) || '–'}
        </p>
      </div>
    )
  }

  if (isFileField(field)) {
    return (
      <div className="space-y-1">
        <p className="text-sm font-medium">{field.label}</p>
        <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <FileUp className="size-4" />
          Das Hochladen ist hier noch nicht möglich – bitte schick es direkt an
          die Vermittlung.
        </p>
      </div>
    )
  }

  return (
    <CaseFileFieldInput
      field={field}
      control={control}
      requirementText={(f) => applicantRequirement(f, currentStep)}
    />
  )
}
