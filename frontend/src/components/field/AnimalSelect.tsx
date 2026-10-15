import {
  FormFieldWrapper,
  type FormFieldWrapperProps,
} from '@/components/form/FormFieldWrapper.tsx'
import { useEffect, useState } from 'react'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { listAnimalsPageQuery } from '@/admin/module/animals/api/queries.ts'
import { animalListSearchDefaults } from '@/admin/module/animals/animal-list.search'
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
  /** Page size of the search result; the picker never loads the whole table. */
  pageSize?: number
}

const SEARCH_DEBOUNCE_MS = 250

function useDebouncedValue<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])
  return debounced
}

export function AnimalSelect<
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
  TTransformedValues = TFieldValues,
>({
  pageSize = 10,
  ...props
}: AnimalSelectProps<TFieldValues, TName, TTransformedValues>) {
  const [term, setTerm] = useState('')
  // The chosen animal may fall out of the next search result: keep it for the button.
  const [selected, setSelected] = useState<AnimalListResource | null>(null)
  const debouncedTerm = useDebouncedValue(term.trim(), SEARCH_DEBOUNCE_MS)

  const { data } = useQuery({
    ...listAnimalsPageQuery(
      { ...animalListSearchDefaults, sort: 'name', search: debouncedTerm },
      pageSize
    ),
    placeholderData: keepPreviousData,
  })
  const animals = data?.data ?? []

  return (
    <FormFieldWrapper
      {...props}
      render={({ field, fieldState }) => (
        <ComboSelect
          id={field.name}
          aria-invalid={fieldState.invalid}
          items={animals}
          selectedItem={selected}
          onSearchChange={setTerm}
          value={field.value ?? null}
          onValueChange={(id) => {
            setSelected(animals.find((animal) => animal.id === id) ?? null)
            field.onChange(id)
          }}
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
