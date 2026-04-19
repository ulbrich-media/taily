import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/shadcn/components/ui/button.tsx'
import { Input } from '@/shadcn/components/ui/input.tsx'
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@/shadcn/components/ui/field.tsx'
import { Checkbox } from '@/shadcn/components/ui/checkbox.tsx'
import type { AnimalDetailResource } from '@/api/types/animals'

const animalFormSchema = z.object({
  animal_number: z
    .string()
    .min(1, 'Tiernummer ist erforderlich')
    .max(255, 'Tiernummer darf maximal 255 Zeichen lang sein')
    .trim(),
  name: z
    .string()
    .min(1, 'Name ist erforderlich')
    .max(255, 'Name darf maximal 255 Zeichen lang sein')
    .trim(),
  old_name: z
    .string()
    .max(255, 'Neuer Name darf maximal 255 Zeichen lang sein')
    .optional(),
  breed: z
    .string()
    .max(255, 'Rasse darf maximal 255 Zeichen lang sein')
    .optional(),
  gender: z.enum(['male', 'female'], {
    error: 'Geschlecht ist erforderlich',
  }),
  color: z
    .string()
    .max(255, 'Farbe darf maximal 255 Zeichen lang sein')
    .optional(),
  date_of_birth: z.string().optional(),
  intake_date: z.string().optional(),
  is_neutered: z.boolean(),
})

export type AnimalFormData = z.infer<typeof animalFormSchema>

interface AnimalFormProps {
  defaultValues?: Partial<AnimalDetailResource>
  onSubmit: (data: AnimalFormData) => void
  onCancel: () => void
  isSubmitting?: boolean
  submitLabel?: string
}

export function AnimalForm({
  defaultValues,
  onSubmit,
  onCancel,
  isSubmitting = false,
  submitLabel = 'Speichern',
}: AnimalFormProps) {
  const form = useForm<AnimalFormData>({
    resolver: zodResolver(animalFormSchema),
    defaultValues: {
      animal_number: defaultValues?.animal_number || '',
      name: defaultValues?.name || '',
      old_name: defaultValues?.old_name || '',
      breed: defaultValues?.breed || '',
      gender: defaultValues?.gender || 'male',
      color: defaultValues?.color || '',
      date_of_birth: defaultValues?.date_of_birth || '',
      intake_date: defaultValues?.intake_date || '',
      is_neutered: defaultValues?.is_neutered || false,
    },
  })

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <FieldGroup>
        <Controller
          name="animal_number"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={field.name}>Tiernummer *</FieldLabel>
              <Input
                {...field}
                id={field.name}
                aria-invalid={fieldState.invalid}
                autoComplete="off"
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <Controller
          name="name"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={field.name}>Name *</FieldLabel>
              <Input
                {...field}
                id={field.name}
                aria-invalid={fieldState.invalid}
                autoComplete="off"
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <Controller
          name="old_name"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={field.name}>Neuer Name</FieldLabel>
              <FieldDescription>
                Optional: Falls das Tier einen neuen Namen erhält
              </FieldDescription>
              <Input
                {...field}
                id={field.name}
                aria-invalid={fieldState.invalid}
                autoComplete="off"
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <Controller
          name="gender"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={field.name}>Geschlecht *</FieldLabel>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    {...field}
                    value="male"
                    checked={field.value === 'male'}
                    className="cursor-pointer"
                  />
                  <span>Männlich</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    {...field}
                    value="female"
                    checked={field.value === 'female'}
                    className="cursor-pointer"
                  />
                  <span>Weiblich</span>
                </label>
              </div>
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <Controller
          name="breed"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={field.name}>Rasse</FieldLabel>
              <Input
                {...field}
                id={field.name}
                aria-invalid={fieldState.invalid}
                autoComplete="off"
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <Controller
          name="color"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={field.name}>Farbe</FieldLabel>
              <Input
                {...field}
                id={field.name}
                aria-invalid={fieldState.invalid}
                autoComplete="off"
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <Controller
          name="date_of_birth"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={field.name}>Geburtsdatum</FieldLabel>
              <Input
                {...field}
                id={field.name}
                type="date"
                aria-invalid={fieldState.invalid}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <Controller
          name="intake_date"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={field.name}>Aufnahmedatum</FieldLabel>
              <Input
                {...field}
                id={field.name}
                type="date"
                aria-invalid={fieldState.invalid}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <Controller
          name="is_neutered"
          control={form.control}
          render={({ field }) => (
            <Field orientation="horizontal">
              <Checkbox
                id={field.name}
                checked={field.value}
                onCheckedChange={field.onChange}
              />
              <FieldContent>
                <FieldLabel htmlFor={field.name}>Kastriert</FieldLabel>
                <FieldDescription>
                  Ist dieses Tier kastriert/sterilisiert?
                </FieldDescription>
              </FieldContent>
            </Field>
          )}
        />
      </FieldGroup>

      <div className="flex justify-end gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Abbrechen
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Speichert...' : submitLabel}
        </Button>
      </div>
    </form>
  )
}
