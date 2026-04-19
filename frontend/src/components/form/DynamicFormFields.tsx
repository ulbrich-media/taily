import type { ReactNode } from 'react'
import { Controller, type Control, type FieldValues } from 'react-hook-form'
import { Input } from '@/shadcn/components/ui/input'
import { Textarea } from '@/shadcn/components/ui/textarea'
import { Checkbox } from '@/shadcn/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shadcn/components/ui/select'
import { Label } from '@/shadcn/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/shadcn/components/ui/radio-group'

interface JsonSchemaProperty {
  type?: string
  title?: string
  description?: string
  enum?: string[]
  enumNames?: string[]
  format?: string
  minimum?: number
  maximum?: number
}

interface JsonSchema {
  type?: string
  title?: string
  properties?: Record<string, JsonSchemaProperty>
  required?: string[]
}

interface UiSchema {
  [key: string]: {
    'ui:widget'?: string
    'ui:placeholder'?: string
    'ui:rows'?: number
  }
}

interface DynamicFormFieldsProps {
  schema: JsonSchema
  uiSchema?: UiSchema
  control: Control<FieldValues>
  disabled?: boolean
  namePrefix?: string
}

function FieldWrapper({
  fieldName,
  title,
  description,
  required,
  children,
}: {
  fieldName: string
  title: string
  description?: string
  required?: boolean
  children: ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={fieldName}>
        {title}
        {required && <span className="text-destructive ml-1">*</span>}
      </Label>
      {children}
      {description && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}
    </div>
  )
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
    if (prop.format === 'email') {
      rules.pattern = {
        value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        message: 'Bitte eine gültige E-Mail-Adresse eingeben',
      }
    } else if (prop.format === 'date') {
      rules.pattern = {
        value: /^\d{4}-\d{2}-\d{2}$/,
        message: 'Bitte ein gültiges Datum eingeben',
      }
    }
  }

  if (prop.enum && required.includes(key)) {
    rules.validate = (value: unknown) =>
      prop.enum!.includes(value as string) || 'Bitte eine Option auswählen'
  }

  return rules
}

