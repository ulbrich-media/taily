import { Controller, useForm, FormProvider } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/shadcn/components/ui/button.tsx'
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from '@/shadcn/components/ui/field.tsx'
import type { PersonDetailResource } from '@/api/types/people'
import { Checkbox } from '@/shadcn/components/ui/checkbox.tsx'
import type { AnimalTypeResource } from '@/api/types/animal-types'
import { FormSection } from '@/components/form/FormSection'
import { FormBlocker } from '@/components/form/FormBlocker'

const personFormRolesSchema = z.object({
  inspector_animal_type_ids: z.array(z.string()).optional(),
  mediator_animal_type_ids: z.array(z.string()).optional(),
  foster_animal_type_ids: z.array(z.string()).optional(),
})

export type PersonFormRolesData = z.infer<typeof personFormRolesSchema>

interface PersonFormRolesProps {
  defaultValues?: Partial<PersonDetailResource>
  animalTypes: AnimalTypeResource[]
  onSubmit: (data: PersonFormRolesData) => Promise<void>
  isSubmitting?: boolean
}

export function PersonFormRoles({
  defaultValues,
  animalTypes,
  onSubmit,
  isSubmitting = false,
}: PersonFormRolesProps) {
  const form = useForm<PersonFormRolesData>({
    resolver: zodResolver(personFormRolesSchema),
    defaultValues: {
      inspector_animal_type_ids:
        defaultValues?.inspector_animal_types?.map((at) => at.id) ?? [],
      mediator_animal_type_ids:
        defaultValues?.mediator_animal_types?.map((at) => at.id) ?? [],
      foster_animal_type_ids:
        defaultValues?.foster_animal_types?.map((at) => at.id) ?? [],
    },
  })

  const toggleAnimalTypeResource = (
    animalTypeId: string,
    currentValue: string[]
  ) => {
    const newValue = currentValue.includes(animalTypeId)
      ? currentValue.filter((id) => id !== animalTypeId)
      : [...currentValue, animalTypeId]
    return newValue
  }

  const handleFormSubmit = async (data: PersonFormRolesData) => {
    await onSubmit(data)
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
          <FormSection
            title="Kontrolleur"
            description="Diese Person kann Vor- und Nachkontrollen für folgende Tierarten durchführen."
          >
            <Controller
              name="inspector_animal_type_ids"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <div className="space-y-2">
                    {animalTypes.map((animalType) => (
                      <Field key={animalType.id} orientation="horizontal">
                        <Checkbox
                          id={`inspector-${animalType.id}`}
                          checked={field.value?.includes(animalType.id)}
                          onCheckedChange={() => {
                            field.onChange(
                              toggleAnimalTypeResource(
                                animalType.id,
                                field.value || []
                              )
                            )
                          }}
                        />
                        <FieldLabel htmlFor={`inspector-${animalType.id}`}>
                          {animalType.title}
                        </FieldLabel>
                      </Field>
                    ))}
                  </div>
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
          </FormSection>

          <FieldSeparator />

          <FormSection
            title="Vermittler"
            description="Diese Person kann als Vermittler für folgende Tierarten tätig sein."
          >
            <Controller
              name="mediator_animal_type_ids"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <div className="space-y-2">
                    {animalTypes.map((animalType) => (
                      <Field key={animalType.id} orientation="horizontal">
                        <Checkbox
                          id={`mediator-${animalType.id}`}
                          checked={field.value?.includes(animalType.id)}
                          onCheckedChange={() => {
                            field.onChange(
                              toggleAnimalTypeResource(
                                animalType.id,
                                field.value || []
                              )
                            )
                          }}
                        />
                        <FieldLabel htmlFor={`mediator-${animalType.id}`}>
                          {animalType.title}
                        </FieldLabel>
                      </Field>
                    ))}
                  </div>
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
          </FormSection>

          <FieldSeparator />

          <FormSection
            title="Pflegestelle"
            description="Diese Person kann als Pflegestelle für folgende Tierarten dienen."
          >
            <Controller
              name="foster_animal_type_ids"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <div className="space-y-2">
                    {animalTypes.map((animalType) => (
                      <Field key={animalType.id} orientation="horizontal">
                        <Checkbox
                          id={`foster-${animalType.id}`}
                          checked={field.value?.includes(animalType.id)}
                          onCheckedChange={() => {
                            field.onChange(
                              toggleAnimalTypeResource(
                                animalType.id,
                                field.value || []
                              )
                            )
                          }}
                        />
                        <FieldLabel htmlFor={`foster-${animalType.id}`}>
                          {animalType.title}
                        </FieldLabel>
                      </Field>
                    ))}
                  </div>
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
          </FormSection>
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
