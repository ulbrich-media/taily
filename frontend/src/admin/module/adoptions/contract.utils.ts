import { differenceInCalendarDays } from 'date-fns'
import type {
  AdoptionDetailResource,
  ContractSigningProcess,
  ContractSigningProcessSigner,
} from '@/api/types/adoptions'

/**
 * Which state the contract card is in:
 * - `signing`: a native signing process is waiting for a signature
 * - `digital`: the native flow completed (locked against manual edits)
 * - `manual`: confirmed by hand, freely editable
 * - `open`: nothing signed yet (possibly after a cancelled/expired process)
 */
export type ContractView = 'signing' | 'digital' | 'manual' | 'open'

export function getContractView(
  adoption: Pick<
    AdoptionDetailResource,
    'contract_signed' | 'contract_source' | 'contract_signing_process'
  >
): ContractView {
  const status = adoption.contract_signing_process?.status

  if (
    status === 'awaiting_mediator_signature' ||
    status === 'awaiting_adopter_signature'
  ) {
    return 'signing'
  }
  if (adoption.contract_source === 'digital') return 'digital'
  if (adoption.contract_signed) return 'manual'
  return 'open'
}

export type SignerState =
  'signed' | 'pending' | 'expired' | 'cancelled' | 'queued'

/**
 * A signer is `pending` (or `expired`/`cancelled` once the process ended)
 * when they are the first one without a signature; anyone after them has not
 * been reached yet and is `queued`.
 */
export function getSignerState(
  process: ContractSigningProcess,
  signer: ContractSigningProcessSigner
): SignerState {
  if (signer.signed_at) return 'signed'

  const firstUnsigned = process.signers.find((s) => !s.signed_at)
  if (firstUnsigned?.role !== signer.role) return 'queued'

  if (process.status === 'expired') return 'expired'
  if (process.status === 'cancelled') return 'cancelled'
  return 'pending'
}

export function describeExpiry(expiresAt: string, now: Date = new Date()) {
  const days = differenceInCalendarDays(new Date(expiresAt), now)

  if (new Date(expiresAt) <= now) return 'Link abgelaufen'
  if (days <= 0) return 'läuft heute ab'
  if (days === 1) return 'läuft morgen ab'
  return `läuft in ${days} Tagen ab`
}

/** An invite is urgent when its link expires within two days. */
export function isExpiryUrgent(expiresAt: string, now: Date = new Date()) {
  return differenceInCalendarDays(new Date(expiresAt), now) <= 2
}
