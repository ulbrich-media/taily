import {
  FormFieldWrapper,
  type FormFieldWrapperProps,
} from '@/components/form/FormFieldWrapper.tsx'
import type {
  ControllerFieldState,
  FieldPath,
  FieldValues,
} from 'react-hook-form'
import { useState } from 'react'
import { format } from 'date-fns'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/shadcn/components/ui/popover.tsx'
import { CalendarIcon, XIcon } from 'lucide-react'
import { Calendar } from '@/shadcn/components/ui/calendar.tsx'
import { ButtonGroup } from '@/shadcn/components/ui/button-group.tsx'
import { Input } from '@/shadcn/components/ui/input.tsx'
import { Button } from '@/shadcn/components/ui/button.tsx'
import { parseGermanDate } from '@/components/field/DateInput.utils.ts'

export type DateInputProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
  TTransformedValues = TFieldValues,
> = Omit<
  FormFieldWrapperProps<TFieldValues, TName, TTransformedValues>,
  'render'
>

interface DatePickerControlProps {
  field: {
    name: string
    value: string | null
    onChange: (value: string | null) => void
  }
  fieldState: ControllerFieldState
}

export function DatePickerControl({
  field,
  fieldState,
}: DatePickerControlProps) {
  const [open, setOpen] = useState(false)
  const [date, setDate] = useState<Date | undefined>(() =>
    field.value ? parseGermanDate(field.value) : undefined
  )
  const [month, setMonth] = useState<Date | undefined>(date)

  return (
    <ButtonGroup>
      <Input
        id={field.name}
        value={field.value ?? ''}
        placeholder="TT.MM.YYYY"
        aria-invalid={fieldState.invalid}
        autoComplete="off"
        onChange={(e) => {
          const raw = e.target.value
          field.onChange(raw || null)
          const parsed = parseGermanDate(raw)
          if (parsed) {
            setDate(parsed)
            setMonth(parsed)
          }
        }}
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown') {
            e.preventDefault()
            setOpen(true)
          }
        }}
      />
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            size="icon"
            aria-label="Datum auswählen"
          >
            <CalendarIcon />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-auto overflow-hidden p-0"
          align="end"
          alignOffset={-8}
          sideOffset={10}
        >
          <Calendar
            mode="single"
            captionLayout="dropdown"
            selected={date}
            month={month}
            onMonthChange={setMonth}
            onSelect={(selected) => {
              setDate(selected)
              setOpen(false)
              field.onChange(selected ? format(selected, 'dd.MM.yyyy') : null)
            }}
          />
        </PopoverContent>
      </Popover>
      <Button
        type="button"
        variant="outline"
        size="icon"
        aria-label="Datum entfernen"
        disabled={!field.value}
        onClick={() => {
          setDate(undefined)
          setOpen(false)
          field.onChange(null)
        }}
      >
        <XIcon />
      </Button>
    </ButtonGroup>
  )
}

export function DateInput<
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
  TTransformedValues = TFieldValues,
>(props: DateInputProps<TFieldValues, TName, TTransformedValues>) {
  return (
    <FormFieldWrapper
      {...props}
      render={({ field, fieldState }) => (
        <DatePickerControl field={field} fieldState={fieldState} />
      )}
    />
  )
}
