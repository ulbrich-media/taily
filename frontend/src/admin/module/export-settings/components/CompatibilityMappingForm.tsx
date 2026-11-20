import { useState } from 'react'
import { X } from 'lucide-react'
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
        <fieldset key={option} className="space-y-2">
          <legend className="text-sm font-medium">{label}</legend>
          <ul
            className="flex flex-wrap gap-2"
            aria-label={`Wörter für ${label}`}
          >
            {mapping[option].length === 0 && (
              <li className="text-sm text-muted-foreground">Keine Wörter</li>
            )}
            {mapping[option].map((word) => (
              <li key={word}>
                <Badge variant="outline" className="gap-1">
                  {word}
                  {!readOnly && (
                    <button
                      type="button"
                      aria-label={`${word} entfernen`}
                      onClick={() => removeWord(option, word)}
                    >
                      <X className="size-3" />
                    </button>
                  )}
                </Badge>
              </li>
            ))}
          </ul>
          {!readOnly && (
            <>
              <div className="flex gap-2">
                <Input
                  aria-label={`Neues Wort für ${label}`}
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
                  placeholder="Wort hinzufügen"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => addWord(option)}
                  aria-label={`Wort für ${label} hinzufügen`}
                >
                  Hinzufügen
                </Button>
              </div>
              {errors[option] && (
                <p role="alert" className="text-sm text-destructive">
                  {errors[option]}
                </p>
              )}
            </>
          )}
        </fieldset>
      ))}
      {!readOnly && (
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Speichere...' : 'Speichern'}
        </Button>
      )}
    </form>
  )
}
