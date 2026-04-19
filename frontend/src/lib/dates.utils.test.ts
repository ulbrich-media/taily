import { describe, it, expect } from 'vitest'
import { formatApiDate, formatApiDateTime } from './dates.utils'

describe('formatApiDate', () => {
  it('returns empty string for null input', () => {
    expect(formatApiDate(null)).toBe('')
  })

  it('formats a valid ISO date string as German date', () => {
    const result = formatApiDate('2024-03-15T10:30:00.000Z')
    // German locale formats as DD.MM.YYYY
    expect(result).toMatch(/\d{2}\.\d{2}\.\d{4}/)
    expect(result).toContain('2024')
  })
})

describe('formatApiDateTime', () => {
  it('returns fallback for null input', () => {
    expect(formatApiDateTime(null)).toBe('')
    expect(formatApiDateTime(null, 'n/a')).toBe('n/a')
  })

  it('formats a valid ISO datetime string as German datetime', () => {
    const result = formatApiDateTime('2024-03-15T10:30:00.000Z')
    // German locale formats as DD.MM.YYYY, HH:MM
    expect(result).toMatch(/\d{2}\.\d{2}\.\d{4}/)
    expect(result).toContain('2024')
  })
})
