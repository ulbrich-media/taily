import {
  FormFieldWrapper,
  type FormFieldWrapperProps,
} from '@/components/form/FormFieldWrapper.tsx'
import type { ComponentProps } from 'react'
import type { FieldPath, FieldValues } from 'react-hook-form'
import { Input } from '@/shadcn/components/ui/input.tsx'
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '@/shadcn/components/ui/input-group.tsx'
import { CopyButton } from '@/components/field/CopyButton.tsx'

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
  disabled?: boolean
  /** Shows a copy button that copies the current field value. */
  copyable?: { label: string; successMessage: string }
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
  disabled = false,
  copyable,
  ...props
}: TextInputProps<TFieldValues, TName, TTransformedValues>) {
  return (
    <FormFieldWrapper
      {...props}
      render={({ field, fieldState }) => {
        const inputProps = {
          ...field,
          id: field.name,
          'aria-invalid': fieldState.invalid,
          type,
          autoComplete,
          inputMode,
          autoFocus,
          disabled,
        }

        if (!copyable) return <Input {...inputProps} />

        return (
          <InputGroup>
            <InputGroupInput {...inputProps} />
            <InputGroupAddon align="inline-end">
              <CopyButton
                value={field.value}
                label={copyable.label}
                successMessage={copyable.successMessage}
              />
            </InputGroupAddon>
          </InputGroup>
        )
      }}
    />
  )
}
