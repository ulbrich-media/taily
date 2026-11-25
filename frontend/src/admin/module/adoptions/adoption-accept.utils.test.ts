import { describe, expect, it } from 'vitest'
import { getDefaultMediatorId } from './adoption-accept.utils'

const mediators = [{ id: 'a' }, { id: 'b' }]

describe('getDefaultMediatorId', () => {
  it('pre-selects the current user when they are a mediator', () => {
    expect(getDefaultMediatorId('b', mediators, 'a')).toBe('b')
  })

  it('falls back to the adoption mediator when the user is not a mediator', () => {
    expect(getDefaultMediatorId('x', mediators, 'a')).toBe('a')
  })

  it('falls back when the user has no person', () => {
    expect(getDefaultMediatorId(null, mediators, 'a')).toBe('a')
    expect(getDefaultMediatorId(undefined, mediators, null)).toBeNull()
  })
})
