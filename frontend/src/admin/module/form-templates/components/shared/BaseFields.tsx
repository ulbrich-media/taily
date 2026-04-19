import { Controller, type Control, type FieldValues } from 'react-hook-form'
import { Checkbox } from '@/shadcn/components/ui/checkbox'
import { Label } from '@/shadcn/components/ui/label'
import { Input } from '@/shadcn/components/ui/input'
import { TextInput } from '@/components/field/TextInput'
import { FormFieldWrapper } from '@/components/form/FormFieldWrapper'

interface BaseFieldsProps {
  control: Control<FieldValues>
  showRequired?: boolean
  isNew?: boolean
}

export function BaseFields({
  control,
  showRequired = true,
  isNew = false,
}: BaseFieldsProps) {
  return (
    <>
      <FormFieldWrapper
        name="name"
        control={control}
        label="Feldname"
        description={
          isNew
            ? undefined
            : 'Warnung: Wird bei bestehenden Formularen nicht nachträglich geändert!'
        }
        required
        render={({ field, fieldState }) => (
          <Input
            {...field}
            id={field.name}
            aria-invalid={fieldState.invalid}
            autoComplete="off"
          />
        )}
      />
      <TextInput name="label" control={control} label="Bezeichnung" required />
      <TextInput name="description" control={control} label="Beschreibung" />
      {showRequired && (
        <Controller
          name="required"
          control={control}
          render={({ field }) => (
            <div className="flex items-center gap-2">
              <Checkbox
                id="field-required"
                checked={field.value as boolean}
                onCheckedChange={field.onChange}
              />
              <Label
                htmlFor="field-required"
                className="cursor-pointer font-normal"
              >
                Pflichtfeld
              </Label>
            </div>
          )}
        />
      )}
    </>
  )
}
