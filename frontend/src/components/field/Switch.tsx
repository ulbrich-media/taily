import {
  FormFieldWrapper,
  type FormFieldWrapperProps,
} from '@/components/form/FormFieldWrapper.tsx'
import type { FieldPath, FieldValues } from 'react-hook-form'
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldSet,
} from '@/shadcn/components/ui/field.tsx'
import { Switch as SwitchComponent } from '@/shadcn/components/ui/switch.tsx'

export interface SwitchProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
  TTransformedValues = TFieldValues,
> extends Omit<
  FormFieldWrapperProps<TFieldValues, TName, TTransformedValues>,
  'render'
> {
  switchLabel: string
  onChange?: (checked: boolean) => void
}

export function Switch<
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
  TTransformedValues = TFieldValues,
>({
  switchLabel,
  onChange,
  ...props
}: SwitchProps<TFieldValues, TName, TTransformedValues>) {
  return (
    <FormFieldWrapper
      {...props}
      render={({ field }) => (
        <FieldSet>
          <FieldGroup data-slot="checkbox-group">
            <Field orientation="horizontal">
              <SwitchComponent
                id={field.name}
                checked={field.value}
                onCheckedChange={(checked) => {
                  field.onChange(checked)
                  onChange?.(checked)
                }}
              />
              <FieldLabel htmlFor={field.name}>{switchLabel}</FieldLabel>
            </Field>
          </FieldGroup>
        </FieldSet>
      )}
    />
  )
}
