import { CheckCircle2, Circle } from 'lucide-react'
import { format } from 'date-fns'
import type {
  ContractSignerRole,
  ContractSigningProcess,
  ContractSigningStatus as ContractSigningStatusType,
} from '@/api/types/adoptions'
import { Badge } from '@/shadcn/components/ui/badge.tsx'

const SIGNING_STATUS_LABELS: Record<ContractSigningStatusType, string> = {
  awaiting_mediator_signature: 'Wartet auf Unterschrift des Vermittlers',
  awaiting_adopter_signature: 'Wartet auf Unterschrift des Adoptanten',
  completed: 'Abgeschlossen',
  cancelled: 'Abgebrochen',
  expired: 'Abgelaufen',
}

const SIGNER_ROLE_LABELS: Record<ContractSignerRole, string> = {
  mediator: 'Vermittler:in',
  adopter: 'Adoptant:in',
}

interface ContractSigningStatusProps {
  process: ContractSigningProcess
}

export function ContractSigningStatus({ process }: ContractSigningStatusProps) {
  return (
    <div className="space-y-2 rounded-md border p-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">Signaturvorgang</p>
        <Badge variant="secondary">
          {SIGNING_STATUS_LABELS[process.status]}
        </Badge>
      </div>
      <ul className="space-y-1">
        {process.signers.map((signer) => (
          <li
            key={signer.role}
            className="flex items-center gap-2 text-sm text-muted-foreground"
          >
            {signer.signed_at ? (
              <CheckCircle2 className="size-4 text-green-600" />
            ) : (
              <Circle className="size-4" />
            )}
            {SIGNER_ROLE_LABELS[signer.role]}
            {signer.full_name ? ` – ${signer.full_name}` : ''}
            {!signer.signed_at && signer.expires_at
              ? ` (Läuft ab am ${format(new Date(signer.expires_at), 'dd.MM.yyyy')})`
              : ''}
          </li>
        ))}
      </ul>
    </div>
  )
}
