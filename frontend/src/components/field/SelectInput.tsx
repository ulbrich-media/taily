import {
  FormFieldWrapper,
  type FormFieldWrapperProps,
} from '@/components/form/FormFieldWrapper.tsx'
import type { FieldPath, FieldValues } from 'react-hook-form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shadcn/components/ui/select'
import { ButtonGroup } from '@/shadcn/components/ui/button-group.tsx'
import type { ReactNode } from 'react'

export interface SelectOption {
  value: string
  label: string
}

export type SelectInputProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
  TTransformedValues = TFieldValues,
> = Omit<
  FormFieldWrapperProps<TFieldValues, TName, TTransformedValues>,
  'render'
> & {
  options: SelectOption[]
  placeholder?: string
  disabled?: boolean
  additionalAction?: ReactNode
}

export function SelectInput<
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
  TTransformedValues = TFieldValues,
>({
  options,
  placeholder = 'Bitte wählen...',
  disabled,
  additionalAction,
  ...props
}: SelectInputProps<TFieldValues, TName, TTransformedValues>) {
  return (
    <FormFieldWrapper
      {...props}
      render={({ field, fieldState }) => (
        <ButtonGroup className="w-full">
          <Select
            value={field.value}
            onValueChange={field.onChange}
            disabled={disabled ?? field.disabled}
          >
            <SelectTrigger
              id={field.name}
              aria-invalid={fieldState.invalid}
              className="flex-1"
            >
              <SelectValue placeholder={placeholder} />
            </SelectTrigger>
            <SelectContent>
              {options.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {additionalAction}
        </ButtonGroup>
      )}
    />
  )
}
