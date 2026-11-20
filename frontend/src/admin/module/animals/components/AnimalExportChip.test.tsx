import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import type { AnimalTiervermittlungState } from '@/api/types/animals'
import { AnimalExportChip } from './AnimalExportChip'

const state = (
  overrides: Partial<AnimalTiervermittlungState> = {}
): AnimalTiervermittlungState => ({
  exclusion_reasons: [],
  blocked: false,
  intentionally_excluded: false,
  listing: {
    status: 'veroeffentlicht',
    tv_id: 1,
    url: '',
    reasons: [],
    warnings: [],
    last_error: '',
    last_sent_at: null,
  },
  ...overrides,
})

describe('AnimalExportChip', () => {
  it('shows the platform status of an exported animal', () => {
    render(
      <AnimalExportChip
        animal={{ do_publish: true, tiervermittlung: state() }}
      />
    )
    expect(
      screen.getByText('Tiervermittlung.de: Veröffentlicht')
    ).toBeInTheDocument()
  })

  it('shows platform problems such as a rejection', () => {
    render(
      <AnimalExportChip
        animal={{
          do_publish: true,
          tiervermittlung: state({
            listing: { ...state().listing!, status: 'abgelehnt' },
          }),
        }}
      />
    )
    expect(
      screen.getByText('Tiervermittlung.de: Abgelehnt')
    ).toBeInTheDocument()
  })

  it('shows blocked animals, even with an old listing', () => {
    render(
      <AnimalExportChip
        animal={{
          do_publish: true,
          tiervermittlung: state({
            blocked: true,
            exclusion_reasons: ['Es gibt kein Bild.'],
          }),
        }}
      />
    )
    expect(
      screen.getByText('Tiervermittlung.de: nicht exportiert')
    ).toBeInTheDocument()
    expect(screen.queryByRole('link')).not.toBeInTheDocument()
  })

  it('shows nothing for unpublished animals', () => {
    const { container } = render(
      <AnimalExportChip
        animal={{
          do_publish: false,
          tiervermittlung: state({ exclusion_reasons: ['x'] }),
        }}
      />
    )
    expect(container).toBeEmptyDOMElement()
  })

  it('shows nothing for animals whose listing is being removed', () => {
    const { container } = render(
      <AnimalExportChip
        animal={{
          do_publish: true,
          tiervermittlung: state({
            intentionally_excluded: true,
            exclusion_reasons: ['Das Tier ist bereits vermittelt.'],
          }),
        }}
      />
    )
    expect(container).toBeEmptyDOMElement()
  })

  it('shows nothing while the export is inactive', () => {
    const { container } = render(
      <AnimalExportChip animal={{ do_publish: true }} />
    )
    expect(container).toBeEmptyDOMElement()
  })
})
