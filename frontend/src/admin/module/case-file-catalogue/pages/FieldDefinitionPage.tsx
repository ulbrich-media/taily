import { useEffect, type ReactNode } from 'react'
import {
  FormProvider,
  useFieldArray,
  useForm,
  useWatch,
  type Path,
} from 'react-hook-form'
import { Plus, Trash2 } from 'lucide-react'
import { ADOPTION_STEPS, ADOPTION_STEP_LABELS } from '@/api/types/case-file'
import type {
  CatalogueField,
  CatalogueResource,
} from '@/api/types/case-file-catalogue'
import { PageHeader } from '@/components/layout/PageHeader'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/shadcn/components/ui/card'
import { Button } from '@/shadcn/components/ui/button'
import { Checkbox } from '@/shadcn/components/ui/checkbox'
import { Input } from '@/shadcn/components/ui/input'
import { Field, FieldGroup, FieldLabel } from '@/shadcn/components/ui/field'
import { FormBlocker } from '@/components/form/FormBlocker'
import { TextInput } from '@/components/field/TextInput'
import { Textarea } from '@/components/field/Textarea'
import { SelectInput } from '@/components/field/SelectInput'
import { Switch } from '@/components/field/Switch'
import { ApiValidationError } from '@/lib/api'
import { createFieldDefinition, updateFieldDefinition } from '../api/requests'
import {
  CREATABLE_FIELD_TYPES,
  FIELD_TYPE_LABELS,
  conditionCandidates,
  hasChoices,
  hasRange,
  keyFromLabel,
  NO_CONDITION,
  OPTIONAL,
  toRequest,
  type FieldDefinitionFormData,
} from '../catalogue.utils'
import { useCatalogueMutation } from '../useCatalogueMutation'

interface FieldDefinitionPageProps {
  catalogue: CatalogueResource
  groupId: string
  // Absent when creating a new field.
  field?: CatalogueField
  onDone: () => void
  breadcrumb?: ReactNode
}

const STEP_OPTIONS = ADOPTION_STEPS.map((step) => ({
  value: step,
  label: ADOPTION_STEP_LABELS[step],
}))

/**
 * Creates or edits one field of an animal type's catalogue. Key and type are
 * fixed once the field exists; built-in fields only change presentation,
 * steps and visibility.
 */
