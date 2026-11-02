import {
  Controller,
  useFieldArray,
  useFormContext,
  useWatch,
} from 'react-hook-form'
import { ArrowDown, ArrowUp, Trash2 } from 'lucide-react'
import type {
  ContractFieldOption,
  ContractFieldOptions,
  ContractSection,
} from '@/api/types/contract-templates'
import { Badge } from '@/shadcn/components/ui/badge'
import { Button } from '@/shadcn/components/ui/button'
import { Label } from '@/shadcn/components/ui/label'
import { Switch } from '@/shadcn/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shadcn/components/ui/select'
import {
  fieldLabel,
  type ContractTemplateFormData,
} from '../contract-templates.utils'

interface SectionFieldsEditorProps {
  section: ContractSection
  // What the section can print right now.
  available: ContractFieldOption[]
  options: ContractFieldOptions
}

/**
 * The ordered fields of one contract section. Each is required (blocks
 * generation while missing) or printed only when it has a value.
 */
export function SectionFieldsEditor({
  section,
  available,
  options,
}: SectionFieldsEditorProps) {
  const name = `${section}_fields` as const
  const { control, formState } = useFormContext<ContractTemplateFormData>()
  const fields = useFieldArray({ control, name })
  const chosen = useWatch({ control, name })
  const addable = available.filter(
    (option) => !chosen.some((field) => field.key === option.key)
  )
  const errors = formState.errors[name]

  return (
    <div className="space-y-3">
      {fields.fields.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Dieser Abschnitt wird nicht gedruckt.
        </p>
      ) : (
        <ul className="divide-y rounded-md border">
          {fields.fields.map((field, index) => {
            const label = fieldLabel(options, section, field.key)
            const unavailable = !available.some((o) => o.key === field.key)
            const error = errors?.[index]?.key?.message
            const switchId = `${name}-${index}-required`

            return (
              <li key={field.id} className="flex flex-col gap-2 p-3">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium">{label ?? field.key}</span>
                      {unavailable && (
                        <Badge variant="destructive">Nicht verfügbar</Badge>
                      )}
                    </div>
                    <span className="font-mono text-xs break-all text-muted-foreground">
                      {field.key}
                    </span>
                  </div>
                  <div className="flex shrink-0 items-center gap-1 self-end sm:self-center">
                    <Controller
                      control={control}
                      name={`${name}.${index}.required`}
                      render={({ field: required }) => (
                        <div className="mr-2 flex items-center gap-2">
                          <Switch
                            id={switchId}
                            checked={required.value}
                            onCheckedChange={required.onChange}
                          />
                          <Label htmlFor={switchId}>Pflicht</Label>
                        </div>
                      )}
                    />
                    <Button
                      type="button"
                      size="icon-sm"
                      variant="ghost"
                      disabled={index === 0}
                      onClick={() => fields.swap(index, index - 1)}
                      aria-label={`${label ?? field.key} nach oben`}
                    >
                      <ArrowUp />
                    </Button>
                    <Button
                      type="button"
                      size="icon-sm"
                      variant="ghost"
                      disabled={index === fields.fields.length - 1}
                      onClick={() => fields.swap(index, index + 1)}
                      aria-label={`${label ?? field.key} nach unten`}
                    >
                      <ArrowDown />
                    </Button>
                    <Button
                      type="button"
                      size="icon-sm"
                      variant="ghost"
                      onClick={() => fields.remove(index)}
                      aria-label={`${label ?? field.key} entfernen`}
                    >
                      <Trash2 />
                    </Button>
                  </div>
                </div>
                {error && <p className="text-sm text-destructive">{error}</p>}
              </li>
            )
          })}
        </ul>
      )}

      {addable.length > 0 && (
        // Remounted after each addition so it shows its placeholder again.
        <Select
          key={chosen.length}
          onValueChange={(key) => fields.append({ key, required: true })}
        >
          <SelectTrigger
            className="w-full sm:w-72"
            aria-label={`Feld zum Abschnitt hinzufügen`}
          >
            <SelectValue placeholder="Feld hinzufügen …" />
          </SelectTrigger>
          <SelectContent>
            {addable.map((option) => (
              <SelectItem key={option.key} value={option.key}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </div>
  )
}
