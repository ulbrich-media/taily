import { type ChangeEvent, useEffect, useState, type ReactNode } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogBreadcrumb,
} from '@/shadcn/components/ui/dialog.tsx'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { format } from 'date-fns'
import { X } from 'lucide-react'
import { adoptionQueryKeys } from '@/admin/module/adoptions/api/queries.ts'
import { updateContract } from '@/admin/module/adoptions/api/requests.ts'
import { toast } from 'sonner'
import { Button } from '@/shadcn/components/ui/button.tsx'
import { DateInput } from '@/components/field/DateInput.tsx'
import { Switch } from '@/components/field/Switch.tsx'
import { FieldGroup } from '@/shadcn/components/ui/field.tsx'
import type { AdoptionDetailResource } from '@/api/types/adoptions'
import {
  toApiDate,
  toDateFieldValue,
  zFieldDateNoFuture,
} from '@/components/field/DateInput.utils.ts'
import { Input } from '@/shadcn/components/ui/input.tsx'
import { ButtonGroup } from '@/shadcn/components/ui/button-group.tsx'

const schema = z.object({
  contract_signed: z.boolean(),
  contract_signed_at: zFieldDateNoFuture,
})

type FormData = z.infer<typeof schema>

interface AdoptionEditContractPageProps {
  adoption: AdoptionDetailResource
  onClose: () => void
  breadcrumb?: ReactNode
}

export function AdoptionEditContractPage({
  adoption,
  onClose,
  breadcrumb,
}: AdoptionEditContractPageProps) {
  const queryClient = useQueryClient()

  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [removeExistingFile, setRemoveExistingFile] = useState(false)

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      contract_signed: adoption.contract_signed,
      contract_signed_at: toDateFieldValue(adoption.contract_signed_at),
    },
  })

  const contractSigned = useWatch({
    name: 'contract_signed',
    control: form.control,
  })

  const mutation = useMutation({
    mutationFn: (data: FormData) =>
      updateContract(adoption.id, {
        contract_signed: data.contract_signed,
        contract_signed_at: toApiDate(data.contract_signed_at),
        file: selectedFile ?? undefined,
        remove_file: removeExistingFile && !selectedFile,
      }),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: adoptionQueryKeys.list() })
      queryClient.invalidateQueries({
        queryKey: adoptionQueryKeys.detail(adoption.id),
      })
      toast.success(response.message || 'Schutzvertrag erfolgreich gespeichert')
      onClose()
    },
    onError: () => {
      toast.error('Fehler beim Speichern des Schutzvertrags')
    },
  })

  // Reset date and file when contract signed flag was disabled
  useEffect(() => {
    if (!contractSigned) {
      form.setValue('contract_signed_at', null, { shouldValidate: false })
      // cascading renders is fine here and there is no loop risk as well
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelectedFile(null)
      setRemoveExistingFile(true)
    }
  }, [contractSigned, form])

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null
    setSelectedFile(file)

    if (file && !form.getValues('contract_signed_at')) {
      form.setValue('contract_signed_at', format(new Date(), 'dd.MM.yyyy'), {
        shouldValidate: true,
      })
    }
  }

  const handleClearFile = () => {
    if (selectedFile) {
      setSelectedFile(null)
    } else {
      setRemoveExistingFile(true)
    }
  }

  const existingFile = adoption.contract_file
  const activeFile = selectedFile
    ? selectedFile.name
    : existingFile && !removeExistingFile
      ? existingFile.name
      : null

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogBreadcrumb>{breadcrumb}</DialogBreadcrumb>
          <DialogTitle>Schutzvertrag bearbeiten</DialogTitle>
          <DialogDescription>
            Unterzeichnungsstatus und Schutzvertragsdatei verwalten.
          </DialogDescription>
        </DialogHeader>
        <form
          onSubmit={form.handleSubmit((data) => mutation.mutate(data))}
          className="space-y-4"
        >
          <Switch
            name="contract_signed"
            control={form.control}
            label="Unterzeichnet"
            switchLabel="Schutzvertrag wurde unterzeichnet"
          />

          <FieldGroup>
            <DateInput
              name="contract_signed_at"
              control={form.control}
              label="Unterzeichnet am"
              disableFutureDates
              disabled={!contractSigned}
            />
          </FieldGroup>

          <div className="space-y-2">
            <p className="text-sm font-medium">Schutzvertrag</p>

            <ButtonGroup className="w-full">
              {activeFile ? (
                <Input value={activeFile} disabled className="flex-1" />
              ) : (
                <Input
                  type="file"
                  accept="application/pdf,image/jpeg,image/png,image/webp"
                  onChange={handleFileChange}
                  aria-label="Schutzvertrag auswählen"
                  className="flex-1"
                  disabled={!contractSigned}
                />
              )}
              <Button
                type="button"
                variant="outline"
                size="icon"
                aria-label="Schutzvertrag entfernen"
                onClick={handleClearFile}
                disabled={!activeFile || !contractSigned}
              >
                <X />
              </Button>
            </ButtonGroup>
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
