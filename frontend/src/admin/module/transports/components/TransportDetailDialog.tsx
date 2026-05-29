import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shadcn/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/shadcn/components/ui/alert-dialog'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  updateTransport,
  markTransportDone,
  deleteTransport,
} from '@/admin/module/transports/api/requests'
import { transportQueryKeys } from '@/admin/module/transports/api/queries'
import { adoptionQueryKeys } from '@/admin/module/adoptions/api/queries'
import { toast } from 'sonner'
import { Button } from '@/shadcn/components/ui/button'
import { Badge } from '@/shadcn/components/ui/badge'
import { Textarea } from '@/components/field/Textarea'
import { DateInput } from '@/components/field/DateInput'
import { FieldGroup } from '@/shadcn/components/ui/field'
import { InfoRow } from '@/shadcn/components/common/info-row'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shadcn/components/ui/table'
import {
  STRING_LENGTH_TEXTAREA,
  zFieldString,
} from '@/components/field/TextInput.utils'
import { formatApiDate, formatApiDateTime } from '@/lib/dates.utils'
import { CheckCircle2, Pencil, Trash2 } from 'lucide-react'
import type { TransportDetailResource } from '@/api/types/transports'
import type { ReactNode } from 'react'

const editSchema = z.object({
  planned_at: z.string().nullable(),
  notes: zFieldString({ maxLength: STRING_LENGTH_TEXTAREA }),
})

type EditFormData = z.infer<typeof editSchema>

interface TransportDetailDialogProps {
  transport: TransportDetailResource
  onClose: () => void
  renderAdoptionLink?: (adoptionId: string) => ReactNode
}

export function TransportDetailDialog({
  transport,
  onClose,
  renderAdoptionLink,
}: TransportDetailDialogProps) {
  const queryClient = useQueryClient()
  const [isEditing, setIsEditing] = useState(false)
  const [showMarkDoneConfirm, setShowMarkDoneConfirm] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const form = useForm<EditFormData>({
    resolver: zodResolver(editSchema),
    defaultValues: {
      planned_at: transport.planned_at,
      notes: transport.notes,
    },
  })

  const updateMutation = useMutation({
    mutationFn: (data: EditFormData) =>
      updateTransport(transport.id, {
        planned_at: data.planned_at,
        notes: data.notes,
      }),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: transportQueryKeys.list() })
      queryClient.setQueryData(
        transportQueryKeys.detail(transport.id),
        response.data
      )
      toast.success(response.message)
      setIsEditing(false)
    },
    onError: () => {
      toast.error('Fehler beim Speichern des Transports')
    },
  })

  const markDoneMutation = useMutation({
    mutationFn: () => markTransportDone(transport.id),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: transportQueryKeys.list() })
      queryClient.setQueryData(
        transportQueryKeys.detail(transport.id),
        response.data
      )
      queryClient.invalidateQueries({ queryKey: adoptionQueryKeys.list() })
      toast.success(response.message)
      setShowMarkDoneConfirm(false)
    },
    onError: () => {
      toast.error('Fehler beim Abschließen des Transports')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: () => deleteTransport(transport.id),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: transportQueryKeys.list() })
      toast.success(response.message)
      onClose()
    },
    onError: () => {
      toast.error('Fehler beim Löschen des Transports')
    },
  })

  const title = transport.planned_at
    ? `Transport am ${formatApiDate(transport.planned_at)}`
    : 'Transport'

  return (
    <>
      <Dialog open onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <DialogTitle>{title}</DialogTitle>
              {transport.is_done ? (
                <Badge variant="success">Abgeschlossen</Badge>
              ) : (
                <Badge variant="outline">Offen</Badge>
              )}
            </div>
          </DialogHeader>

          {isEditing ? (
            <form
              onSubmit={form.handleSubmit((data) =>
                updateMutation.mutate(data)
              )}
              className="space-y-4"
            >
              <FieldGroup>
                <DateInput
                  name="planned_at"
                  control={form.control}
                  label="Geplantes Datum"
                />
              </FieldGroup>
              <FieldGroup>
                <Textarea
                  name="notes"
                  control={form.control}
                  label="Notizen"
                  rows={4}
                />
              </FieldGroup>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    form.reset({
                      planned_at: transport.planned_at,
                      notes: transport.notes,
                    })
                    setIsEditing(false)
                  }}
                  disabled={updateMutation.isPending}
                >
                  Abbrechen
                </Button>
                <Button type="submit" disabled={updateMutation.isPending}>
                  {updateMutation.isPending ? 'Speichern...' : 'Speichern'}
                </Button>
              </DialogFooter>
            </form>
          ) : (
            <>
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <InfoRow label="Geplantes Datum">
                    {formatApiDate(transport.planned_at)}
                  </InfoRow>
                  {transport.is_done && transport.done_at && (
                    <InfoRow label="Abgeschlossen am">
                      {formatApiDateTime(transport.done_at)}
                    </InfoRow>
                  )}
                </div>

                {transport.notes && (
                  <InfoRow label="Notizen">{transport.notes}</InfoRow>
                )}

                {transport.adoptions.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-foreground mb-2">
                      Tiere & Vermittlungen
                    </p>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Tier</TableHead>
                          <TableHead>Interessent</TableHead>
                          {renderAdoptionLink && (
                            <TableHead className="th-contain"></TableHead>
                          )}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {transport.adoptions.map((adoption) => (
                          <TableRow key={adoption.id}>
                            <TableCell>{adoption.animal_name ?? '–'}</TableCell>
                            <TableCell>
                              {adoption.applicant_name ?? '–'}
                            </TableCell>
                            {renderAdoptionLink && (
                              <TableCell className="text-right">
                                <Button size="sm" variant="ghost" asChild>
                                  {renderAdoptionLink(adoption.id)}
                                </Button>
                              </TableCell>
                            )}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}

                {transport.adoptions.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    Noch keine Tiere diesem Transport zugewiesen.
                  </p>
                )}
              </div>

              <DialogFooter className="sm:justify-between">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:text-destructive"
                  onClick={() => setShowDeleteConfirm(true)}
                >
                  <Trash2 className="size-4" />
                  Löschen
                </Button>
                <div className="flex gap-2">
                  {!transport.is_done && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setShowMarkDoneConfirm(true)}
                    >
                      <CheckCircle2 className="size-4" />
                      Abschließen
                    </Button>
                  )}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditing(true)}
                  >
                    <Pencil className="size-4" />
                    Bearbeiten
                  </Button>
                </div>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={showMarkDoneConfirm}
        onOpenChange={setShowMarkDoneConfirm}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Transport abschließen</AlertDialogTitle>
            <AlertDialogDescription>
              Diese Aktion kann nicht rückgängig gemacht werden. Der Transport
              wird als abgeschlossen markiert.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={markDoneMutation.isPending}>
              Abbrechen
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => markDoneMutation.mutate()}
              disabled={markDoneMutation.isPending}
            >
              {markDoneMutation.isPending
                ? 'Wird gespeichert...'
                : 'Abschließen'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Transport löschen</AlertDialogTitle>
            <AlertDialogDescription>
              {transport.adoptions.length > 0
                ? `Dieser Transport hat ${transport.adoptions.length} zugewiesene Vermittlung${transport.adoptions.length !== 1 ? 'en' : ''}. Diese werden vom Transport getrennt.`
                : 'Soll dieser Transport wirklich gelöscht werden?'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>
              Abbrechen
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteMutation.mutate()}
              disabled={deleteMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? 'Löschen...' : 'Löschen'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