export function FieldDefinitionPage({
  catalogue,
  groupId,
  field,
  onDone,
  breadcrumb,
}: FieldDefinitionPageProps) {
  const isNew = !field
  const builtIn = field?.built_in ?? false

  const form = useForm<FieldDefinitionFormData>({
    defaultValues: {
      type: field?.type ?? 'text',
      key: field?.key ?? '',
      label: field?.label ?? '',
      help: field?.help ?? '',
      field_group_id: groupId,
      collect_at: field?.collect_at ?? 'application',
      required_for: field?.required_for ?? OPTIONAL,
      requires_review: field?.requires_review ?? false,
      visible_to_applicant: field?.visible_to_applicant ?? true,
      visible_to_inspector: field?.visible_to_inspector ?? true,
      choices: field?.options?.choices ?? [{ value: '', label: '' }],
      min: field?.options?.min?.toString() ?? '',
      max: field?.options?.max?.toString() ?? '',
      condition_field: field?.condition?.field ?? NO_CONDITION,
      condition_equals: field?.condition?.equals === false ? 'false' : 'true',
      condition_in: (field?.condition?.in as string[] | undefined) ?? [],
    },
  })

  const choices = useFieldArray({ control: form.control, name: 'choices' })
  const type = useWatch({ control: form.control, name: 'type' })
  const conditionField = useWatch({
    control: form.control,
    name: 'condition_field',
  })
  const conditionIn = useWatch({ control: form.control, name: 'condition_in' })
  const label = useWatch({ control: form.control, name: 'label' })

  // Suggest a key from the label until the admin edits the key themselves.
  useEffect(() => {
    if (isNew && !form.getFieldState('key').isDirty) {
      form.setValue('key', keyFromLabel(label))
    }
  }, [isNew, label, form])

  const candidates = conditionCandidates(catalogue.groups, {
    groupId,
    fieldId: field?.id,
  })
  const controller = candidates.find((c) => c.key === conditionField)
  const isInfo = type === 'info'

  const mutation = useCatalogueMutation(
    catalogue.animal_type.id,
    (data: FieldDefinitionFormData) => {
      const request = toRequest(data, {
        isNew,
        builtIn,
        controllerType: candidates.find((c) => c.key === data.condition_field)
          ?.type,
      })
      return field
        ? updateFieldDefinition(field.id, request)
        : createFieldDefinition(groupId, request)
    },
    onDone
  )

  const onError = (error: unknown) => {
    if (!(error instanceof ApiValidationError) || !error.errors) return
    for (const [key, messages] of Object.entries(error.errors)) {
      const name = (
        key.startsWith('options.choices')
          ? 'choices'
          : key === 'options.min'
            ? 'min'
            : key === 'options.max'
              ? 'max'
              : key.startsWith('condition')
                ? 'condition_field'
                : key
      ) as Path<FieldDefinitionFormData>
      form.setError(name, { message: messages[0] })
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumb={breadcrumb}
        title={field ? `„${field.label}“ bearbeiten` : 'Neues Feld'}
        description={`Angaben für ${catalogue.animal_type.title}`}
      />

      <FormProvider {...form}>
        <form
          onSubmit={form.handleSubmit(async (data) => {
            // Awaited, so the form is still submitting when the success
            // handler navigates away and FormBlocker lets it pass.
            try {
              await mutation.mutateAsync(data)
              form.reset(data)
            } catch (error) {
              onError(error)
            }
          })}
          className="space-y-6"
        >
          <FormBlocker />

          <Card>
            <CardHeader>
              <CardTitle>Feld</CardTitle>
              {!isNew && (
                <CardDescription>
                  {builtIn
                    ? 'Standardfeld: gespeichert bei der Person. Typ und Schlüssel sind fest.'
                    : `Typ ${FIELD_TYPE_LABELS[field.type]}, Schlüssel ${field.key}. Beides ist fest – ändert sich die Bedeutung, lege ein neues Feld an und archiviere dieses.`}
                </CardDescription>
              )}
            </CardHeader>
            <CardContent>
              <FieldGroup>
                {isNew && (
                  <SelectInput
                    name="type"
                    control={form.control}
                    label="Typ"
                    options={CREATABLE_FIELD_TYPES.map((value) => ({
                      value,
                      label: FIELD_TYPE_LABELS[value],
                    }))}
                    required
                  />
                )}

                {isInfo ? (
                  <Textarea
                    name="label"
                    control={form.control}
                    label="Hinweistext"
                    rows={4}
                    required
                  />
                ) : (
                  <TextInput
                    name="label"
                    control={form.control}
                    label="Bezeichnung"
                    required
                  />
                )}

                {isNew && (
                  <TextInput
                    name="key"
                    control={form.control}
                    label="Schlüssel"
                    description="Technischer Name, z. B. für Verträge. Nur Kleinbuchstaben, Ziffern und Unterstriche; später nicht mehr änderbar."
                    required
                  />
                )}

                {!isInfo && (
                  <Textarea
                    name="help"
                    control={form.control}
                    label="Hilfetext"
                    description="Optional. Erscheint unter dem Feld."
                    rows={2}
                  />
                )}

                <SelectInput
                  name="field_group_id"
                  control={form.control}
                  label="Abschnitt"
                  options={catalogue.groups.map((group) => ({
                    value: group.id,
                    label: group.title,
                  }))}
                  required
                />
              </FieldGroup>
            </CardContent>
          </Card>

          {!builtIn && hasChoices(type) && (
            <Card>
              <CardHeader>
                <CardTitle>Auswahlmöglichkeiten</CardTitle>
                <CardDescription>
                  Der Wert wird gespeichert, die Bezeichnung angezeigt.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {choices.fields.map((choice, index) => (
                  <div key={choice.id} className="flex gap-2">
                    <Input
                      aria-label={`Wert ${index + 1}`}
                      placeholder="Wert, z. B. apartment"
                      {...form.register(`choices.${index}.value`)}
                    />
                    <Input
                      aria-label={`Bezeichnung ${index + 1}`}
                      placeholder="Bezeichnung, z. B. Wohnung"
                      {...form.register(`choices.${index}.label`)}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label={`Auswahlmöglichkeit ${index + 1} entfernen`}
                      onClick={() => choices.remove(index)}
                      disabled={choices.fields.length === 1}
                    >
                      <Trash2 />
                    </Button>
                  </div>
                ))}
                {form.formState.errors.choices?.message && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.choices.message}
                  </p>
                )}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => choices.append({ value: '', label: '' })}
                >
                  <Plus />
                  Auswahlmöglichkeit
                </Button>
              </CardContent>
            </Card>
          )}

          {hasRange(type) && (
            <Card>
              <CardHeader>
                <CardTitle>Wertebereich</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <TextInput
                    name="min"
                    control={form.control}
                    label="Minimum"
                    type="number"
                  />
                  <TextInput
                    name="max"
                    control={form.control}
                    label="Maximum"
                    type="number"
                  />
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Wann</CardTitle>
              <CardDescription>
                Ein Feld wird ab einem Schritt erfragt und kann ab einem
                (gleichen oder späteren) Schritt Pflicht sein. Einzelne
                Vermittlungen können davon abweichen.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FieldGroup>
                <SelectInput
                  name="collect_at"
                  control={form.control}
                  label={isInfo ? 'Anzeigen ab' : 'Erfragt ab'}
                  options={STEP_OPTIONS}
                  required
                />
                {!isInfo && (
                  <SelectInput
                    name="required_for"
                    control={form.control}
                    label="Pflicht ab"
                    options={[
                      { value: OPTIONAL, label: 'Optional' },
                      ...STEP_OPTIONS,
                    ]}
                  />
                )}
              </FieldGroup>
            </CardContent>
          </Card>

          {!builtIn && (
            <Card>
              <CardHeader>
                <CardTitle>Bedingung</CardTitle>
                <CardDescription>
                  Das Feld gilt nur, wenn ein weiter oben stehendes Ja/Nein-
                  oder Auswahlfeld einen bestimmten Wert hat. Sonst wird es
                  weder erfragt noch verlangt.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <FieldGroup>
                  <SelectInput
                    name="condition_field"
                    control={form.control}
                    label="Abhängig von"
                    options={[
                      { value: NO_CONDITION, label: 'Keine Bedingung' },
                      ...candidates.map((candidate) => ({
                        value: candidate.key,
                        label: candidate.label,
                      })),
                    ]}
                  />
                  {controller?.type === 'boolean' && (
                    <SelectInput
                      name="condition_equals"
                      control={form.control}
                      label="Gilt, wenn die Antwort"
                      options={[
                        { value: 'true', label: 'Ja' },
                        { value: 'false', label: 'Nein' },
                      ]}
                    />
                  )}
                  {controller && controller.type !== 'boolean' && (
                    <Field>
                      <FieldLabel>Gilt bei</FieldLabel>
                      {(controller.options?.choices ?? []).map((choice) => (
                        <Field key={choice.value} orientation="horizontal">
                          <Checkbox
                            id={`condition-${choice.value}`}
                            checked={conditionIn.includes(choice.value)}
                            onCheckedChange={(checked) =>
                              form.setValue(
                                'condition_in',
                                checked
                                  ? [...conditionIn, choice.value]
                                  : conditionIn.filter(
                                      (value) => value !== choice.value
                                    ),
                                { shouldDirty: true }
                              )
                            }
                          />
                          <FieldLabel htmlFor={`condition-${choice.value}`}>
                            {choice.label}
                          </FieldLabel>
                        </Field>
                      ))}
                    </Field>
                  )}
                </FieldGroup>
              </CardContent>
            </Card>
          )}

          {!isInfo && (
            <Card>
              <CardHeader>
                <CardTitle>Sichtbarkeit und Prüfung</CardTitle>
              </CardHeader>
              <CardContent>
                <FieldGroup>
                  <Switch
                    name="visible_to_applicant"
                    control={form.control}
                    label="Bewerber:in"
                    switchLabel="Wird von der Bewerber:in erfragt und ist im Portal sichtbar"
                  />
                  <Switch
                    name="visible_to_inspector"
                    control={form.control}
                    label="Kontrolleur:innen"
                    switchLabel="Ist auf der Seite der Vorkontrolle sichtbar"
                  />
                  {!builtIn && (
                    <Switch
                      name="requires_review"
                      control={form.control}
                      label="Prüfung"
                      switchLabel="Die Vermittlung muss die Angabe bestätigen (z. B. ein Foto)"
                    />
                  )}
                </FieldGroup>
              </CardContent>
              <CardFooter className="justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onDone}
                  disabled={mutation.isPending}
                >
                  Abbrechen
                </Button>
                <Button type="submit" disabled={mutation.isPending}>
                  {mutation.isPending ? 'Speichern...' : 'Speichern'}
                </Button>
              </CardFooter>
            </Card>
          )}

          {isInfo && (
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={onDone}
                disabled={mutation.isPending}
              >
                Abbrechen
              </Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? 'Speichern...' : 'Speichern'}
              </Button>
            </div>
          )}
        </form>
      </FormProvider>
    </div>
  )
}
