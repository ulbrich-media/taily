import { describe, expect, it } from 'vitest'
import { applyListChange, nextSort, sortDirectionOf } from './list-search'

describe('applyListChange', () => {
  it('resets the page when a filter changes', () => {
    const next = applyListChange({ page: 4, search: '' }, { search: 'müller' })
    expect(next).toEqual({ page: 1, search: 'müller' })
  })

  it('keeps the page that is part of the patch', () => {
    const next = applyListChange({ page: 1, search: 'a' }, { page: 3 })
    expect(next).toEqual({ page: 3, search: 'a' })
  })
})

describe('sorting', () => {
  it('reads the direction of a key', () => {
    expect(sortDirectionOf('animal_name', 'animal_name')).toBe('asc')
    expect(sortDirectionOf('-animal_name', 'animal_name')).toBe('desc')
    expect(sortDirectionOf('-created_at', 'animal_name')).toBeNull()
  })

  it('starts with the first direction and then toggles', () => {
    expect(nextSort('-created_at', 'animal_name')).toBe('animal_name')
    expect(nextSort('-created_at', 'updated_at', 'desc')).toBe('-updated_at')
    expect(nextSort('animal_name', 'animal_name')).toBe('-animal_name')
    expect(nextSort('-animal_name', 'animal_name')).toBe('animal_name')
  })
})
