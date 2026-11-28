import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CataloguePreview } from './CataloguePreview'
import type {
  CatalogueField,
  CatalogueGroup,
} from '@/api/types/case-file-catalogue'

vi.stubGlobal(
  'ResizeObserver',
  class {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
)
window.HTMLElement.prototype.scrollIntoView = vi.fn()
window.HTMLElement.prototype.hasPointerCapture = vi.fn()
window.HTMLElement.prototype.releasePointerCapture = vi.fn()

function field(overrides: Partial<CatalogueField>): CatalogueField {
  return {
    id: overrides.key ?? 'id',
    key: 'key',
    label: 'Feld',
    help: '',
    type: 'text',
    options: null,
    built_in: false,
    collect_at: 'application',
    required_for: null,
    requires_review: false,
    visible_to_applicant: true,
    visible_to_inspector: true,
    condition: null,
    archived_at: null,
    ...overrides,
  }
}

const groups: CatalogueGroup[] = [
  {
    id: 'g',
    title: 'Wohnen',
    intro: '',
    fields: [
      field({ key: 'name', label: 'Name', required_for: 'application' }),
      field({
        key: 'note',
        label: 'Interne Notiz',
        visible_to_applicant: false,
      }),
      field({ key: 'garden', label: 'Garten', collect_at: 'pre_inspection' }),
    ],
  },
]

describe('CataloguePreview', () => {
  it('shows an error for an empty required field after "Prüfen"', async () => {
    const user = userEvent.setup()
    render(<CataloguePreview groups={groups} />)

    await user.click(screen.getByRole('button', { name: 'Prüfen' }))

    expect(await screen.findByText('Pflichtfeld fehlt.')).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent(
      '1 Feld ist fehlerhaft'
    )
  })

  it('reports success when everything is fine', async () => {
    const user = userEvent.setup()
    render(<CataloguePreview groups={groups} />)

    await user.type(screen.getByLabelText(/Name/), 'Anna')
    await user.click(screen.getByRole('button', { name: 'Prüfen' }))

    expect(await screen.findByText('Alles in Ordnung')).toBeInTheDocument()
  })

  it('hides internal and later fields for the applicant at the application step', () => {
    render(<CataloguePreview groups={groups} />)

    expect(screen.getByLabelText(/Name/)).toBeInTheDocument()
    expect(screen.queryByLabelText('Interne Notiz')).not.toBeInTheDocument()
    expect(screen.queryByLabelText('Garten')).not.toBeInTheDocument()
  })

  it('reveals a later-step field when the step changes', async () => {
    const user = userEvent.setup()
    render(<CataloguePreview groups={groups} />)

    await user.click(screen.getByRole('combobox', { name: 'Schritt' }))
    await user.click(
      await screen.findByRole('option', { name: 'Vorkontrolle' })
    )

    expect(await screen.findByLabelText('Garten')).toBeInTheDocument()
  })

  it('shows internal fields when the role changes to mediator', async () => {
    const user = userEvent.setup()
    render(<CataloguePreview groups={groups} />)

    await user.click(screen.getByRole('combobox', { name: 'Rolle' }))
    await user.click(
      await screen.findByRole('option', { name: 'Vermittler:in' })
    )

    expect(await screen.findByLabelText('Interne Notiz')).toBeInTheDocument()
  })
})
