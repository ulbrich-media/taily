import {
  FormFieldWrapper,
  type FormFieldWrapperProps,
} from '@/components/form/FormFieldWrapper'
import { type FieldPath, type FieldValues } from 'react-hook-form'
import type { OrganizationResource } from '@/api/types/organizations'
import { ButtonGroup } from '@/shadcn/components/ui/button-group'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shadcn/components/ui/select'
import { Button } from '@/shadcn/components/ui/button'
import { X } from 'lucide-react'

export interface OrganizationSelectProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
  TTransformedValues = TFieldValues,
> extends Omit<
  FormFieldWrapperProps<TFieldValues, TName, TTransformedValues>,
  'render'
> {
  organizations: OrganizationResource[]
  canRemove?: boolean
}

export function OrganizationSelect<
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
  TTransformedValues = TFieldValues,
>({
  organizations,
  canRemove,
  ...props
}: OrganizationSelectProps<TFieldValues, TName, TTransformedValues>) {
  return (
    <FormFieldWrapper
      {...props}
      render={({ field, fieldState }) => (
        <ButtonGroup>
          <Select value={field.value} onValueChange={field.onChange}>
            <SelectTrigger
              id={field.name}
              aria-invalid={fieldState.invalid}
              className="flex-1"
            >
              <SelectValue placeholder="Organisation auswählen" />
            </SelectTrigger>
            <SelectContent>
              {organizations.map((organization) => (
                <SelectItem key={organization.id} value={organization.id}>
                  {organization.name}
                  {organization.city && ` (${organization.city})`}
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
              onClick={() => {
                field.onChange('')
              }}
            >
              <X />
            </Button>
          )}
        </ButtonGroup>
      )}
    />
  )
}