export function DynamicFormFields({
  schema,
  uiSchema = {},
  control,
  disabled = false,
  namePrefix = 'form_data',
}: DynamicFormFieldsProps) {
  if (!schema.properties) return null

  const required = schema.required ?? []

  return (
    <div className="space-y-4">
      {Object.entries(schema.properties).map(([key, prop]) => {
        const fieldName = `${namePrefix}.${key}`
        const title = prop.title ?? key
        const uiOptions = uiSchema[key] ?? {}
        const isRequired = required.includes(key)
        const widget = uiOptions['ui:widget']

        // Determine field type
        const type = prop.type
        const format = prop.format

        // Checkbox
        const rules = buildRules(key, prop, required)

        if (type === 'boolean') {
          return (
            <div key={key} className="flex items-center space-x-2">
              <Controller
                name={fieldName}
                control={control}
                rules={rules}
                render={({ field }) => (
                  <Checkbox
                    id={fieldName}
                    checked={!!field.value}
                    onCheckedChange={field.onChange}
                    disabled={disabled}
                  />
                )}
              />
              <Label htmlFor={fieldName}>{title}</Label>
            </div>
          )
        }

        // Select / Enum
        if (type === 'string' && prop.enum) {
          const options = prop.enum.map((val, i) => ({
            value: val,
            label: prop.enumNames?.[i] ?? val,
          }))

          if (widget === 'radio') {
            return (
              <FieldWrapper
                key={key}
                fieldName={fieldName}
                title={title}
                description={prop.description}
                required={isRequired}
              >
                <Controller
                  name={fieldName}
                  control={control}
                  rules={rules}
                  render={({ field }) => (
                    <RadioGroup
                      value={field.value ?? ''}
                      onValueChange={field.onChange}
                      disabled={disabled}
                    >
                      {options.map((opt) => (
                        <div
                          key={opt.value}
                          className="flex items-center space-x-2"
                        >
                          <RadioGroupItem
                            value={opt.value}
                            id={`${fieldName}-${opt.value}`}
                          />
                          <Label htmlFor={`${fieldName}-${opt.value}`}>
                            {opt.label}
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                  )}
                />
              </FieldWrapper>
            )
          }

          return (
            <FieldWrapper
              key={key}
              fieldName={fieldName}
              title={title}
              description={prop.description}
              required={isRequired}
            >
              <Controller
                name={fieldName}
                control={control}
                rules={rules}
                render={({ field }) => (
                  <Select
                    value={field.value ?? ''}
                    onValueChange={field.onChange}
                    disabled={disabled}
                  >
                    <SelectTrigger id={fieldName}>
                      <SelectValue
                        placeholder={
                          uiOptions['ui:placeholder'] ?? 'Bitte wählen...'
                        }
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
                )}
              />
            </FieldWrapper>
          )
        }

        // Textarea
        if (type === 'string' && widget === 'textarea') {
          return (
            <FieldWrapper
              key={key}
              fieldName={fieldName}
              title={title}
              description={prop.description}
              required={isRequired}
            >
              <Controller
                name={fieldName}
                control={control}
                rules={rules}
                render={({ field }) => (
                  <Textarea
                    {...field}
                    id={fieldName}
                    disabled={disabled}
                    rows={uiOptions['ui:rows'] ?? 4}
                    placeholder={uiOptions['ui:placeholder']}
                  />
                )}
              />
            </FieldWrapper>
          )
        }

        // Number
        if (type === 'number' || type === 'integer') {
          return (
            <FieldWrapper
              key={key}
              fieldName={fieldName}
              title={title}
              description={prop.description}
              required={isRequired}
            >
              <Controller
                name={fieldName}
                control={control}
                rules={rules}
                render={({ field }) => (
                  <Input
                    {...field}
                    id={fieldName}
                    type="number"
                    disabled={disabled}
                    min={prop.minimum}
                    max={prop.maximum}
                    placeholder={uiOptions['ui:placeholder']}
                    onChange={(e) =>
                      field.onChange(
                        e.target.value === ''
                          ? undefined
                          : e.target.valueAsNumber
                      )
                    }
                  />
                )}
              />
            </FieldWrapper>
          )
        }

        // Date
        if (type === 'string' && (format === 'date' || widget === 'date')) {
          return (
            <FieldWrapper
              key={key}
              fieldName={fieldName}
              title={title}
              description={prop.description}
              required={isRequired}
            >
              <Controller
                name={fieldName}
                control={control}
                rules={rules}
                render={({ field }) => (
                  <Input
                    {...field}
                    id={fieldName}
                    type="date"
                    disabled={disabled}
                  />
                )}
              />
            </FieldWrapper>
          )
        }

        // Email
        if (type === 'string' && (format === 'email' || widget === 'email')) {
          return (
            <FieldWrapper
              key={key}
              fieldName={fieldName}
              title={title}
              description={prop.description}
              required={isRequired}
            >
              <Controller
                name={fieldName}
                control={control}
                rules={rules}
                render={({ field }) => (
                  <Input
                    {...field}
                    id={fieldName}
                    type="email"
                    disabled={disabled}
                    placeholder={uiOptions['ui:placeholder']}
                  />
                )}
              />
            </FieldWrapper>
          )
        }

        // Phone
        if (type === 'string' && (format === 'phone' || widget === 'phone')) {
          return (
            <FieldWrapper
              key={key}
              fieldName={fieldName}
              title={title}
              description={prop.description}
              required={isRequired}
            >
              <Controller
                name={fieldName}
                control={control}
                rules={rules}
                render={({ field }) => (
                  <Input
                    {...field}
                    id={fieldName}
                    type="tel"
                    disabled={disabled}
                    placeholder={uiOptions['ui:placeholder']}
                  />
                )}
              />
            </FieldWrapper>
          )
        }

        // Default: text input
        return (
          <FieldWrapper
            key={key}
            fieldName={fieldName}
            title={title}
            description={prop.description}
            required={isRequired}
          >
            <Controller
              name={fieldName}
              control={control}
              rules={rules}
              render={({ field }) => (
                <Input
                  {...field}
                  id={fieldName}
                  type="text"
                  disabled={disabled}
                  placeholder={uiOptions['ui:placeholder']}
                />
              )}
            />
          </FieldWrapper>
        )
      })}
    </div>
  )
}
