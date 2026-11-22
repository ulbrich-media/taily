import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import type { TiervermittlungExportStatus } from '@/admin/module/export-settings/api/types'
import { ExportStatusCard } from './ExportStatusCard'

const status = (
  overrides: Partial<TiervermittlungExportStatus> = {}
): TiervermittlungExportStatus => ({
  enabled: true,
  api_key_configured: true,
  listings: {
    veroeffentlicht: 0,
    nicht_veroeffentlicht: 0,
    doppelt: 0,
    abgelehnt: 0,
    not_delivered: 0,
  },
  last_delivery_at: null,
  attention: [],
  not_exported: [
    {
      animal_id: 'a1',
      animal_type_id: 't1',
      name: 'Bello',
      reasons: ['Es gibt kein Bild.'],
    },
  ],
  ...overrides,
})

const renderLink = (item: { animal_id: string; name: string | null }) => (
  <a href={`/animals/${item.animal_id}/status`}>{item.name}</a>
)

describe('ExportStatusCard', () => {
  it('lists approved animals that are not exported with a link', () => {
    render(<ExportStatusCard status={status()} renderAnimalLink={renderLink} />)

    expect(
      screen.getByText('Freigegeben, aber nicht exportiert')
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Bello' })).toHaveAttribute(
      'href',
      '/animals/a1/status'
    )
    expect(screen.getByText(/Es gibt kein Bild\./)).toBeInTheDocument()
  })

  it('hides the list when it is empty', () => {
    render(
      <ExportStatusCard
        status={status({ not_exported: [] })}
        renderAnimalLink={renderLink}
      />
    )

    expect(
      screen.queryByText('Freigegeben, aber nicht exportiert')
    ).not.toBeInTheDocument()
  })

  it('hides the list while the export is disabled or has no key', () => {
    const { rerender } = render(
      <ExportStatusCard
        status={status({ enabled: false })}
        renderAnimalLink={renderLink}
      />
    )
    expect(
      screen.queryByText('Freigegeben, aber nicht exportiert')
    ).not.toBeInTheDocument()

    rerender(
      <ExportStatusCard
        status={status({ api_key_configured: false })}
        renderAnimalLink={renderLink}
      />
    )
    expect(
      screen.queryByText('Freigegeben, aber nicht exportiert')
    ).not.toBeInTheDocument()
  })
})
