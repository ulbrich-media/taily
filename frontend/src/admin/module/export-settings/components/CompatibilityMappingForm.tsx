import { useState } from 'react'
import { PlusIcon, XIcon } from 'lucide-react'
import { ButtonGroup } from '@/shadcn/components/ui/button-group'
import { Field, FieldLabel } from '@/shadcn/components/ui/field'
import { Button } from '@/shadcn/components/ui/button'
import { Input } from '@/shadcn/components/ui/input'
import { Badge } from '@/shadcn/components/ui/badge'
import type {
  CompatibleWithMapping,
  CompatibleWithOption,
} from '@/admin/module/export-settings/api/types'

const OPTIONS: { option: CompatibleWithOption; label: string }[] = [
  { option: 'children', label: 'Kinder' },
  { option: 'dogs', label: 'Hunde' },
  { option: 'cats', label: 'Katzen' },
]

interface CompatibilityMappingFormProps {
  value: CompatibleWithMapping
  readOnly?: boolean
  isPending?: boolean
  onSubmit: (value: CompatibleWithMapping) => void
}

export function CompatibilityMappingForm({
  value,
  readOnly = false,
  isPending = false,
  onSubmit,
}: CompatibilityMappingFormProps) {
  const [mapping, setMapping] = useState<CompatibleWithMapping>(value)
  const [drafts, setDrafts] = useState<Record<CompatibleWithOption, string>>({
    children: '',
    dogs: '',
    cats: '',
  })
  const [errors, setErrors] = useState<
    Partial<Record<CompatibleWithOption, string>>
  >({})

  const setError = (option: CompatibleWithOption, message?: string) =>
    setErrors((current) => ({ ...current, [option]: message }))

  const addWord = (option: CompatibleWithOption) => {
    const word = drafts[option].trim()

    if (word === '') {
      setError(option, 'Bitte gib ein Wort ein.')
      return
    }
    if (word.length > 255) {
      setError(option, 'Ein Wort darf höchstens 255 Zeichen lang sein.')
      return
    }
    if (mapping[option].some((w) => w.toLowerCase() === word.toLowerCase())) {
      setError(option, 'Dieses Wort ist bereits in der Liste.')
      return
    }

    setError(option)
    setMapping({ ...mapping, [option]: [...mapping[option], word] })
    setDrafts({ ...drafts, [option]: '' })
  }

  const removeWord = (option: CompatibleWithOption, word: string) =>
    setMapping({
      ...mapping,
      [option]: mapping[option].filter((w) => w !== word),
    })

  return (
    <form
      className="space-y-6"
      onSubmit={(event) => {
        event.preventDefault()
        onSubmit(mapping)
      }}
    >
      {OPTIONS.map(({ option, label }) => (
        <Field key={option} data-invalid={Boolean(errors[option])}>
          <FieldLabel htmlFor={`mapping-${option}`}>
            {`Wörter, die bei Tiervermittlung.de als „${label}“ gelten`}
          </FieldLabel>
          {!readOnly && (
            <ButtonGroup>
              <Input
                id={`mapping-${option}`}
                aria-label={`Neues Wort für ${label}`}
                aria-invalid={Boolean(errors[option])}
                autoComplete="off"
                className="flex-1"
                value={drafts[option]}
                onChange={(event) =>
                  setDrafts({ ...drafts, [option]: event.target.value })
                }
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault()
                    addWord(option)
                  }
                }}
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                disabled={drafts[option].trim().length === 0}
                onClick={() => addWord(option)}
                aria-label={`Wort für ${label} hinzufügen`}
              >
                <PlusIcon className="size-4" />
              </Button>
            </ButtonGroup>
          )}
          {errors[option] && (
            <p role="alert" className="text-destructive text-sm">
              {errors[option]}
            </p>
          )}
          {mapping[option].length === 0 ? (
            <p className="text-muted-foreground text-sm">
              Keine Einträge vorhanden
            </p>
          ) : (
            <ul
              className="flex flex-wrap gap-1.5"
              aria-label={`Wörter für ${label}`}
            >
              {mapping[option].map((word) => (
                <li key={word}>
                  <Badge variant="secondary" className="gap-1 pr-1">
                    {word}
                    {!readOnly && (
                      <button
                        type="button"
                        onClick={() => removeWord(option, word)}
                        className="hover:text-foreground ml-0.5 opacity-60 hover:opacity-100"
                        aria-label={`${word} entfernen`}
                      >
                        <XIcon className="size-3" />
                      </button>
                    )}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </Field>
      ))}
      {!readOnly && (
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Speichere...' : 'Speichern'}
        </Button>
      )}
    </form>
  )
}
