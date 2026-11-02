import { Controller, type Control, type FieldValues } from 'react-hook-form'
import { Input } from '@/shadcn/components/ui/input'
import { Textarea } from '@/shadcn/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shadcn/components/ui/select'
import { RadioGroup, RadioGroupItem } from '@/shadcn/components/ui/radio-group'
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from '@/shadcn/components/ui/field'
import { Badge } from '@/shadcn/components/ui/badge'
import type { CaseFileAddress, CaseFileField } from '@/api/types/case-file'
import { isFileField, requirementLabel } from '../case-file.utils'

interface CaseFileFieldInputProps {
  field: CaseFileField
  control: Control<FieldValues>
}

const ADDRESS_PARTS: { key: keyof CaseFileAddress; label: string }[] = [
  { key: 'street_line', label: 'Straße und Hausnummer' },
  { key: 'street_line_additional', label: 'Adresszusatz' },
  { key: 'postal_code', label: 'PLZ' },
  { key: 'city', label: 'Ort' },
  { key: 'country_code', label: 'Land' },
]

/**
 * One Case File field as a form input, named `values.<key>` so server
 * validation errors (`values.<key>`) land on it directly.
 */
export function CaseFileFieldInput({
  field,
  control,
}: CaseFileFieldInputProps) {
  const name = `values.${field.key}`
  const required = !!field.effective_required_for
  const label = (
    <>
      {field.label}
      {required && <Badge variant="secondary">{requirementLabel(field)}</Badge>}
    </>
  )

  if (field.type === 'info') {
    return (
      <p className="text-sm text-muted-foreground border-l-2 pl-3">
        {field.label}
      </p>
    )
  }

  if (isFileField(field)) {
    return (
      <Field>
        <FieldLabel>{label}</FieldLabel>
        <FieldDescription>
          Datei-Uploads sind im Prototyp noch nicht verfügbar.
        </FieldDescription>
      </Field>
    )
  }

  return (
    <Controller
      name={name}
      control={control}
      render={({ field: input, fieldState }) => {
        const description = field.help ? (
          <FieldDescription>{field.help}</FieldDescription>
        ) : null
        const error = <FieldError errors={[fieldState.error]} />

        switch (field.type) {
          case 'boolean':
            return (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel>{label}</FieldLabel>
                <RadioGroup
                  value={
                    input.value === true
                      ? 'yes'
                      : input.value === false
                        ? 'no'
                        : ''
                  }
                  onValueChange={(value) => input.onChange(value === 'yes')}
                  className="flex gap-4"
                >
                  <Field orientation="horizontal">
                    <RadioGroupItem value="yes" id={`${name}-yes`} />
                    <FieldLabel htmlFor={`${name}-yes`}>Ja</FieldLabel>
                  </Field>
                  <Field orientation="horizontal">
                    <RadioGroupItem value="no" id={`${name}-no`} />
                    <FieldLabel htmlFor={`${name}-no`}>Nein</FieldLabel>
                  </Field>
                </RadioGroup>
                {description}
                {error}
              </Field>
            )

          case 'select':
            return (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={name}>{label}</FieldLabel>
                <Select
                  value={(input.value as string) ?? ''}
                  onValueChange={input.onChange}
                >
                  <SelectTrigger id={name} aria-invalid={fieldState.invalid}>
                    <SelectValue placeholder="Bitte wählen" />
                  </SelectTrigger>
                  <SelectContent>
                    {(field.options?.choices ?? []).map((choice) => (
                      <SelectItem key={choice.value} value={choice.value}>
                        {choice.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {description}
                {error}
              </Field>
            )

          case 'radio':
            return (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel>{label}</FieldLabel>
                <RadioGroup
                  value={(input.value as string) ?? ''}
                  onValueChange={input.onChange}
                >
                  {(field.options?.choices ?? []).map((choice) => (
                    <Field key={choice.value} orientation="horizontal">
                      <RadioGroupItem
                        value={choice.value}
                        id={`${name}-${choice.value}`}
                      />
                      <FieldLabel htmlFor={`${name}-${choice.value}`}>
                        {choice.label}
                      </FieldLabel>
                    </Field>
                  ))}
                </RadioGroup>
                {description}
                {error}
              </Field>
            )

          case 'textarea':
            return (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={name}>{label}</FieldLabel>
                <Textarea
                  id={name}
                  rows={4}
                  value={(input.value as string) ?? ''}
                  onChange={input.onChange}
                  onBlur={input.onBlur}
                  aria-invalid={fieldState.invalid}
                />
                {description}
                {error}
              </Field>
            )

          case 'address': {
            const address = (input.value ?? {}) as Partial<CaseFileAddress>
            return (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel>{label}</FieldLabel>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {ADDRESS_PARTS.map((part) => (
                    <Input
                      key={part.key}
                      aria-label={part.label}
                      placeholder={part.label}
                      value={address[part.key] ?? ''}
                      onChange={(event) =>
                        input.onChange({
                          ...address,
                          [part.key]: event.target.value,
                        })
                      }
                    />
                  ))}
                </div>
                {description}
                {error}
              </Field>
            )
          }

          default: {
            const type =
              field.type === 'integer' || field.type === 'number'
                ? 'number'
                : field.type === 'date'
                  ? 'date'
                  : field.type === 'email'
                    ? 'email'
                    : field.type === 'phone'
                      ? 'tel'
                      : 'text'
            return (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={name}>{label}</FieldLabel>
                <Input
                  id={name}
                  type={type}
                  step={field.type === 'integer' ? 1 : undefined}
                  min={field.options?.min}
                  max={field.options?.max}
                  value={(input.value as string | number | null) ?? ''}
                  onChange={input.onChange}
                  onBlur={input.onBlur}
                  aria-invalid={fieldState.invalid}
                />
                {description}
                {error}
              </Field>
            )
          }
        }
      }}
    />
  )
}
