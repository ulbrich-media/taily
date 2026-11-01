import { describe, expect, it, vi } from 'vitest'
import { ApiValidationError } from '@/lib/api'
import { applyCustomFieldErrors } from './custom-fields.errors'

describe('applyCustomFieldErrors', () => {
  it('maps custom_fields.* errors onto the form with their first message', () => {
    const setError = vi.fn()
    const error = new ApiValidationError(
      'The given data was invalid.',
      {
        'custom_fields.id_card_number': ['Dieses Feld ist erforderlich.', 'x'],
        'custom_fields.size': ['Ungültiger Wert.'],
        name: ['Name fehlt.'],
      },
      422
    )

    expect(applyCustomFieldErrors(error, setError)).toBe(true)
    expect(setError).toHaveBeenCalledTimes(2)
    expect(setError).toHaveBeenCalledWith('custom_fields.id_card_number', {
      type: 'server',
      message: 'Dieses Feld ist erforderlich.',
    })
    expect(setError).toHaveBeenCalledWith('custom_fields.size', {
      type: 'server',
      message: 'Ungültiger Wert.',
    })
  })

  it('returns false when there is nothing to map', () => {
    const setError = vi.fn()

    expect(
      applyCustomFieldErrors(
        new ApiValidationError('x', { name: ['Name fehlt.'] }, 422),
        setError
      )
    ).toBe(false)
    expect(applyCustomFieldErrors(new Error('network'), setError)).toBe(false)
    expect(applyCustomFieldErrors(undefined, setError)).toBe(false)
    expect(setError).not.toHaveBeenCalled()
  })
})
