import { createFileRoute } from '@tanstack/react-router'
import {
  useSuspenseQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query'
import { queryClient as appQueryClient } from '@/lib/queryClient'
import {
  listTransportsQuery,
  transportQueryKeys,
} from '@/admin/module/transports/api/queries'
import {
  getAdoptionQuery,
  adoptionQueryKeys,
} from '@/admin/module/adoptions/api/queries'
import { updateAdoption } from '@/admin/module/adoptions/api/requests'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/shadcn/components/ui/dialog'
import { Button } from '@/shadcn/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shadcn/components/ui/select'
import { Label } from '@/shadcn/components/ui/label'
import { toast } from 'sonner'
import { useState } from 'react'
import { Route as AdoptionRoute } from '@/routes/admin/_authenticated/adoptions/$adoptionId/adoption/route'
import { getTransportTitle } from '@/admin/module/transports/components/utils.ts'

export const Route = createFileRoute(
  '/admin/_authenticated/adoptions/$adoptionId/adoption/transport-assign'
)({
  loader: async ({ params }) => {
    await Promise.all([
      appQueryClient.ensureQueryData(getAdoptionQuery(params.adoptionId)),
      appQueryClient.ensureQueryData(listTransportsQuery({ is_done: false })),
    ])
  },
  component: RouteComponent,
})

function RouteComponent() {
  const { adoptionId } = Route.useParams()
  const { data: adoption } = useSuspenseQuery(getAdoptionQuery(adoptionId))
  const { data: openTransports } = useSuspenseQuery(
    listTransportsQuery({ is_done: false })
  )
  const queryClientHook = useQueryClient()
  const navigateToAdoption = AdoptionRoute.useNavigate()

  const [selectedId, setSelectedId] = useState<string>(
    adoption.transport_id ?? ''
  )

  const assignMutation = useMutation({
    mutationFn: (transportId: string | null) =>
      updateAdoption(adoptionId, { transport_id: transportId }),
    onSuccess: (response) => {
      queryClientHook.invalidateQueries({ queryKey: adoptionQueryKeys.list() })
      queryClientHook.invalidateQueries({
        queryKey: adoptionQueryKeys.detail(adoptionId),
      })
      queryClientHook.invalidateQueries({
        queryKey: transportQueryKeys.list(),
      })
      toast.success(response.message)
      navigateToAdoption({})
    },
    onError: () => {
      toast.error('Fehler beim Zuweisen des Transports')
    },
  })

  const handleClose = () => navigateToAdoption({})

  return (
    <Dialog open onOpenChange={(open) => !open && handleClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Transport zuweisen</DialogTitle>
          <DialogDescription>
            Wähle einen offenen Transport für diese Vermittlung aus.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <Label>Transport</Label>
          {openTransports.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Keine geplanten Transporte verfügbar.
            </p>
          ) : (
            <Select value={selectedId} onValueChange={setSelectedId}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Transport wählen..." />
              </SelectTrigger>
              <SelectContent>
                {openTransports.map((transport) => (
                  <SelectItem key={transport.id} value={transport.id}>
                    {getTransportTitle(transport)} ({transport.adoptions.length}{' '}
                    {transport.adoptions.length === 1 ? 'Tier' : 'Tiere'})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={assignMutation.isPending}
          >
            Abbrechen
          </Button>
          <Button
            type="button"
            disabled={assignMutation.isPending || !selectedId}
            onClick={() => assignMutation.mutate(selectedId || null)}
          >
            {assignMutation.isPending ? 'Speichern...' : 'Zuweisen'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
