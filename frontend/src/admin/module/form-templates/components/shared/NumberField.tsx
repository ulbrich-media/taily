import { Controller, type Control, type FieldValues } from 'react-hook-form'
import { Input } from '@/shadcn/components/ui/input'
import { Label } from '@/shadcn/components/ui/label'

export function NumberField({
  control,
  name,
  label,
  min,
}: {
  control: Control<FieldValues>
  name: string
  label: string
  min?: number
}) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={name}>{label}</Label>
          <Input
            id={name}
            type="number"
            min={min}
            value={field.value ?? ''}
            onChange={(e) =>
              field.onChange(
                e.target.value === '' ? undefined : Number(e.target.value)
              )
            }
            aria-invalid={fieldState.invalid}
          />
          {fieldState.error && (
            <p className="text-destructive text-xs">
              {fieldState.error.message}
            </p>
          )}
        </div>
      )}
    />
  )
}
