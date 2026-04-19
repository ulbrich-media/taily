import {
  FormFieldWrapper,
  type FormFieldWrapperProps,
} from '@/components/form/FormFieldWrapper.tsx'
import type { FieldPath, FieldValues } from 'react-hook-form'
import type { AnimalListResource } from '@/api/types/animals'
import { ComboSelect } from '@/shadcn/components/ui/combo-select.tsx'
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/shadcn/components/ui/avatar.tsx'
import { PawPrint } from 'lucide-react'

export interface AnimalSelectProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
  TTransformedValues = TFieldValues,
> extends Omit<
  FormFieldWrapperProps<TFieldValues, TName, TTransformedValues>,
  'render'
> {
  animals: AnimalListResource[]
}

export function AnimalSelect<
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
  TTransformedValues = TFieldValues,
>({
  animals,
  ...props
}: AnimalSelectProps<TFieldValues, TName, TTransformedValues>) {
  return (
    <FormFieldWrapper
      {...props}
      render={({ field, fieldState }) => (
        <ComboSelect
          id={field.name}
          aria-invalid={fieldState.invalid}
          items={animals}
          value={field.value ?? null}
          onValueChange={field.onChange}
          getItemValue={(animal) => animal.id}
          getItemSearchText={(animal) =>
            [
              animal.name,
              animal.old_name,
              animal.animal_type?.title,
              animal.animal_number,
            ]
              .filter(Boolean)
              .join(' ')
          }
          renderButtonItem={(animal) => (
            <div className="flex gap-2 items-center">
              {animal.profile_picture_url && (
                <Avatar size="sm">
                  <AvatarImage
                    alt={animal.name}
                    src={animal.profile_picture_url}
                  />
                </Avatar>
              )}
              <span>
                {animal.name}
                {animal.old_name && (
                  <span className="text-muted-foreground">
                    {' '}
                    (früher {animal.old_name})
                  </span>
                )}
              </span>
            </div>
          )}
          renderListItem={(animal) => (
            <div className="flex gap-2 items-center">
              <Avatar size="lg">
                {animal.profile_picture_url && (
                  <AvatarImage
                    alt={animal.name}
                    src={animal.profile_picture_url}
                  />
                )}
                <AvatarFallback>
                  <PawPrint className="size-5 text-muted-foreground" />
                </AvatarFallback>
              </Avatar>
              <span>
                <p>
                  {animal.name}
                  {animal.old_name && (
                    <span className="text-muted-foreground">
                      {' '}
                      (früher {animal.old_name})
                    </span>
                  )}
                </p>
                <p className="text-muted-foreground">
                  {animal.animal_type?.title}
                </p>
              </span>
            </div>
          )}
          placeholder="Tier auswählen"
        />
      )}
    />
  )
}
