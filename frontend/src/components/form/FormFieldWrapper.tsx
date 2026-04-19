import {
  type Control,
  Controller,
  type ControllerFieldState,
  type ControllerRenderProps,
  type FieldPath,
  type UseFormStateReturn,
} from 'react-hook-form'
import type { FieldValues } from 'react-hook-form'
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from '@/shadcn/components/ui/field.tsx'
import { Badge } from '@/shadcn/components/ui/badge.tsx'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/shadcn/components/ui/tooltip.tsx'
import { CircleHelp } from 'lucide-react'
import type { ReactElement } from 'react'

export interface FormFieldWrapperProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
  TTransformedValues = TFieldValues,
> {
  name: TName
  control: Control<TFieldValues, unknown, TTransformedValues>
  label: string
  description?: string
  info?: string
  required?: boolean
  render: ({
    field,
    fieldState,
    formState,
  }: {
    field: ControllerRenderProps<TFieldValues, TName>
    fieldState: ControllerFieldState
    formState: UseFormStateReturn<TFieldValues>
  }) => ReactElement
}

export function FormFieldWrapper<
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
  TTransformedValues = TFieldValues,
>({
  name,
  control,
  label,
  description,
  info,
  required = false,
  render,
}: FormFieldWrapperProps<TFieldValues, TName, TTransformedValues>) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState, formState }) => (
        <Field data-invalid={fieldState.invalid}>
          <div className="flex items-center gap-1.5">
            <FieldLabel htmlFor={field.name}>
              {label}
              {required && <Badge variant="secondary">Pflicht</Badge>}
            </FieldLabel>
            {info && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger type="button" className="inline-flex">
                    <CircleHelp className="size-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">{info}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
          {render({
            field: {
              ...field,
              value: field.value,
            },
            fieldState,
            formState,
          })}
          {description && <FieldDescription>{description}</FieldDescription>}
          {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
        </Field>
      )}
    />
  )
}
