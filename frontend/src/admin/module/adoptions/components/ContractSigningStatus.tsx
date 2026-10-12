import { CheckCircle2, Circle, Clock, XCircle } from 'lucide-react'
import type {
  ContractSignerRole,
  ContractSigningProcess,
  ContractSigningProcessSigner,
} from '@/api/types/adoptions'
import { formatApiDateTime } from '@/lib/dates.utils.ts'
import { cn } from '@/shadcn/lib/utils'
import {
  describeExpiry,
  getSignerState,
  isExpiryUrgent,
  type SignerState,
} from '@/admin/module/adoptions/contract.utils.ts'

const SIGNER_ROLE_LABELS: Record<ContractSignerRole, string> = {
  mediator: 'Vermittler:in',
  adopter: 'Adoptant:in',
}

const SIGNER_ICONS: Record<SignerState, typeof Circle> = {
  signed: CheckCircle2,
  pending: Clock,
  expired: XCircle,
  cancelled: XCircle,
  queued: Circle,
}

const SIGNER_ICON_CLASSES: Record<SignerState, string> = {
  signed: 'text-green-600',
  pending: 'text-blumine-700',
  expired: 'text-red-600',
  cancelled: 'text-muted-foreground',
  queued: 'text-muted-foreground',
}

interface SignerRowProps {
  process: ContractSigningProcess
  signer: ContractSigningProcessSigner
}

function SignerRow({ process, signer }: SignerRowProps) {
  const state = getSignerState(process, signer)
  const Icon = SIGNER_ICONS[state]
  const processEnded =
    process.status !== 'awaiting_mediator_signature' &&
    process.status !== 'awaiting_adopter_signature'

  const details: { text: string; urgent?: boolean }[] = []

  switch (state) {
    case 'signed':
      details.push({
        text: `Unterschrieben am ${formatApiDateTime(signer.signed_at)}`,
      })
      break
    case 'pending':
      details.push({ text: 'Wartet auf Unterschrift' })
      if (signer.invited_at) {
        details.push({
          text: `Einladung gesendet am ${formatApiDateTime(signer.invited_at)}`,
        })
      } else {
        details.push({ text: 'Einladung wurde nicht versendet', urgent: true })
      }
      if (signer.expires_at) {
        details.push({
          text: `${describeExpiry(signer.expires_at)} (${formatApiDateTime(signer.expires_at)})`,
          urgent: isExpiryUrgent(signer.expires_at),
        })
      }
      break
    case 'expired':
      details.push({
        text: `Link abgelaufen${
          process.terminated_at
            ? ` am ${formatApiDateTime(process.terminated_at)}`
            : ''
        }`,
        urgent: true,
      })
      break
    case 'cancelled':
      details.push({
        text: `Vorgang abgebrochen${
          process.terminated_at
            ? ` am ${formatApiDateTime(process.terminated_at)}`
            : ''
        }`,
      })
      break
    case 'queued':
      details.push({
        text: processEnded
          ? 'Nicht eingeladen'
          : 'Wird nach der vorherigen Unterschrift eingeladen',
      })
      break
  }

  return (
    <li className="flex items-start gap-3">
      <Icon
        className={cn('mt-0.5 size-4 shrink-0', SIGNER_ICON_CLASSES[state])}
      />
      <div className="min-w-0 space-y-0.5 text-sm">
        <p className="font-medium">
          {SIGNER_ROLE_LABELS[signer.role]}
          {signer.full_name ? ` – ${signer.full_name}` : ''}
        </p>
        {details.map((detail) => (
          <p
            key={detail.text}
            className={cn(
              'text-muted-foreground',
              detail.urgent && 'text-red-700 dark:text-red-400'
            )}
          >
            {detail.text}
          </p>
        ))}
      </div>
    </li>
  )
}

interface ContractSigningStatusProps {
  process: ContractSigningProcess
}

/**
 * Both signers with their current state, timestamps and remaining time.
 * Which signer is up next is derived from the signatures, not the status.
 */
export function ContractSigningStatus({ process }: ContractSigningStatusProps) {
  return (
    <ol
      aria-label="Fortschritt der Unterschriften"
      className="space-y-3 rounded-md border p-3"
    >
      {process.signers.map((signer) => (
        <SignerRow key={signer.role} process={process} signer={signer} />
      ))}
    </ol>
  )
}
