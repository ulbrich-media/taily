import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import type { TiervermittlungListing } from '@/api/types/animals'
import { AnimalTiervermittlungCard } from './AnimalTiervermittlungCard'

const listing = (
  overrides: Partial<TiervermittlungListing> = {}
): TiervermittlungListing => ({
  status: 'veroeffentlicht',
  tv_id: 2962437,
  url: 'https://www.tiervermittlung.de/cgi-bin/haustier/details.pl?IDin=2962437',
  reasons: [],
  warnings: [],
  last_error: '',
  last_sent_at: '2026-11-14T10:00:00Z',
  ...overrides,
})

describe('AnimalTiervermittlungCard', () => {
  it('links the published listing and shows the platform notices', () => {
    render(
      <AnimalTiervermittlungCard
        tiervermittlung={{
          exclusion_reasons: [],
          listing: listing({ warnings: ['Rasse nicht erkannt'] }),
        }}
      />
    )

    expect(screen.getByText('Veröffentlicht')).toBeInTheDocument()
    expect(screen.getByText('Rasse nicht erkannt')).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: /Anzeige Nr\. 2962437 öffnen/ })
    ).toHaveAttribute('href', listing().url)
  })

  it('lists why an animal is not exported', () => {
    render(
      <AnimalTiervermittlungCard
        tiervermittlung={{
          exclusion_reasons: ['Es gibt keinen Beschreibungstext.'],
          listing: null,
        }}
      />
    )

    expect(
      screen.getByText('Es gibt keinen Beschreibungstext.')
    ).toBeInTheDocument()
    expect(screen.queryByRole('link')).not.toBeInTheDocument()
  })
})
