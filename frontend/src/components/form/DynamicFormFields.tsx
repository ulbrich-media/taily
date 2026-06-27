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
import { Badge } from '@/shadcn/components/ui/badge'
import {
  Field,
  FieldLabel,
  FieldDescription,
  FieldError,
  FieldSet,
} from '@/shadcn/components/ui/field'
import { Switch } from '@/shadcn/components/ui/switch.tsx'
import type {
  JsonSchema,
  JsonSchemaProperty,
  UiSchema,
  UiSchemaFieldOptions,
} from '@/api/types/form-schemas'
import { detectFieldType } from '@/lib/form-schema/detect-field-type'
import { resolveFieldOrder } from '@/lib/form-schema/resolve-field-order'

interface DynamicFormFieldsProps {
  schema: JsonSchema
  uiSchema?: UiSchema | null
  control: Control<FieldValues>
  disabled?: boolean
  namePrefix?: string
}

function buildRules(
  key: string,
  prop: JsonSchemaProperty,
  required: string[]
): Record<string, unknown> {
  const rules: Record<string, unknown> = {}

  if (required.includes(key)) {
    rules.required = 'Dieses Feld ist erforderlich'
  }

  if (prop.type === 'number' || prop.type === 'integer') {
    if (prop.minimum !== undefined) {
      rules.min = {
        value: prop.minimum,
        message: `Mindestwert: ${prop.minimum}`,
      }
    }
    if (prop.maximum !== undefined) {
      rules.max = {
        value: prop.maximum,
        message: `Maximalwert: ${prop.maximum}`,
      }
    }
  }

  if (prop.type === 'string') {
    if (prop.minLength !== undefined) {
      rules.minLength = {
        value: prop.minLength,
        message: `Mindestens ${prop.minLength} Zeichen`,
      }
    }
    if (prop.maxLength !== undefined) {
      rules.maxLength = {
        value: prop.maxLength,
        message: `Maximal ${prop.maxLength} Zeichen`,
      }
    }
    if (prop.format === 'email') {
      rules.pattern = {
        value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        message: 'Bitte eine gültige E-Mail-Adresse eingeben',
      }
    }
  }

  if (prop.enum && required.includes(key)) {
    rules.validate = (value: unknown) =>
      prop.enum!.includes(value as string) || 'Bitte eine Option auswählen'
  }

  return rules
}

function RequiredBadge() {
  return <Badge variant="secondary">Pflicht</Badge>
}

