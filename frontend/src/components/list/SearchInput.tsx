import { useState } from 'react'
import { Search } from 'lucide-react'
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from '@/shadcn/components/ui/input-group'
import { cn } from '@/shadcn/lib/utils'

interface SearchInputProps {
  /** The applied search term (from the URL). */
  value: string
  /** Called when the user submits the search, with the typed term. */
  onSearch: (value: string) => void
  placeholder?: string
  label: string
  className?: string
}

/**
 * Search field with an explicit search button. The term is applied on
 * submit (button or Enter), not while typing, so the URL and the request
 * only change on purpose. Clearing the field applies immediately.
 */
export function SearchInput({
  value,
  onSearch,
  placeholder,
  label,
  className,
}: SearchInputProps) {
  const [text, setText] = useState(value)

  // Follow external changes (reset, back button): when the applied term
  // changes, drop what was typed and show it.
  const [appliedValue, setAppliedValue] = useState(value)
  if (value !== appliedValue) {
    setAppliedValue(value)
    setText(value)
  }

  const submit = () => {
    if (text !== value) onSearch(text)
  }

  return (
    <InputGroup className={cn('h-8', className)}>
      <InputGroupInput
        type="search"
        aria-label={label}
        placeholder={placeholder}
        value={text}
        onChange={(event) => {
          const next = event.target.value
          setText(next)
          // Emptying the field (the browser's clear button, or deleting the
          // text) clears the search right away instead of waiting for submit.
          if (next === '' && value !== '') onSearch('')
        }}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            event.preventDefault()
            submit()
          }
        }}
      />
      <InputGroupAddon align="inline-end">
        <InputGroupButton aria-label="Suchen" size="icon-xs" onClick={submit}>
          <Search />
        </InputGroupButton>
      </InputGroupAddon>
    </InputGroup>
  )
}
