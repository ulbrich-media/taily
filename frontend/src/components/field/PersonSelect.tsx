import {
  FormFieldWrapper,
  type FormFieldWrapperProps,
} from '@/components/form/FormFieldWrapper.tsx'
import type { FieldPath, FieldValues } from 'react-hook-form'
import type { PersonListResource } from '@/api/types/people'
import { ButtonGroup } from '@/shadcn/components/ui/button-group.tsx'
import { ComboSelect } from '@/shadcn/components/ui/combo-select.tsx'
import { Button } from '@/shadcn/components/ui/button.tsx'
import { User, X } from 'lucide-react'
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/shadcn/components/ui/avatar.tsx'

export interface PersonSelectProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
  TTransformedValues = TFieldValues,
> extends Omit<
  FormFieldWrapperProps<TFieldValues, TName, TTransformedValues>,
  'render'
> {
  persons: PersonListResource[]
  canRemove?: boolean
  renderSubline?: (person: PersonListResource) => string
}

export function PersonSelect<
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
  TTransformedValues = TFieldValues,
>({
  persons,
  canRemove,
  renderSubline = (person) =>
    person.city
      ? `${person.postal_code} ${person.city} (${person.country_code})`
      : '',
  ...props
}: PersonSelectProps<TFieldValues, TName, TTransformedValues>) {
  return (
    <FormFieldWrapper
      {...props}
      render={({ field, fieldState }) => (
        <ButtonGroup className="w-full">
          <ComboSelect
            id={field.name}
            aria-invalid={fieldState.invalid}
            className="flex-1"
            items={persons}
            value={field.value ?? null}
            onValueChange={field.onChange}
            getItemValue={(person) => person.id}
            renderButtonItem={(person) => (
              <div className="flex gap-2 items-center">
                {person.profile_picture_url && (
                  <Avatar size="sm">
                    <AvatarImage
                      alt={person.full_name}
                      src={person.profile_picture_url}
                    />
                  </Avatar>
                )}
                <span>{person.full_name}</span>
              </div>
            )}
            renderListItem={(person) => (
              <div className="flex gap-2 items-center">
                <Avatar size="lg">
                  {person.profile_picture_url && (
                    <AvatarImage
                      alt={person.full_name}
                      src={person.profile_picture_url}
                    />
                  )}
                  <AvatarFallback>
                    <User className="size-5 text-muted-foreground" />
                  </AvatarFallback>
                </Avatar>
                <span>
                  <p>{person.full_name}</p>
                  <p className="text-muted-foreground">
                    {renderSubline(person)}
                  </p>
                </span>
              </div>
            )}
            getItemSearchText={(person) =>
              [
                person.first_name,
                person.last_name,
                person.organization ? `(${person.organization.name})` : null,
              ]
                .filter(Boolean)
                .join(' ')
            }
            placeholder="Person auswählen"
          />
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
