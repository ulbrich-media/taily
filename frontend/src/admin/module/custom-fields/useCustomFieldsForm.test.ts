import { describe, expect, it } from 'vitest'
import { renderHook } from '@testing-library/react'
import { z } from 'zod'
import { useCustomFieldResolver } from './useCustomFieldsForm'
import { makeGroup } from './custom-fields.fixtures'

const staticSchema = z.object({ name: z.string().min(1) })
const groups = [makeGroup()]
const options = { fields: {}, shouldUseNativeValidation: false } as never

describe('useCustomFieldResolver', () => {
  it('validates every custom field on create forms', async () => {
    const { result } = renderHook(() =>
      useCustomFieldResolver(staticSchema, groups)
    )

    const { errors } = await result.current(
      { name: 'Bello', custom_fields: { coat_notes: 'kurz' } },
      undefined,
      options
    )

    expect(errors).toHaveProperty('custom_fields.expected_size')
  })

  it('does not demand required fields of unchanged groups on edit forms', async () => {
    const stored = { coat_notes: 'kurz' }
    const { result } = renderHook(() =>
      useCustomFieldResolver(staticSchema, groups, stored)
    )

    const unchanged = await result.current(
      { name: 'Rex', custom_fields: { expected_size: undefined, coat_notes: 'kurz' } },
      undefined,
      options
    )
    expect(unchanged.errors).toEqual({})

    const changed = await result.current(
      { name: 'Rex', custom_fields: { expected_size: undefined, coat_notes: 'lang' } },
      undefined,
      options
    )
    expect(changed.errors).toHaveProperty('custom_fields.expected_size')
  })

  it('still validates the static fields on edit forms', async () => {
    const { result } = renderHook(() =>
      useCustomFieldResolver(staticSchema, groups, {})
    )

    const { errors } = await result.current(
      { name: '', custom_fields: {} },
      undefined,
      options
    )

    expect(errors).toHaveProperty('name')
  })
})
