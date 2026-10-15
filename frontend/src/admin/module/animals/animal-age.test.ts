import { describe, expect, it } from 'vitest'
import { formatAnimalAge } from './animal-age'

const now = new Date(2026, 5, 15)

describe('formatAnimalAge', () => {
  it('returns a dash without a birth date', () => {
    expect(formatAnimalAge(null, now)).toBe('-')
    expect(formatAnimalAge('garbage', now)).toBe('-')
  })

  it('counts months below one year', () => {
    expect(formatAnimalAge('2026-05-10', now)).toBe('1 Monat')
    expect(formatAnimalAge('2026-01-01', now)).toBe('5 Monate')
  })

  it('counts full years', () => {
    expect(formatAnimalAge('2025-06-16', now)).toBe('11 Monate')
    expect(formatAnimalAge('2025-06-15', now)).toBe('1 Jahr')
    expect(formatAnimalAge('2020-01-01', now)).toBe('6 Jahre')
  })

  it('ignores birth dates in the future', () => {
    expect(formatAnimalAge('2027-01-01', now)).toBe('-')
  })
})
