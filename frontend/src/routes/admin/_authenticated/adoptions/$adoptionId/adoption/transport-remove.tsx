import { createFileRoute } from '@tanstack/react-router'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { updateAdoption } from '@/admin/module/adoptions/api/requests'
import { adoptionQueryKeys } from '@/admin/module/adoptions/api/queries'
import { transportQueryKeys } from '@/admin/module/transports/api/queries'
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/shadcn/components/ui/alert-dialog'
import { Button } from '@/shadcn/components/ui/button'
import { toast } from 'sonner'
import { Route as AdoptionRoute } from '@/routes/admin/_authenticated/adoptions/$adoptionId/adoption/route'

export const Route = createFileRoute(
  '/admin/_authenticated/adoptions/$adoptionId/adoption/transport-remove'
)({
  component: RouteComponent,
})

function RouteComponent() {
  const { adoptionId } = Route.useParams()
  const queryClientHook = useQueryClient()
  const navigateToAdoption = AdoptionRoute.useNavigate()

  const removeMutation = useMutation({
    mutationFn: () => updateAdoption(adoptionId, { transport_id: null }),
    onSuccess: (response) => {
      queryClientHook.invalidateQueries({ queryKey: adoptionQueryKeys.list() })
      queryClientHook.invalidateQueries({
        queryKey: adoptionQueryKeys.detail(adoptionId),
      })
      queryClientHook.invalidateQueries({
        queryKey: transportQueryKeys.all,
      })
      toast.success(response.message)
      navigateToAdoption({})
    },
    onError: () => {
      toast.error('Fehler beim Entfernen des Transports')
    },
  })

  const handleClose = () => navigateToAdoption({})

  return (
    <AlertDialog open onOpenChange={(open) => !open && handleClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Transport entfernen</AlertDialogTitle>
          <AlertDialogDescription>
            Soll der Transport von dieser Vermittlung entfernt werden?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel
            onClick={handleClose}
            disabled={removeMutation.isPending}
          >
            Abbrechen
          </AlertDialogCancel>
          <Button
            variant="destructive"
            onClick={() => removeMutation.mutate()}
            disabled={removeMutation.isPending}
          >
            {removeMutation.isPending ? 'Entfernen...' : 'Entfernen'}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
