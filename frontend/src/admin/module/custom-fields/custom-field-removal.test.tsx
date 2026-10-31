import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { ApiValidationError } from '@/lib/api'
import type { CustomFieldRemovalImpact } from '@/api/types/custom-fields'
import {
  describeInvalidValues,
  CustomFieldRemovalCancelledError,
  getRemovalImpact,
  runWithRemovalConfirm,
} from './custom-field-removal'
import { useCustomFieldRemovalConfirm } from './useCustomFieldRemovalConfirm'

const impact: CustomFieldRemovalImpact[] = [
  { key: 'id_card_number', label: 'Ausweisnummer', option: null, count: 14 },
  { key: 'expected_size', label: 'Erwartete Größe', option: 'large', count: 1 },
]

function conflict() {
  return new ApiValidationError('Werte würden gelöscht', undefined, 409, {
    message: 'Werte würden gelöscht',
    removal_impact: impact,
  })
}

describe('getRemovalImpact', () => {
  it('reads the impact of a 409 answer only', () => {
    expect(getRemovalImpact(conflict())).toEqual(impact)
    expect(
      getRemovalImpact(
        new ApiValidationError('x', {}, 422, { removal_impact: impact })
      )
    ).toBeNull()
    expect(getRemovalImpact(new Error('x'))).toBeNull()
  })
})

describe('runWithRemovalConfirm', () => {
  it('sends once without the flag when nothing would be removed', async () => {
    const request = vi.fn().mockResolvedValue('ok')
    const confirm = vi.fn()

    await expect(runWithRemovalConfirm(request, confirm)).resolves.toBe('ok')
    expect(request).toHaveBeenCalledTimes(1)
    expect(request).toHaveBeenCalledWith(false)
    expect(confirm).not.toHaveBeenCalled()
  })

  it('asks on 409 and resends with the flag after confirmation', async () => {
    const request = vi
      .fn()
      .mockRejectedValueOnce(conflict())
      .mockResolvedValueOnce('deleted')
    const confirm = vi.fn().mockResolvedValue(true)

    await expect(runWithRemovalConfirm(request, confirm)).resolves.toBe(
      'deleted'
    )
    expect(confirm).toHaveBeenCalledWith(impact)
    expect(request.mock.calls).toEqual([[false], [true]])
  })

  it('rejects with a cancel error and does not resend when declined', async () => {
    const request = vi.fn().mockRejectedValueOnce(conflict())
    const confirm = vi.fn().mockResolvedValue(false)

    await expect(
      runWithRemovalConfirm(request, confirm)
    ).rejects.toBeInstanceOf(CustomFieldRemovalCancelledError)
    expect(request).toHaveBeenCalledTimes(1)
  })

  it('rethrows other errors without asking', async () => {
    const error = new ApiValidationError('invalid', { name: ['x'] }, 422)
    const request = vi.fn().mockRejectedValue(error)
    const confirm = vi.fn()

    await expect(runWithRemovalConfirm(request, confirm)).rejects.toBe(error)
    expect(confirm).not.toHaveBeenCalled()
  })
})

function Harness({
  request,
}: {
  request: (confirm: boolean) => Promise<string>
}) {
  const removal = useCustomFieldRemovalConfirm()
  const [result, setResult] = useState('')
  return (
    <>
      <button
        onClick={() =>
          removal
            .run(request)
            .then(setResult)
            .catch((e: Error) => setResult(e.name))
        }
      >
        Speichern
      </button>
      <output>{result}</output>
      {removal.dialog}
    </>
  )
}

describe('useCustomFieldRemovalConfirm', () => {
  it('shows the impact and resends with the flag on confirm', async () => {
    const user = userEvent.setup()
    const request = vi
      .fn()
      .mockRejectedValueOnce(conflict())
      .mockResolvedValueOnce('gespeichert')
    render(<Harness request={request} />)

    await user.click(screen.getByRole('button', { name: 'Speichern' }))

    expect(
      await screen.findByText('Ausweisnummer wird bei 14 Einträgen gelöscht.')
    ).toBeInTheDocument()
    expect(
      screen.getByText(
        'Erwartete Größe: Wert „large“ wird bei einem Eintrag gelöscht.'
      )
    ).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Ja, Werte löschen' }))

    expect(await screen.findByText('gespeichert')).toBeInTheDocument()
    expect(request.mock.calls).toEqual([[false], [true]])
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
  })

  it('cancels without resending', async () => {
    const user = userEvent.setup()
    const request = vi.fn().mockRejectedValueOnce(conflict())
    render(<Harness request={request} />)

    await user.click(screen.getByRole('button', { name: 'Speichern' }))
    await user.click(await screen.findByRole('button', { name: 'Abbrechen' }))

    expect(
      await screen.findByText('CustomFieldRemovalCancelledError')
    ).toBeInTheDocument()
    expect(request).toHaveBeenCalledTimes(1)
  })
})

describe('describeInvalidValues', () => {
  it('names the field and the number of records', () => {
    expect(
      describeInvalidValues({ key: 'coat', label: 'Fell', count: 3 })
    ).toBe('Fell: 3 Einträge haben Werte, die nicht mehr gültig sind.')
    expect(
      describeInvalidValues({ key: 'coat', label: 'Fell', count: 1 })
    ).toBe('Fell: Ein Eintrag hat einen Wert, der nicht mehr gültig ist.')
  })
})
