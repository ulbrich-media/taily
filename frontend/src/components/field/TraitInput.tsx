import { useState, useRef, type KeyboardEvent } from 'react'
import {
  Controller,
  type Control,
  type FieldPath,
  type FieldValues,
} from 'react-hook-form'
import { useQuery } from '@tanstack/react-query'
import {
  PlusIcon,
  ChevronDownIcon,
  XIcon,
  LoaderCircleIcon,
} from 'lucide-react'
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from '@/shadcn/components/ui/field.tsx'
import { Input } from '@/shadcn/components/ui/input.tsx'
import { Button } from '@/shadcn/components/ui/button.tsx'
import { Badge } from '@/shadcn/components/ui/badge.tsx'
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from '@/shadcn/components/ui/popover.tsx'
import { animalTraitSuggestionsQuery } from '@/admin/module/animals/api/queries.ts'

type TraitField = 'compatibilities' | 'personality_traits'

interface TraitInputControlProps {
  value: string[]
  onChange: (values: string[]) => void
  animalTypeId: string
  traitField: TraitField
  invalid?: boolean
  fieldId: string
}

function TraitInputControl({
  value,
  onChange,
  animalTypeId,
  traitField,
  invalid,
  fieldId,
}: TraitInputControlProps) {
  const [inputValue, setInputValue] = useState('')
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const {
    data: suggestions,
    isLoading,
    isError,
  } = useQuery({
    ...animalTraitSuggestionsQuery(animalTypeId),
    enabled: dropdownOpen,
  })

  const availableSuggestions = (suggestions?.[traitField] ?? []).filter(
    (s) => !value.includes(s)
  )

  const addValue = () => {
    const trimmed = inputValue.trim()
    if (!trimmed || value.includes(trimmed)) {
      setInputValue('')
      return
    }
    onChange([...value, trimmed])
    setInputValue('')
  }

  const removeValue = (val: string) => {
    onChange(value.filter((v) => v !== val))
  }

  const addSuggestion = (suggestion: string) => {
    if (!value.includes(suggestion)) {
      onChange([...value, suggestion])
    }
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addValue()
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-1.5">
        <Input
          ref={inputRef}
          id={fieldId}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          aria-invalid={invalid}
          autoComplete="off"
          className="flex-1"
        />
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={addValue}
          aria-label="Hinzufügen"
        >
          <PlusIcon className="size-4" />
        </Button>
        <Popover open={dropdownOpen} onOpenChange={setDropdownOpen}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="outline"
              size="icon"
              aria-label="Vorschläge anzeigen"
            >
              <ChevronDownIcon className="size-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-0" align="end">
            {isLoading ? (
              <div className="text-muted-foreground flex items-center gap-2 px-3 py-2 text-sm">
                <LoaderCircleIcon className="size-4 animate-spin" />
                Lädt...
              </div>
            ) : isError ? (
              <p className="text-destructive px-3 py-2 text-sm">
                Vorschläge konnten nicht geladen werden.
              </p>
            ) : availableSuggestions.length === 0 ? (
              <p className="text-muted-foreground px-3 py-2 text-sm">
                Keine Vorschläge vorhanden
              </p>
            ) : (
              <ul className="max-h-60 overflow-y-auto py-1">
                {availableSuggestions.map((suggestion) => (
                  <li key={suggestion}>
                    <button
                      type="button"
                      className="hover:bg-accent hover:text-accent-foreground w-full px-3 py-1.5 text-left text-sm"
                      onClick={() => addSuggestion(suggestion)}
                    >
                      {suggestion}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </PopoverContent>
        </Popover>
      </div>

      {value.length === 0 ? (
        <p className="text-muted-foreground text-sm">
          Keine Einträge vorhanden
        </p>
      ) : (
        <div className="flex flex-wrap gap-1.5">
          {value.map((val) => (
            <Badge key={val} variant="secondary" className="gap-1 pr-1">
              {val}
              <button
                type="button"
                onClick={() => removeValue(val)}
                className="hover:text-foreground ml-0.5 opacity-60 hover:opacity-100"
                aria-label={`${val} entfernen`}
              >
                <XIcon className="size-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  )
}

export interface TraitInputProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> {
  name: TName
  control: Control<TFieldValues>
  label: string
  description?: string
  animalTypeId: string
  traitField: TraitField
}

export function TraitInput<
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  name,
  control,
  label,
  description,
  animalTypeId,
  traitField,
}: TraitInputProps<TFieldValues, TName>) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid}>
          <FieldLabel htmlFor={field.name}>{label}</FieldLabel>
          <TraitInputControl
            value={field.value as string[]}
            onChange={field.onChange}
            animalTypeId={animalTypeId}
            traitField={traitField}
            invalid={fieldState.invalid}
            fieldId={field.name}
          />
          {description && <FieldDescription>{description}</FieldDescription>}
          {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
        </Field>
      )}
    />
  )
}
