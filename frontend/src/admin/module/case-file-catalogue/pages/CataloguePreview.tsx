import { useState } from 'react'
import {
  FormProvider,
  useForm,
  useWatch,
  type Control,
  type FieldValues,
} from 'react-hook-form'
import { CheckCircle, CircleAlert } from 'lucide-react'
import { Button } from '@/shadcn/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/shadcn/components/ui/card'
import { Field, FieldGroup, FieldLabel } from '@/shadcn/components/ui/field'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shadcn/components/ui/select'
import { CaseFileFieldInput } from '@/admin/module/case-file/components/CaseFileFieldInput'
import {
  stepLabel,
  type CaseFileValues,
} from '@/admin/module/case-file/case-file.utils'
import {
  ADOPTION_STEPS,
  ADOPTION_STEP_LABELS,
  type AdoptionStep,
} from '@/api/types/case-file'
import type {
  CatalogueField,
  CatalogueGroup,
} from '@/api/types/case-file-catalogue'
import {
  PREVIEW_ROLE_LABELS,
  previewFields,
  requiredAt,
  validatePreview,
  type PreviewRole,
} from '../catalogue.utils'

interface FormData {
  values: CaseFileValues
}

interface CataloguePreviewProps {
  groups: CatalogueGroup[]
}

/**
 * A throwaway form built from the catalogue, to try out the field setup as a
 * given person at a given step. Nothing is saved or sent anywhere.
 */
export function CataloguePreview({ groups }: CataloguePreviewProps) {
  const [step, setStep] = useState<AdoptionStep>('application')
  const [role, setRole] = useState<PreviewRole>('applicant')
  const [summary, setSummary] = useState<number | null>(null)

  const form = useForm<FormData>({ defaultValues: { values: {} } })
  const watched = useWatch({ control: form.control, name: 'values' })
  const liveValues: CaseFileValues = watched ?? {}

  // A controlling field may be hidden for the role, so look it up among all
  // active fields.
  const fieldsByKey = new Map<string, CatalogueField>(
    groups
      .flatMap((group) => group.fields)
      .filter((field) => !field.archived_at)
      .map((field) => [field.key, field])
  )

  const visibleGroupsFor = (values: CaseFileValues) =>
    previewFields(groups, step, role, { values, fieldsByKey })
  const visibleGroups = visibleGroupsFor(liveValues)

  const reset = () => {
    form.clearErrors()
    setSummary(null)
  }

  const validate = () => {
    reset()
    const values = form.getValues('values') ?? {}
    const visible = visibleGroupsFor(values).flatMap((group) => group.fields)
    const errors = validatePreview(visible, values, fieldsByKey, step)
    for (const [key, message] of Object.entries(errors)) {
      form.setError(`values.${key}`, { message })
    }
    setSummary(Object.keys(errors).length)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end gap-4">
        <Field className="w-48">
          <FieldLabel htmlFor="preview-step">Schritt</FieldLabel>
          <Select
            value={step}
            onValueChange={(value) => {
              setStep(value as AdoptionStep)
              reset()
            }}
          >
            <SelectTrigger id="preview-step">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ADOPTION_STEPS.map((option) => (
                <SelectItem key={option} value={option}>
                  {ADOPTION_STEP_LABELS[option]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field className="w-48">
          <FieldLabel htmlFor="preview-role">Rolle</FieldLabel>
          <Select
            value={role}
            onValueChange={(value) => {
              setRole(value as PreviewRole)
              reset()
            }}
          >
            <SelectTrigger id="preview-role">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(PREVIEW_ROLE_LABELS) as PreviewRole[]).map(
                (option) => (
                  <SelectItem key={option} value={option}>
                    {PREVIEW_ROLE_LABELS[option]}
                  </SelectItem>
                )
              )}
            </SelectContent>
          </Select>
        </Field>
        <Button type="button" variant="outline" onClick={validate}>
          Prüfen
        </Button>
      </div>

      {summary !== null && (
        <p
          role="status"
          className="flex items-center gap-2 text-sm font-medium"
        >
          {summary === 0 ? (
            <>
              <CheckCircle className="size-4" /> Alles in Ordnung
            </>
          ) : (
            <>
              <CircleAlert className="size-4 text-destructive" />
              {summary === 1
                ? '1 Feld ist fehlerhaft'
                : `${summary} Felder sind fehlerhaft`}
            </>
          )}
        </p>
      )}

      <FormProvider {...form}>
        <form
          noValidate
          className="space-y-6"
          onSubmit={(event) => event.preventDefault()}
        >
          {visibleGroups.length === 0 && (
            <p className="text-sm text-muted-foreground">
              Für diese Auswahl gibt es keine Felder.
            </p>
          )}
          {visibleGroups.map((group) => (
            <Card key={group.id}>
              <CardHeader>
                <CardTitle>{group.title}</CardTitle>
                {group.intro && (
                  <CardDescription>{group.intro}</CardDescription>
                )}
              </CardHeader>
              <CardContent>
                <FieldGroup>
                  {group.fields.map((field) => (
                    <CaseFileFieldInput
                      key={field.key}
                      field={{
                        ...field,
                        effective_required_for: requiredAt(field, step),
                      }}
                      control={form.control as unknown as Control<FieldValues>}
                      requirementText={(f) =>
                        `Pflicht ab ${stepLabel(f.effective_required_for ?? step)}`
                      }
                    />
                  ))}
                </FieldGroup>
              </CardContent>
            </Card>
          ))}
        </form>
      </FormProvider>
    </div>
  )
}
