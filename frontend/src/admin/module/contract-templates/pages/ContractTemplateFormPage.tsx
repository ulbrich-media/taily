import { FormProvider, useForm, type Path } from 'react-hook-form'
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
  CardHeader,
  CardTitle,
} from '@/shadcn/components/ui/card'
import { Button } from '@/shadcn/components/ui/button'
import { FieldGroup } from '@/shadcn/components/ui/field'
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
  // The animal type the template belongs to; it comes from the URL.
  animalTypeId: string
  options: ContractFieldOptions
  onDone: () => void
  // Users who aren't admins see the template, but can't change it.
  readOnly?: boolean
}

/**
 * A contract template (ADR-017): a printed title, three data sections and
 * the wording, for one animal type. Required fields become requirements of
 * the contract step for every adoption of that type.
 */
export function ContractTemplateFormPage({
  template,
  animalTypeId,
  options,
  onDone,
  readOnly = false,
}: ContractTemplateFormPageProps) {
  const form = useForm<ContractTemplateFormData>({
    defaultValues: toFormData(animalTypeId, template),
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
      form.setError(key as Path<ContractTemplateFormData>, {
        message: messages[0],
      })
    }
  }

  const available = {
    animal: options.animal,
    mediator: options.mediator,
    adopter: adopterOptions(options, animalTypeId),
  }

  return (
    <div className="space-y-6">
      <PageHeader
        variant="section"
        title={
          !template
            ? 'Neue Vertragsvorlage'
            : readOnly
              ? `„${template.name}“`
              : `„${template.name}“ bearbeiten`
        }
        description="Pflichtfelder fehlen auf der Checkliste jeder Vermittlung dieser Tierart, bis sie ausgefüllt sind – vorher kann der Vertrag nicht erzeugt werden."
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

          <fieldset disabled={readOnly} className="contents space-y-6">
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
                  <SectionFieldsEditor
                    section={section}
                    available={available[section]}
                    options={options}
                  />
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
            </Card>
          </fieldset>

          <div className="flex justify-end gap-2">
            {readOnly ? (
              <Button type="button" variant="outline" onClick={onDone}>
                Zurück
              </Button>
            ) : (
              <>
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
              </>
            )}
          </div>
        </form>
      </FormProvider>
    </div>
  )
}