export function DynamicFormFields({
  schema,
  uiSchema: rawUiSchema,
  control,
  disabled = false,
  namePrefix = 'form_data',
}: DynamicFormFieldsProps) {
  const uiSchema = rawUiSchema ?? {}

  if (!schema.properties) return null

  const required = schema.required ?? []
  const uiOrder = uiSchema['ui:order'] as string[] | undefined
  const orderedKeys = resolveFieldOrder(schema.properties, uiOrder, uiSchema)

  return (
    <div className="space-y-4">
      {orderedKeys.map((key) => {
        const prop = schema.properties?.[key] ?? {}
        const fieldName = `${namePrefix}.${key}`
        const uiOptions = (uiSchema[key] ?? {}) as UiSchemaFieldOptions
        const title = uiOptions['ui:title'] ?? prop.title ?? key
        const placeholder = uiOptions['ui:placeholder']
        const isRequired = required.includes(key)
        const rules = buildRules(key, prop, required)
        const fieldType = detectFieldType(prop, uiOptions)

        switch (fieldType) {
          case 'heading':
            return (
              <h3 key={key} className="text-lg font-heading pt-2">
                {title}
              </h3>
            )

          case 'checkbox':
            return (
              <Controller
                key={key}
                name={fieldName}
                control={control}
                rules={rules}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldSet>
                      <Field orientation="horizontal">
                        <Switch
                          id={fieldName}
                          checked={!!field.value}
                          onCheckedChange={field.onChange}
                          disabled={disabled}
                        />
                        <FieldLabel htmlFor={fieldName}>
                          {title}
                          {isRequired && <RequiredBadge />}
                        </FieldLabel>
                      </Field>
                    </FieldSet>
                    {prop.description && (
                      <FieldDescription>{prop.description}</FieldDescription>
                    )}
                    <FieldError errors={[fieldState.error]} />
                  </Field>
                )}
              />
            )

          case 'radio': {
            const labelMap = uiOptions['ui:options']?.labels
            const options = (prop.enum ?? []).map((val) => ({
              value: val,
              label: labelMap?.find((l) => l.value === val)?.label ?? val,
            }))
            return (
              <Controller
                key={key}
                name={fieldName}
                control={control}
                rules={rules}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel>
                      {title}
                      {isRequired && <RequiredBadge />}
                    </FieldLabel>
                    <RadioGroup
                      value={field.value ?? ''}
                      onValueChange={field.onChange}
                      disabled={disabled}
                    >
                      {options.map((opt) => (
                        <Field key={opt.value} orientation="horizontal">
                          <RadioGroupItem
                            value={opt.value}
                            id={`${fieldName}-${opt.value}`}
                          />
                          <FieldLabel htmlFor={`${fieldName}-${opt.value}`}>
                            {opt.label}
                          </FieldLabel>
                        </Field>
                      ))}
                    </RadioGroup>
                    {prop.description && (
                      <FieldDescription>{prop.description}</FieldDescription>
                    )}
                    <FieldError errors={[fieldState.error]} />
                  </Field>
                )}
              />
            )
          }

          case 'select': {
            const labelMap = uiOptions['ui:options']?.labels
            const options = (prop.enum ?? []).map((val) => ({
              value: val,
              label: labelMap?.find((l) => l.value === val)?.label ?? val,
            }))
            return (
              <Controller
                key={key}
                name={fieldName}
                control={control}
                rules={rules}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor={fieldName}>
                      {title}
                      {isRequired && <RequiredBadge />}
                    </FieldLabel>
                    <Select
                      value={field.value ?? ''}
                      onValueChange={field.onChange}
                      disabled={disabled}
                    >
                      <SelectTrigger id={fieldName}>
                        <SelectValue
                          placeholder={placeholder ?? 'Bitte wählen...'}
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {options.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {prop.description && (
                      <FieldDescription>{prop.description}</FieldDescription>
                    )}
                    <FieldError errors={[fieldState.error]} />
                  </Field>
                )}
              />
            )
          }

          case 'textarea': {
            const rows = uiOptions['ui:options']?.rows ?? 4
            return (
              <Controller
                key={key}
                name={fieldName}
                control={control}
                rules={rules}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor={fieldName}>
                      {title}
                      {isRequired && <RequiredBadge />}
                    </FieldLabel>
                    <Textarea
                      {...field}
                      id={fieldName}
                      disabled={disabled}
                      rows={rows}
                      placeholder={placeholder}
                    />
                    {prop.description && (
                      <FieldDescription>{prop.description}</FieldDescription>
                    )}
                    <FieldError errors={[fieldState.error]} />
                  </Field>
                )}
              />
            )
          }

          case 'number':
            return (
              <Controller
                key={key}
                name={fieldName}
                control={control}
                rules={rules}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor={fieldName}>
                      {title}
                      {isRequired && <RequiredBadge />}
                    </FieldLabel>
                    <Input
                      {...field}
                      id={fieldName}
                      type="number"
                      disabled={disabled}
                      min={prop.minimum}
                      max={prop.maximum}
                      placeholder={placeholder}
                      onChange={(e) =>
                        field.onChange(
                          e.target.value === ''
                            ? undefined
                            : e.target.valueAsNumber
                        )
                      }
                    />
                    {prop.description && (
                      <FieldDescription>{prop.description}</FieldDescription>
                    )}
                    <FieldError errors={[fieldState.error]} />
                  </Field>
                )}
              />
            )

          case 'date':
            return (
              <Controller
                key={key}
                name={fieldName}
                control={control}
                rules={rules}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor={fieldName}>
                      {title}
                      {isRequired && <RequiredBadge />}
                    </FieldLabel>
                    <Input
                      {...field}
                      id={fieldName}
                      type="date"
                      disabled={disabled}
                    />
                    {prop.description && (
                      <FieldDescription>{prop.description}</FieldDescription>
                    )}
                    <FieldError errors={[fieldState.error]} />
                  </Field>
                )}
              />
            )

          case 'email':
            return (
              <Controller
                key={key}
                name={fieldName}
                control={control}
                rules={rules}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor={fieldName}>
                      {title}
                      {isRequired && <RequiredBadge />}
                    </FieldLabel>
                    <Input
                      {...field}
                      id={fieldName}
                      type="email"
                      disabled={disabled}
                      placeholder={placeholder}
                    />
                    {prop.description && (
                      <FieldDescription>{prop.description}</FieldDescription>
                    )}
                    <FieldError errors={[fieldState.error]} />
                  </Field>
                )}
              />
            )

          case 'phone':
            return (
              <Controller
                key={key}
                name={fieldName}
                control={control}
                rules={rules}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor={fieldName}>
                      {title}
                      {isRequired && <RequiredBadge />}
                    </FieldLabel>
                    <Input
                      {...field}
                      id={fieldName}
                      type="tel"
                      disabled={disabled}
                      placeholder={placeholder}
                    />
                    {prop.description && (
                      <FieldDescription>{prop.description}</FieldDescription>
                    )}
                    <FieldError errors={[fieldState.error]} />
                  </Field>
                )}
              />
            )

          case 'text':
            return (
              <Controller
                key={key}
                name={fieldName}
                control={control}
                rules={rules}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor={fieldName}>
                      {title}
                      {isRequired && <RequiredBadge />}
                    </FieldLabel>
                    <Input
                      {...field}
                      id={fieldName}
                      type="text"
                      disabled={disabled}
                      placeholder={placeholder}
                    />
                    {prop.description && (
                      <FieldDescription>{prop.description}</FieldDescription>
                    )}
                    <FieldError errors={[fieldState.error]} />
                  </Field>
                )}
              />
            )
        }
      })}
    </div>
  )
}
