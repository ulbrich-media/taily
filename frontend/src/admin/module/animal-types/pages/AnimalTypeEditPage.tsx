import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm, FormProvider } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { animalTypeQueryKeys } from '@/admin/module/animal-types/api/queries'
import { updateAnimalType } from '@/admin/module/animal-types/api/requests'
import type { AnimalTypeResource } from '@/api/types/animal-types'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/shadcn/components/ui/card'
import { Button } from '@/shadcn/components/ui/button'
import { FieldGroup } from '@/shadcn/components/ui/field'
import { toast } from 'sonner'
import { FormBlocker } from '@/components/form/FormBlocker'
import { TextInput } from '@/components/field/TextInput'
import { zFieldString } from '@/components/field/TextInput.utils.ts'
import { SelectInput } from '@/components/field/SelectInput'
import {
  fromSpeciesFormValue,
  TIERVERMITTLUNG_SPECIES_FORM_VALUES,
  TIERVERMITTLUNG_SPECIES_OPTIONS,
  toSpeciesFormValue,
} from '@/admin/module/animal-types/tiervermittlung-species'

const updateAnimalTypeSchema = z.object({
  title: zFieldString({ required: true }),
  tiervermittlung_species: z.enum(TIERVERMITTLUNG_SPECIES_FORM_VALUES),
})

type UpdateAnimalTypeFormData = z.infer<typeof updateAnimalTypeSchema>

interface AnimalTypeEditPageProps {
  animalType: AnimalTypeResource
  /** Non-admins see the values but cannot change them. */
  readOnly?: boolean
}

export function AnimalTypeEditPage({
  animalType,
  readOnly = false,
}: AnimalTypeEditPageProps) {
  const queryClient = useQueryClient()

  const form = useForm<UpdateAnimalTypeFormData>({
    resolver: zodResolver(updateAnimalTypeSchema),
    defaultValues: {
      title: animalType.title,
      tiervermittlung_species: toSpeciesFormValue(
        animalType.tiervermittlung_species
      ),
    },
  })

  const updateMutation = useMutation({
    mutationFn: (data: UpdateAnimalTypeFormData) =>
      updateAnimalType(animalType.id, {
        title: data.title,
        tiervermittlung_species: fromSpeciesFormValue(
          data.tiervermittlung_species
        ),
      }),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: animalTypeQueryKeys.list })
      queryClient.invalidateQueries({
        queryKey: animalTypeQueryKeys.detail(animalType.id),
      })
      toast.success(data.message)
      // The page stays open, so the saved values become the new baseline.
      form.reset(variables)
    },
    onError: (error) => {
      toast.error(
        error instanceof Error
          ? error.message
          : 'Fehler beim Aktualisieren der Tierart.'
      )
    },
  })

  const onSubmit = async (data: UpdateAnimalTypeFormData) => {
    await updateMutation.mutateAsync(data)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Basisdaten</CardTitle>
        <CardDescription>
          Name und Zuordnung der Tierart auf Tiervermittlung.de.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <FormProvider {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormBlocker />

            <fieldset disabled={readOnly} className="contents">
              <FieldGroup>
                <TextInput
                  name="title"
                  control={form.control}
                  label="Name"
                  required
                />

                <SelectInput
                  name="tiervermittlung_species"
                  control={form.control}
                  label="Tierart auf Tiervermittlung.de"
                  info="Tiere dieser Art werden unter dieser Tierart an Tiervermittlung.de exportiert, sofern der Export aktiviert ist."
                  options={TIERVERMITTLUNG_SPECIES_OPTIONS}
                />
              </FieldGroup>
            </fieldset>

            {!readOnly && (
              <div className="flex justify-end">
                <Button type="submit" disabled={updateMutation.isPending}>
                  {updateMutation.isPending ? 'Aktualisiere...' : 'Speichern'}
                </Button>
              </div>
            )}
          </form>
        </FormProvider>
      </CardContent>
    </Card>
  )
}
