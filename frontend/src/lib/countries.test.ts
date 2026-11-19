import { describe, expect, it } from 'vitest'
import { COUNTRY_OPTIONS, countryName } from './countries'

describe('countries', () => {
  it('names countries in German', () => {
    expect(countryName('RO')).toBe('Rumänien')
    expect(countryName('GR')).toBe('Griechenland')
  })

  it('lists Germany first and the rest alphabetically', () => {
    expect(COUNTRY_OPTIONS[0]).toEqual({ value: 'DE', label: 'Deutschland' })

    const rest = COUNTRY_OPTIONS.slice(1).map((option) => option.label)
    expect(rest).toEqual([...rest].sort((a, b) => a.localeCompare(b, 'de')))
  })

  it('only offers two-letter codes, each once', () => {
    const codes = COUNTRY_OPTIONS.map((option) => option.value)

    expect(codes.every((code) => /^[A-Z]{2}$/.test(code))).toBe(true)
    expect(new Set(codes).size).toBe(codes.length)
  })
})
