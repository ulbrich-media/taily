import { describe, expect, it } from 'vitest'
import type { TiervermittlungListing } from '@/api/types/animals'
import { summarizeTiervermittlung } from './tiervermittlung-status'

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

describe('summarizeTiervermittlung', () => {
  it('reports an excluded animal without listing as not exported', () => {
    expect(
      summarizeTiervermittlung({
        exclusion_reasons: ['Es gibt kein Bild.'],
        listing: null,
      }).label
    ).toBe('Nicht exportiert')
  })

  it('reports an excluded animal with a listing as being removed', () => {
    expect(
      summarizeTiervermittlung({
        exclusion_reasons: ['Das Tier ist bereits vermittelt.'],
        listing: listing(),
      }).label
    ).toBe('Wird entfernt')
  })

  it('reports an exported animal that was never sent as pending', () => {
    expect(
      summarizeTiervermittlung({ exclusion_reasons: [], listing: null }).label
    ).toBe('Wird gesendet')
  })

  it.each([
    ['veroeffentlicht', 'Veröffentlicht'],
    ['doppelt', 'Doppelt'],
    ['nicht_veroeffentlicht', 'Nicht veröffentlicht'],
    ['abgelehnt', 'Abgelehnt'],
  ])('maps the listing status %s', (status, label) => {
    expect(
      summarizeTiervermittlung({
        exclusion_reasons: [],
        listing: listing({ status }),
      }).label
    ).toBe(label)
  })

  it('reports a failed first delivery as an error', () => {
    expect(
      summarizeTiervermittlung({
        exclusion_reasons: [],
        listing: listing({ status: '', last_error: 'Wartung', url: '' }),
      }).label
    ).toBe('Fehler')
  })
})
