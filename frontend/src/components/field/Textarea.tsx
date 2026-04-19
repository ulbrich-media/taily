import {
  FormFieldWrapper,
  type FormFieldWrapperProps,
} from '@/components/form/FormFieldWrapper.tsx'
import type { FieldPath, FieldValues } from 'react-hook-form'
import { Textarea as UiTextarea } from '@/shadcn/components/ui/textarea.tsx'

export interface TextareaProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
  TTransformedValues = TFieldValues,
> extends Omit<
  FormFieldWrapperProps<TFieldValues, TName, TTransformedValues>,
  'render'
> {
  rows?: number
}

export function Textarea<
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
  TTransformedValues = TFieldValues,
>({
  rows = 6,
  ...props
}: TextareaProps<TFieldValues, TName, TTransformedValues>) {
  return (
    <FormFieldWrapper
      {...props}
      render={({ field, fieldState }) => (
        <UiTextarea
          {...field}
          id={field.name}
          aria-invalid={fieldState.invalid}
          autoComplete="off"
          rows={rows}
        />
      )}
    />
  )
}
