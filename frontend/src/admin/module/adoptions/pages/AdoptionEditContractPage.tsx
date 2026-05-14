import { useRef, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shadcn/components/ui/dialog.tsx'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { format, isAfter, parse, isValid, startOfDay } from 'date-fns'
import { FileIcon, Paperclip, Trash2, X } from 'lucide-react'
import { adoptionQueryKeys } from '@/admin/module/adoptions/api/queries.ts'
import {
  deleteContractFile,
  updateAdoption,
  uploadContractFile,
} from '@/admin/module/adoptions/api/requests.ts'
import { toast } from 'sonner'
import { Button } from '@/shadcn/components/ui/button.tsx'
import { DateInput } from '@/components/field/DateInput.tsx'
import { FieldGroup } from '@/shadcn/components/ui/field.tsx'
import type { AdoptionDetailResource } from '@/api/types/adoptions'
import {
  toApiDate,
  toDateFieldValue,
  zFieldDate,
} from '@/components/field/DateInput.utils.ts'

const noFutureDate = zFieldDate.refine((val) => {
  if (!val) return true
  const parsed = parse(val, 'dd.MM.yyyy', new Date())
  return isValid(parsed) && !isAfter(startOfDay(parsed), startOfDay(new Date()))
}, 'Datum darf nicht in der Zukunft liegen')

const schema = z.object({
  contract_sent_at: noFutureDate,
  contract_signed_at: noFutureDate,
})

type FormData = z.infer<typeof schema>

interface AdoptionEditContractPageProps {
  adoption: AdoptionDetailResource
  onClose: () => void
}

export function AdoptionEditContractPage({
  adoption,
  onClose,
}: AdoptionEditContractPageProps) {
  const queryClient = useQueryClient()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [removeExistingFile, setRemoveExistingFile] = useState(false)

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      contract_sent_at: toDateFieldValue(adoption.contract_sent_at),
      contract_signed_at: toDateFieldValue(adoption.contract_signed_at),
    },
  })

  const mutation = useMutation({
    mutationFn: async (data: FormData) => {
      await updateAdoption(adoption.id, {
        contract_sent_at: toApiDate(data.contract_sent_at),
        contract_signed_at: toApiDate(data.contract_signed_at),
      })

      if (selectedFile) {
        // Upload replaces any existing file via clearMediaCollection in the backend
        await uploadContractFile(adoption.id, selectedFile)
      } else if (removeExistingFile) {
        await deleteContractFile(adoption.id)
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adoptionQueryKeys.list() })
      queryClient.invalidateQueries({
        queryKey: adoptionQueryKeys.detail(adoption.id),
      })
      toast.success('Schutzvertrag erfolgreich gespeichert')
      onClose()
    },
    onError: () => {
      toast.error('Fehler beim Speichern des Schutzvertrags')
    },
  })

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null
    setSelectedFile(file)

    if (file && !form.getValues('contract_signed_at')) {
      form.setValue('contract_signed_at', format(new Date(), 'dd.MM.yyyy'), {
        shouldValidate: true,
      })
    }
  }

  const handleRemoveSelected = () => {
    setSelectedFile(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleRemoveExisting = () => {
    setRemoveExistingFile(true)
  }

  const handleUndoRemove = () => {
    setRemoveExistingFile(false)
  }

  const existingFile = adoption.contract_file
  const showExistingFile = existingFile && !removeExistingFile && !selectedFile

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Schutzvertrag bearbeiten</DialogTitle>
          <DialogDescription>
            Schutzvertragsdaten und -datei verwalten.
          </DialogDescription>
        </DialogHeader>
        <form
          onSubmit={form.handleSubmit((data) => mutation.mutate(data))}
          className="space-y-4"
        >
          <FieldGroup>
            <DateInput
              name="contract_sent_at"
              control={form.control}
              label="Versendet am"
              disableFutureDates
            />
          </FieldGroup>

          <FieldGroup>
            <DateInput
              name="contract_signed_at"
              control={form.control}
              label="Unterzeichnet am"
              disableFutureDates
            />
          </FieldGroup>

          <div className="space-y-2">
            <p className="text-sm font-medium">Schutzvertrag</p>

            {selectedFile && (
              <div className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm">
                <FileIcon className="size-4 shrink-0 text-muted-foreground" />
                <span className="min-w-0 flex-1 truncate">
                  {selectedFile.name}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-6 shrink-0"
                  aria-label="Auswahl aufheben"
                  onClick={handleRemoveSelected}
                >
                  <X className="size-3" />
                </Button>
              </div>
            )}

            {showExistingFile && (
              <div className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm">
                <FileIcon className="size-4 shrink-0 text-muted-foreground" />
                <span className="min-w-0 flex-1 truncate">
                  {existingFile.name}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-6 shrink-0 text-destructive hover:text-destructive"
                  aria-label="Datei entfernen"
                  onClick={handleRemoveExisting}
                >
                  <Trash2 className="size-3" />
                </Button>
              </div>
            )}

            {removeExistingFile && !selectedFile && (
              <div className="flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                <span className="flex-1">Datei wird entfernt</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-xs"
                  onClick={handleUndoRemove}
                >
                  Rückgängig
                </Button>
              </div>
            )}

            <div>
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={handleFileChange}
                aria-label="Schutzvertrag auswählen"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
              >
                <Paperclip className="size-4" />
                {existingFile && !removeExistingFile
                  ? 'Datei ersetzen'
                  : 'Datei hochladen'}
              </Button>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={mutation.isPending}
            >
              Abbrechen
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? 'Speichern...' : 'Speichern'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
