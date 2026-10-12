import { useMemo, type ReactNode } from 'react'
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
import { FileDown, Info, TriangleAlert } from 'lucide-react'
import { toast } from 'sonner'
import { adoptionQueryKeys } from '@/admin/module/adoptions/api/queries.ts'
import {
  generateContract,
  startContractSigning,
} from '@/admin/module/adoptions/api/requests.ts'
import { Button } from '@/shadcn/components/ui/button.tsx'
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/shadcn/components/ui/alert.tsx'
import { FieldGroup } from '@/shadcn/components/ui/field.tsx'
import { SelectInput } from '@/components/field/SelectInput.tsx'
import { ApiValidationError } from '@/lib/api.ts'
import type {
  AdoptionDetailResource,
  ContractTemplate,
} from '@/api/types/adoptions'
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from '@/shadcn/components/ui/popover.tsx'
import { Separator } from '@/shadcn/components/ui/separator.tsx'

interface AdoptionStartContractSigningPageProps {
  adoption: AdoptionDetailResource
  templates: ContractTemplate[]
  onClose: () => void
  breadcrumb?: ReactNode
}

/** Reasons the backend would reject the start, surfaced before the click. */
function getBlockingProblems(adoption: AdoptionDetailResource): string[] {
  const problems: string[] = []

  if (!adoption.mediator) {
    problems.push('Für diese Vermittlung ist keine Vermittler:in zugewiesen.')
  } else if (!adoption.mediator.email) {
    problems.push(
      `${adoption.mediator.full_name} hat keine E-Mail-Adresse hinterlegt.`
    )
  }
  if (!adoption.applicant.email) {
    problems.push(
      `${adoption.applicant.full_name} hat keine E-Mail-Adresse hinterlegt.`
    )
  }

  return problems
}

export function AdoptionStartContractSigningPage({
  adoption,
  templates,
  onClose,
  breadcrumb,
}: AdoptionStartContractSigningPageProps) {
  const queryClient = useQueryClient()

  const schema = useMemo(
    () =>
      z.object({
        template: z
          .string()
          .min(1, 'Bitte wähle eine Vertragsvorlage aus')
          .refine(
            (key) => templates.some((template) => template.key === key),
            'Diese Vertragsvorlage ist nicht verfügbar'
          ),
      }),
    [templates]
  )

  type FormData = z.infer<typeof schema>

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    // Most organizations have a single template; don't make them pick it.
    defaultValues: { template: templates[0]?.key ?? '' },
  })

  const selectedTemplate = useWatch({ name: 'template', control: form.control })

  const problems = getBlockingProblems(adoption)

  const startMutation = useMutation({
    mutationFn: (data: FormData) =>
      startContractSigning(adoption.id, data.template),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: adoptionQueryKeys.list() })
      queryClient.invalidateQueries({
        queryKey: adoptionQueryKeys.detail(adoption.id),
      })
      toast.success(response.message)
      onClose()
    },
    onError: (error) => {
      const templateError =
        error instanceof ApiValidationError
          ? error.errors?.template?.[0]
          : undefined

      if (templateError) {
        form.setError('template', { message: templateError })
        return
      }

      toast.error(error.message || 'Fehler beim Starten des Signaturvorgangs')
    },
  })

  const previewMutation = useMutation({
    // Open the tab synchronously (still within the click's user-gesture
    // context) and navigate it once the signed URL comes back, since
    // browsers block window.open() calls made after an await.
    mutationFn: async (template: string) => {
      const previewTab = window.open()
      if (previewTab) {
        previewTab.opener = null
      }

      try {
        const { url } = await generateContract(adoption.id, template)
        if (previewTab) {
          previewTab.location.href = url
        } else {
          toast.error(
            'Popup wurde blockiert. Bitte Popups für diese Seite erlauben.'
          )
        }
      } catch (error) {
        previewTab?.close()
        throw error
      }
    },
    onError: () => {
      toast.error('Fehler beim Generieren des Schutzvertrags')
    },
  })

  const mediatorName = adoption.mediator?.full_name ?? 'Die Vermittler:in'
  const applicantName = adoption.applicant.full_name

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Signaturvorgang starten</DialogTitle>
          <DialogDescription>
            Der Vertrag wird aus der Vorlage erzeugt und zur digitalen
            Unterschrift versendet.
          </DialogDescription>
        </DialogHeader>

        <div className="-mt-2 -ml-3 -mb-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" type="button">
                So läuft die Unterschrift ab
                <Info />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-96">
              <PopoverHeader>
                <PopoverTitle>Ablauf des Signaturvorgangs</PopoverTitle>
                <PopoverDescription>
                  <ol className="list-inside list-decimal space-y-1 mt-1">
                    <li>
                      {mediatorName} erhält eine E-Mail, um den Vertrag zu
                      prüfen und zu unterschreiben.
                    </li>
                    <li>
                      {applicantName} folgt anschließend dem gleichen Prozess
                      und unterschreibt den Vertrag.
                    </li>
                    <li>
                      Der unterzeichnete Vertrag wird beiden Parteien
                      zugeschickt und gilt damit als abgeschlossen.
                    </li>
                  </ol>
                </PopoverDescription>
              </PopoverHeader>
            </PopoverContent>
          </Popover>
        </div>

        <Separator />

        <form
          onSubmit={form.handleSubmit((data) => startMutation.mutate(data))}
          className="space-y-4"
        >
          <FieldGroup>
            <SelectInput
              name="template"
              control={form.control}
              label="Vertragsvorlage"
              required
              options={templates.map((template) => ({
                value: template.key,
                label: template.label,
              }))}
              placeholder="Vorlage auswählen"
              disabled={templates.length === 0}
              description={
                templates.length === 0
                  ? 'Keine Vertragsvorlagen verfügbar.'
                  : undefined
              }
              additionalAction={
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  aria-label="Vertragsvorschau als PDF öffnen"
                  disabled={!selectedTemplate || previewMutation.isPending}
                  onClick={() => previewMutation.mutate(selectedTemplate)}
                >
                  <FileDown />
                </Button>
              }
            />
          </FieldGroup>

          {problems.length > 0 && (
            <Alert variant="destructive">
              <TriangleAlert />
              <AlertTitle>Signaturvorgang nicht möglich</AlertTitle>
              <AlertDescription>
                <ul className="list-inside list-disc space-y-1 mt-1">
                  {problems.map((problem) => (
                    <li key={problem}>{problem}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={startMutation.isPending}
            >
              Abbrechen
            </Button>

            <Button
              type="submit"
              disabled={problems.length > 0 || startMutation.isPending}
            >
              {startMutation.isPending
                ? 'Wird gestartet...'
                : 'Signaturvorgang starten'}
            </Button>
          </DialogFooter>
          <DialogBreadcrumb>{breadcrumb}</DialogBreadcrumb>
        </form>
      </DialogContent>
    </Dialog>
  )
}
