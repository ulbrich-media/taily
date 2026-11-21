import type { ReactNode } from 'react'
import {
  Controller,
  FormProvider,
  useForm,
  useWatch,
  type Path,
} from 'react-hook-form'
import {
  CONTRACT_SECTIONS,
  type ContractFieldOptions,
  type ContractTemplateResource,
} from '@/api/types/contract-templates'
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
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@/shadcn/components/ui/field'
import { FormBlocker } from '@/components/form/FormBlocker'
import { TextInput } from '@/components/field/TextInput'
import { Textarea } from '@/components/field/Textarea'
import { ApiValidationError } from '@/lib/api'
import { createContractTemplate, updateContractTemplate } from '../api/requests'
import {
  SECTION_DESCRIPTIONS,
  SECTION_LABELS,
  adopterOptions,
  toFormData,
  type ContractTemplateFormData,
} from '../contract-templates.utils'
import { SectionFieldsEditor } from '../components/SectionFieldsEditor'
import { useContractTemplateMutation } from '../useContractTemplateMutation'

interface ContractTemplateFormPageProps {
  // Absent when creating a new template.
  template?: ContractTemplateResource
  animalTypes: { id: string; title: string }[]
  options: ContractFieldOptions
  onDone: () => void
  breadcrumb?: ReactNode
}

/**
 * A contract template (ADR-017): a printed title, three data sections and
 * the wording. Required fields become requirements of the contract step for
 * every adoption of the chosen animal types.
 */
export function ContractTemplateFormPage({
  template,
  animalTypes,
  options,
  onDone,
  breadcrumb,
}: ContractTemplateFormPageProps) {
  const form = useForm<ContractTemplateFormData>({
    defaultValues: toFormData(template),
  })
  const animalTypeIds = useWatch({
    control: form.control,
    name: 'animal_type_ids',
  })

  const mutation = useContractTemplateMutation(
    (data: ContractTemplateFormData) =>
      template
        ? updateContractTemplate(template.id, data)
        : createContractTemplate(data),
    onDone
  )

  const onError = (error: unknown) => {
    if (!(error instanceof ApiValidationError) || !error.errors) return
    for (const [key, messages] of Object.entries(error.errors)) {
      const name = (
        key.startsWith('animal_type_ids') ? 'animal_type_ids' : key
      ) as Path<ContractTemplateFormData>
      form.setError(name, { message: messages[0] })
    }
  }

  const available = {
    animal: options.animal,
    mediator: options.mediator,
    adopter: adopterOptions(options, animalTypeIds),
  }

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumb={breadcrumb}
        title={
          template ? `„${template.name}“ bearbeiten` : 'Neue Vertragsvorlage'
        }
        description="Pflichtfelder fehlen auf der Checkliste jeder Vermittlung der gewählten Tierarten, bis sie ausgefüllt sind – vorher kann der Vertrag nicht erzeugt werden."
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
              <CardTitle>Vorlage</CardTitle>
            </CardHeader>
            <CardContent>
              <FieldGroup>
                <TextInput
                  name="name"
                  control={form.control}
                  label="Name"
                  description="Unter diesem Namen wählt die Vermittlung die Vorlage aus."
                  required
                />
                <TextInput
                  name="title"
                  control={form.control}
                  label="Titel"
                  description="Steht oben auf dem Vertrag."
                  required
                />
                <Controller
                  control={form.control}
                  name="animal_type_ids"
                  render={({ field, fieldState }) => (
                    <Field data-invalid={!!fieldState.error}>
                      <FieldLabel>Tierarten</FieldLabel>
                      {animalTypes.map((type) => (
                        <Field key={type.id} orientation="horizontal">
                          <Checkbox
                            id={`animal-type-${type.id}`}
                            checked={field.value.includes(type.id)}
                            onCheckedChange={(checked) =>
                              field.onChange(
                                checked
                                  ? [...field.value, type.id]
                                  : field.value.filter((id) => id !== type.id)
                              )
                            }
                          />
                          <FieldLabel htmlFor={`animal-type-${type.id}`}>
                            {type.title}
                          </FieldLabel>
                        </Field>
                      ))}
                      <FieldError errors={[fieldState.error]} />
                    </Field>
                  )}
                />
              </FieldGroup>
            </CardContent>
          </Card>

          {CONTRACT_SECTIONS.map((section) => (
            <Card key={section}>
              <CardHeader>
                <CardTitle>{SECTION_LABELS[section]}</CardTitle>
                <CardDescription>
                  {SECTION_DESCRIPTIONS[section]}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {section === 'adopter' && animalTypeIds.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Wähle zuerst die Tierarten, für die die Vorlage gilt.
                  </p>
                ) : (
                  <SectionFieldsEditor
                    section={section}
                    available={available[section]}
                    options={options}
                  />
                )}
              </CardContent>
            </Card>
          ))}

          <Card>
            <CardHeader>
              <CardTitle>Vertragstext</CardTitle>
              <CardDescription>
                Steht unter den Angaben. Eine Leerzeile beginnt einen neuen
                Absatz, „## “ am Zeilenanfang eine Überschrift, **fett** und
                *kursiv* sind möglich. Platzhalter gibt es nicht – alle Daten
                stehen in den Abschnitten oben.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                name="body"
                control={form.control}
                label="Text"
                rows={16}
              />
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
        </form>
      </FormProvider>
    </div>
  )
}
