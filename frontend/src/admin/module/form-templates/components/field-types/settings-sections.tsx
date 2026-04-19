import {
  useFieldArray,
  Controller,
  type Control,
  type FieldValues,
} from 'react-hook-form'
import { Plus, Trash2 } from 'lucide-react'
import { Button } from '@/shadcn/components/ui/button'
import { Input } from '@/shadcn/components/ui/input'
import { Separator } from '@/shadcn/components/ui/separator'
import { TextInput } from '@/components/field/TextInput'
import { NumberField } from '../shared/NumberField'

interface SettingsSectionProps {
  control: Control<FieldValues>
}

// --- Text ---

export function TextSettingsSection({ control }: SettingsSectionProps) {
  return (
    <>
      <Separator />
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
        Texteinstellungen
      </p>
      <TextInput name="placeholder" control={control} label="Platzhaltertext" />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <NumberField
          control={control}
          name="minLength"
          label="Min. Zeichen"
          min={0}
        />
        <NumberField
          control={control}
          name="maxLength"
          label="Max. Zeichen"
          min={0}
        />
      </div>
    </>
  )
}

// --- Textarea ---

export function TextareaSettingsSection({ control }: SettingsSectionProps) {
  return (
    <>
      <Separator />
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
        Textbereich-Einstellungen
      </p>
      <TextInput name="placeholder" control={control} label="Platzhaltertext" />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <NumberField
          control={control}
          name="minLength"
          label="Min. Zeichen"
          min={0}
        />
        <NumberField
          control={control}
          name="maxLength"
          label="Max. Zeichen"
          min={0}
        />
        <NumberField control={control} name="rows" label="Zeilen" min={1} />
      </div>
    </>
  )
}

// --- Number ---

export function NumberSettingsSection({ control }: SettingsSectionProps) {
  return (
    <>
      <Separator />
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
        Zahleneinstellungen
      </p>
      <TextInput name="placeholder" control={control} label="Platzhaltertext" />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <NumberField control={control} name="min" label="Minimum" />
        <NumberField control={control} name="max" label="Maximum" />
        <NumberField
          control={control}
          name="step"
          label="Schrittweite"
          min={0}
        />
      </div>
    </>
  )
}

// --- Date ---

export function DateSettingsSection({ control }: SettingsSectionProps) {
  return (
    <>
      <Separator />
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
        Datumseinstellungen
      </p>
      <TextInput name="placeholder" control={control} label="Platzhaltertext" />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <TextInput
          name="minDate"
          control={control}
          label="Frühestes Datum"
          description="Format: JJJJ-MM-TT"
        />
        <TextInput
          name="maxDate"
          control={control}
          label="Spätestes Datum"
          description="Format: JJJJ-MM-TT"
        />
      </div>
    </>
  )
}

// --- Email ---

export function EmailSettingsSection({ control }: SettingsSectionProps) {
  return (
    <>
      <Separator />
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
        E-Mail-Einstellungen
      </p>
      <TextInput name="placeholder" control={control} label="Platzhaltertext" />
    </>
  )
}

// --- Phone ---

export function PhoneSettingsSection({ control }: SettingsSectionProps) {
  return (
    <>
      <Separator />
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
        Telefon-Einstellungen
      </p>
      <TextInput name="placeholder" control={control} label="Platzhaltertext" />
    </>
  )
}

// --- Select ---

function OptionRow({
  index,
  control,
  onRemove,
}: {
  index: number
  control: Control<FieldValues>
  onRemove: () => void
}) {
  return (
    <div className="flex items-start gap-2">
      <Controller
        name={`options.${index}.label`}
        control={control}
        render={({ field, fieldState }) => (
          <div className="flex flex-col gap-1 flex-1">
            <Input
              {...field}
              placeholder="Bezeichnung"
              aria-invalid={fieldState.invalid}
            />
            {fieldState.error && (
              <p className="text-destructive text-xs">
                {fieldState.error.message}
              </p>
            )}
          </div>
        )}
      />
      <Controller
        name={`options.${index}.value`}
        control={control}
        render={({ field, fieldState }) => (
          <div className="flex flex-col gap-1 w-28">
            <Input
              {...field}
              placeholder="Wert"
              className="font-mono text-xs"
              aria-invalid={fieldState.invalid}
            />
            {fieldState.error && (
              <p className="text-destructive text-xs">
                {fieldState.error.message}
              </p>
            )}
          </div>
        )}
      />
      <Button
        type="button"
        size="sm"
        variant="ghost"
        className="h-9 w-9 p-0 mt-0 text-muted-foreground hover:text-destructive shrink-0"
        onClick={onRemove}
      >
        <Trash2 className="size-3.5" />
      </Button>
    </div>
  )
}

export function SelectSettingsSection({ control }: SettingsSectionProps) {
  const { fields, append, remove } = useFieldArray({ control, name: 'options' })

  return (
    <>
      <Separator />
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
        Auswahl-Einstellungen
      </p>
      <TextInput
        name="placeholder"
        control={control}
        label="Platzhaltertext"
        description="Wird angezeigt wenn nichts ausgewählt ist"
      />
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Optionen
        </p>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="h-7 text-xs gap-1"
          onClick={() => append({ label: '', value: '' })}
        >
          <Plus className="size-3" />
          Option
        </Button>
      </div>

      {fields.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-2">
          Noch keine Optionen. Füge eine Option hinzu.
        </p>
      )}

      <div className="flex flex-col gap-2 max-h-52 overflow-y-auto pr-1">
        {fields.map((item, i) => (
          <OptionRow
            key={item.id}
            index={i}
            control={control}
            onRemove={() => remove(i)}
          />
        ))}
      </div>

      {fields.length > 0 && (
        <p className="text-xs text-muted-foreground">
          Wert wird als interner Schlüssel verwendet.
        </p>
      )}
    </>
  )
}

// --- Radio ---

export function RadioSettingsSection({ control }: SettingsSectionProps) {
  const { fields, append, remove } = useFieldArray({ control, name: 'options' })

  return (
    <>
      <Separator />
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Optionen
        </p>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="h-7 text-xs gap-1"
          onClick={() => append({ label: '', value: '' })}
        >
          <Plus className="size-3" />
          Option
        </Button>
      </div>

      {fields.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-2">
          Noch keine Optionen. Füge eine Option hinzu.
        </p>
      )}

      <div className="flex flex-col gap-2 max-h-52 overflow-y-auto pr-1">
        {fields.map((item, i) => (
          <OptionRow
            key={item.id}
            index={i}
            control={control}
            onRemove={() => remove(i)}
          />
        ))}
      </div>

      {fields.length > 0 && (
        <p className="text-xs text-muted-foreground">
          Wert wird als interner Schlüssel verwendet.
        </p>
      )}
    </>
  )
}
