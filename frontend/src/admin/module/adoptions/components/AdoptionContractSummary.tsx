import type { ReactNode } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { FilePenLineIcon, Mail, RotateCw, ShieldCheck } from 'lucide-react'
import { toast } from 'sonner'
import type { AdoptionDetailResource } from '@/api/types/adoptions'
import { adoptionQueryKeys } from '@/admin/module/adoptions/api/queries.ts'
import { resendContractSigning } from '@/admin/module/adoptions/api/requests.ts'
import { ContractSigningStatus } from '@/admin/module/adoptions/components/ContractSigningStatus.tsx'
import { getContractView } from '@/admin/module/adoptions/contract.utils.ts'
import { InfoRow } from '@/shadcn/components/common/info-row.tsx'
import { Badge } from '@/shadcn/components/ui/badge.tsx'
import { Button } from '@/shadcn/components/ui/button.tsx'
import { formatApiDate, formatApiDateTime } from '@/lib/dates.utils.ts'

interface AdoptionContractSummaryProps {
  adoption: AdoptionDetailResource
  /** Split button: start the signing flow, upload a signed contract as alternative */
  startContractAction: ReactNode
  /** Edit a manually recorded contract */
  editContractAction: ReactNode
  /** Cancel the running signing process */
  cancelSigningAction: ReactNode
}

export function AdoptionContractSummary({
  adoption,
  startContractAction,
  editContractAction,
  cancelSigningAction,
}: AdoptionContractSummaryProps) {
  const queryClient = useQueryClient()
  const view = getContractView(adoption)
  const process = adoption.contract_signing_process

  const resendMutation = useMutation({
    mutationFn: () => resendContractSigning(adoption.id),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: adoptionQueryKeys.list() })
      queryClient.invalidateQueries({
        queryKey: adoptionQueryKeys.detail(adoption.id),
      })
      toast.success(response.message)
    },
    onError: (error) => {
      toast.error(
        error.message || 'Fehler beim erneuten Versenden der Einladung'
      )
    },
  })

  const contractFile = adoption.contract_file && (
    <InfoRow label="Schutzvertrag">
      <Button variant="ghost" size="sm" asChild>
        <a href={adoption.contract_file.url} target="_blank" rel="noreferrer">
          <FilePenLineIcon className="size-4" />
          {adoption.contract_file.name}
        </a>
      </Button>
    </InfoRow>
  )

  return (
    <div className="space-y-4">
      {view === 'open' && (
        <>
          <p className="text-sm text-muted-foreground">
            {process?.status === 'expired'
              ? 'Der letzte Signaturvorgang ist abgelaufen. Der Vertrag ist weiterhin nicht unterschrieben.'
              : process?.status === 'cancelled'
                ? 'Der letzte Signaturvorgang wurde abgebrochen. Der Vertrag ist weiterhin nicht unterschrieben.'
                : 'Noch kein unterschriebener Vertrag.'}
          </p>
          {process && <ContractSigningStatus process={process} />}
          <div className="flex justify-end">{startContractAction}</div>
        </>
      )}

      {view === 'signing' && process && (
        <>
          <div className="flex items-center gap-2 text-sm">
            <Mail className="size-4" />
            <span className="font-medium">Digitaler Signaturvorgang läuft</span>
          </div>
          <ContractSigningStatus process={process} />
          <div className="flex justify-end gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={resendMutation.isPending}
              onClick={() => resendMutation.mutate()}
            >
              <RotateCw />
              Einladung erneut senden
            </Button>
            {cancelSigningAction}
          </div>
        </>
      )}

      {view === 'digital' && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InfoRow label="Unterzeichnet">
              <span className="inline-flex items-center gap-2">
                Ja
                <Badge variant="success">
                  <ShieldCheck />
                  Digital signiert
                </Badge>
              </span>
            </InfoRow>
            <InfoRow label="Abgeschlossen am">
              {formatApiDateTime(
                process?.completed_at ?? adoption.contract_signed_at
              )}
            </InfoRow>
            {contractFile}
          </div>
          {process && <ContractSigningStatus process={process} />}
          <p className="text-xs text-muted-foreground">
            Digital unterschriebene Verträge können nicht manuell geändert
            werden.
          </p>
        </>
      )}

      {view === 'manual' && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InfoRow label="Unterzeichnet">
              <span className="inline-flex items-center gap-2">
                Ja
                <Badge variant="outline">Manuell erfasst</Badge>
              </span>
            </InfoRow>
            <InfoRow label="Unterzeichnet am">
              {formatApiDate(adoption.contract_signed_at)}
            </InfoRow>
            {contractFile}
          </div>
          <div className="flex justify-end">{editContractAction}</div>
        </>
      )}
    </div>
  )
}
