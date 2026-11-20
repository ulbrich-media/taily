import type {
  AnimalTiervermittlungState,
  TiervermittlungListing,
} from '@/api/types/animals'

type BadgeVariant = 'success' | 'warning' | 'error' | 'info' | 'outline'

export interface ExportSummary {
  label: string
  variant: BadgeVariant
  description: string
}

/**
 * The sidebar chip only tells whether the export works or somebody has to
 * act: no chip for unapproved animals, while the export is inactive (no
 * `tiervermittlung` block) or while the listing is simply being removed.
 */
export function hasExportChip(animal: {
  do_publish: boolean
  tiervermittlung?: AnimalTiervermittlungState
}): boolean {
  return (
    !!animal.tiervermittlung &&
    animal.do_publish &&
    !animal.tiervermittlung.intentionally_excluded
  )
}

export function summarizeTiervermittlung({
  exclusion_reasons,
  listing,
}: Pick<
  AnimalTiervermittlungState,
  'exclusion_reasons' | 'listing'
>): ExportSummary {
  if (exclusion_reasons.length > 0) {
    return listing
      ? {
          label: 'Wird entfernt',
          variant: 'warning',
          description:
            'Das Tier wird nicht mehr exportiert. Die Anzeige wird beim nächsten Lauf entfernt.',
        }
      : {
          label: 'Nicht exportiert',
          variant: 'outline',
          description: 'Das Tier wird nicht an Tiervermittlung.de gesendet.',
        }
  }

  if (!listing || (listing.status === '' && listing.last_error === '')) {
    return {
      label: 'Wird gesendet',
      variant: 'info',
      description: 'Das Tier wird beim nächsten Lauf gesendet.',
    }
  }

  return summarizeListing(listing)
}

function summarizeListing(listing: TiervermittlungListing): ExportSummary {
  switch (listing.status) {
    case 'veroeffentlicht':
      // The platform keeps showing the last version it accepted.
      if (listing.last_error !== '') {
        return {
          label: 'Veröffentlicht',
          variant: 'warning',
          description:
            'Die Anzeige ist online, die letzte Übertragung ist aber fehlgeschlagen. Sie zeigt weiter den zuletzt übertragenen Stand.',
        }
      }
      return {
        label: 'Veröffentlicht',
        variant: 'success',
        description: 'Die Anzeige ist auf Tiervermittlung.de online.',
      }
    case 'doppelt':
      return {
        label: 'Doppelt',
        variant: 'warning',
        description:
          'Für dieses Tier gibt es bereits eine von Hand angelegte Anzeige. Sie bleibt bestehen; damit die exportierte Anzeige erscheint, muss sie auf Tiervermittlung.de gelöscht werden.',
      }
    case 'nicht_veroeffentlicht':
      return {
        label: 'Nicht veröffentlicht',
        variant: 'warning',
        description:
          'Tiervermittlung.de hat das Tier angenommen, aber nicht veröffentlicht.',
      }
    case 'abgelehnt':
      return {
        label: 'Abgelehnt',
        variant: 'error',
        description:
          'Tiervermittlung.de hat die Daten abgelehnt. Nach einer Änderung am Tier wird es erneut gesendet.',
      }
    default:
      return {
        label: 'Fehler',
        variant: 'error',
        description:
          'Das Senden ist fehlgeschlagen und wird beim nächsten Lauf wiederholt.',
      }
  }
}
