import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { CompatibleWithMapping } from '@/admin/module/export-settings/api/types'
import { CompatibilityMappingForm } from './CompatibilityMappingForm'

const value: CompatibleWithMapping = {
  children: ['Kinder'],
  dogs: ['Hunde', 'Rüden'],
  cats: ['Katzen'],
}

describe('CompatibilityMappingForm', () => {
  it('adds a word and submits the mapping', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    render(<CompatibilityMappingForm value={value} onSubmit={onSubmit} />)

    await user.type(screen.getByLabelText('Neues Wort für Katzen'), 'Kater')
    await user.click(
      screen.getByRole('button', { name: 'Wort für Katzen hinzufügen' })
    )
    await user.click(screen.getByRole('button', { name: 'Speichern' }))

    expect(onSubmit).toHaveBeenCalledWith({
      ...value,
      cats: ['Katzen', 'Kater'],
    })
  })

  it('removes a word', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    render(<CompatibilityMappingForm value={value} onSubmit={onSubmit} />)

    await user.click(screen.getByRole('button', { name: 'Rüden entfernen' }))
    await user.click(screen.getByRole('button', { name: 'Speichern' }))

    expect(onSubmit).toHaveBeenCalledWith({ ...value, dogs: ['Hunde'] })
  })

  it('rejects empty words and case-insensitive duplicates', async () => {
    const user = userEvent.setup()
    render(<CompatibilityMappingForm value={value} onSubmit={vi.fn()} />)

    await user.click(
      screen.getByRole('button', { name: 'Wort für Kinder hinzufügen' })
    )
    expect(screen.getByRole('alert')).toHaveTextContent('Bitte gib ein Wort')

    await user.type(screen.getByLabelText('Neues Wort für Kinder'), ' kinder ')
    await user.click(
      screen.getByRole('button', { name: 'Wort für Kinder hinzufügen' })
    )
    expect(screen.getByRole('alert')).toHaveTextContent('bereits in der Liste')
    expect(screen.getAllByText('Kinder').length).toBeGreaterThan(0)
    expect(screen.queryByText('kinder')).not.toBeInTheDocument()
  })

  it('is read-only for non-admins', () => {
    render(
      <CompatibilityMappingForm value={value} readOnly onSubmit={vi.fn()} />
    )

    expect(screen.getByText('Rüden')).toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'Speichern' })
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'Rüden entfernen' })
    ).not.toBeInTheDocument()
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
  })
})
