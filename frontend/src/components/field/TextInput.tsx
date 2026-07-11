import {
  FormFieldWrapper,
  type FormFieldWrapperProps,
} from '@/components/form/FormFieldWrapper.tsx'
import type { ComponentProps } from 'react'
import type { FieldPath, FieldValues } from 'react-hook-form'
import { Input } from '@/shadcn/components/ui/input.tsx'

export type TextInputProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
  TTransformedValues = TFieldValues,
> = Omit<
  FormFieldWrapperProps<TFieldValues, TName, TTransformedValues>,
  'render'
> & {
  type?: ComponentProps<'input'>['type']
  autoComplete?: ComponentProps<'input'>['autoComplete']
  inputMode?: ComponentProps<'input'>['inputMode']
  autoFocus?: boolean
}

export function TextInput<
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
  TTransformedValues = TFieldValues,
>({
  type = 'text',
  autoComplete = 'off',
  inputMode,
  autoFocus = false,
  ...props
}: TextInputProps<TFieldValues, TName, TTransformedValues>) {
  return (
    <FormFieldWrapper
      {...props}
      render={({ field, fieldState }) => (
        <Input
          {...field}
          id={field.name}
          aria-invalid={fieldState.invalid}
          type={type}
          autoComplete={autoComplete}
          inputMode={inputMode}
          autoFocus={autoFocus}
        />
      )}
    />
  )
}
