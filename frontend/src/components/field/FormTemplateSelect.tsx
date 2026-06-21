import type { FieldPath, FieldValues } from 'react-hook-form'
import {
  FormFieldWrapper,
  type FormFieldWrapperProps,
} from '@/components/form/FormFieldWrapper.tsx'
import type { FormTemplateResource } from '@/api/types/form-templates.ts'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shadcn/components/ui/select.tsx'
import { Badge } from '@/shadcn/components/ui/badge.tsx'
import { ButtonGroup } from '@/shadcn/components/ui/button-group.tsx'
import { Button } from '@/shadcn/components/ui/button.tsx'
import { X } from 'lucide-react'
import { cn } from '@/shadcn/lib/utils.ts'

export interface FormTemplateSelectProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
  TTransformedValues = TFieldValues,
> extends Omit<
  FormFieldWrapperProps<TFieldValues, TName, TTransformedValues>,
  'render'
> {
  formTemplates: FormTemplateResource[]
  canRemove?: boolean
  placeholder?: string
  disabled?: boolean
}

export function FormTemplateSelect<
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
  TTransformedValues = TFieldValues,
>({
  formTemplates,
  canRemove,
  placeholder = 'Kein Formular',
  disabled,
  ...props
}: FormTemplateSelectProps<TFieldValues, TName, TTransformedValues>) {
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
              className={cn('flex-1')}
            >
              <SelectValue placeholder={placeholder} />
            </SelectTrigger>
            <SelectContent>
              {formTemplates.map((form) => (
                <SelectItem key={form.id} value={form.id}>
                  {form.name} <Badge variant="outline">V{form.version}</Badge>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {canRemove && (
            <Button
              type="button"
              variant="outline"
              size="icon"
              disabled={!field.value}
              onClick={() => field.onChange(null)}
            >
              <X />
            </Button>
          )}
        </ButtonGroup>
      )}
    />
  )
}
