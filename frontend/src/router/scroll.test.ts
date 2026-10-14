import { describe, expect, it } from 'vitest'
import { shouldResetScroll } from './scroll'

const page = { staticData: {} }
const dialog = { staticData: { dialog: true } }

describe('shouldResetScroll', () => {
  it('resets scroll between normal pages', () => {
    expect(shouldResetScroll([page], [page, {}])).toBe(true)
  })

  it('keeps scroll when opening a dialog', () => {
    expect(shouldResetScroll([page], [page, dialog])).toBe(false)
  })

  it('keeps scroll when closing a dialog', () => {
    expect(shouldResetScroll([page, dialog], [page])).toBe(false)
  })

  it('keeps scroll between dialogs', () => {
    expect(shouldResetScroll([page, dialog], [page, dialog])).toBe(false)
  })
})
