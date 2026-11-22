import { useMutation, useQueryClient } from '@tanstack/react-query'
import { CheckCircle2, Undo2 } from 'lucide-react'
import { toast } from 'sonner'
import type { AdoptionDetailResource } from '@/api/types/adoptions'
import { Button } from '@/shadcn/components/ui/button'
import { adoptionQueryKeys } from '@/admin/module/adoptions/api/queries'
import { confirmPreInspection, unconfirmPreInspection } from '../api/requests'

/**
 * The mediator closes the pre-inspection step — with or without a
 * pre-inspection, and regardless of its verdict. A rejection is a
 * cancellation of the adoption instead (docs/features/adoption.md#pre-inspection).
 */
export function PreInspectionConfirmAction({
  adoption,
}: {
  adoption: AdoptionDetailResource
}) {
  const queryClient = useQueryClient()
  const confirmed = adoption.pre_inspection_confirmed_at !== null

  const mutation = useMutation({
    mutationFn: () =>
      confirmed
        ? unconfirmPreInspection(adoption.id)
        : confirmPreInspection(adoption.id),
    onSuccess: (response) => {
      queryClient.setQueryData(
        adoptionQueryKeys.detail(adoption.id),
        response.data
      )
      queryClient.invalidateQueries({ queryKey: adoptionQueryKeys.list() })
      toast.success(response.message)
    },
    onError: (error) => toast.error(error.message),
  })

  return (
    <Button
      size="sm"
      variant={confirmed ? 'outline' : 'default'}
      onClick={() => mutation.mutate()}
      disabled={mutation.isPending}
    >
      {confirmed ? (
        <>
          <Undo2 />
          Bestätigung zurücknehmen
        </>
      ) : (
        <>
          <CheckCircle2 />
          Vorkontrolle bestätigen
        </>
      )}
    </Button>
  )
}
