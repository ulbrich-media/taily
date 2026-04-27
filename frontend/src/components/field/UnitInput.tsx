import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from '@/shadcn/components/ui/input-group.tsx'
import {
  FormFieldWrapper,
  type FormFieldWrapperProps,
} from '@/components/form/FormFieldWrapper.tsx'
import type { FieldPath, FieldValues } from 'react-hook-form'

export interface UnitInputProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
  TTransformedValues = TFieldValues,
> extends Omit<
  FormFieldWrapperProps<TFieldValues, TName, TTransformedValues>,
  'render'
> {
  unit: string
}

export function UnitInput<
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
  TTransformedValues = TFieldValues,
>({ unit, ...props }: UnitInputProps<TFieldValues, TName, TTransformedValues>) {
  return (
    <FormFieldWrapper
      {...props}
      render={({ field, fieldState }) => (
        <InputGroup>
          <InputGroupInput
            {...field}
            value={field.value ?? ''}
            onChange={(e) =>
              field.onChange(e.target.value === '' ? null : e.target.value)
            }
            id={field.name}
            type="number"
            inputMode="numeric"
            step="1"
            min="0"
            aria-invalid={fieldState.invalid}
            autoComplete="off"
          />
          <InputGroupAddon align="inline-end">
            <InputGroupText>{unit}</InputGroupText>
          </InputGroupAddon>
        </InputGroup>
      )}
    />
  )
}
