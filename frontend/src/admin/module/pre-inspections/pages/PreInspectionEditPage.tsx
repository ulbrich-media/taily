import { type ReactNode, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  useForm,
  FormProvider,
  type Control,
  type FieldValues,
} from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useDynamicFormSchema } from '@/components/form/useDynamicFormSchema'
import { Copy, Check } from 'lucide-react'
import { preInspectionQueryKeys } from '@/admin/module/pre-inspections/api/queries'
import {
  updatePreInspection,
  updatePreInspectionInspector,
} from '@/admin/module/pre-inspections/api/requests'
import type { PreInspectionResource } from '@/api/types/pre-inspections'
import type { PersonListResource } from '@/api/types/people'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
  CardAction,
} from '@/shadcn/components/ui/card'
import { Button } from '@/shadcn/components/ui/button'
import { Badge } from '@/shadcn/components/ui/badge'
import { FieldGroup } from '@/shadcn/components/ui/field'
import { toast } from 'sonner'
import { FormBlocker } from '@/components/form/FormBlocker'
import { PersonSelect } from '@/components/field/PersonSelect'
import { Textarea } from '@/components/field/Textarea'
import { SelectInput } from '@/components/field/SelectInput.tsx'
import { formatApiDate } from '@/lib/dates.utils.ts'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shadcn/components/ui/dialog'
import { DynamicFormFields } from '@/components/form/DynamicFormFields'
import { buildFormDataDefaults } from '@/components/form/jsonSchemaToZod'
import { InfoRow } from '@/shadcn/components/common/info-row.tsx'

// ---------------------------------------------------------------------------
// Inspector-only schema (always-available, decoupled form)
// ---------------------------------------------------------------------------
const inspectorSchema = z.object({
  inspector_id: z.string().nullable(),
})

type InspectorFormData = z.infer<typeof inspectorSchema>

// ---------------------------------------------------------------------------
// Unified main form: form_data + verdict + notes
// ---------------------------------------------------------------------------
const mainStaticSchema = z.object({
  verdict: z.enum(['approved', 'rejected'], {
    error: 'Bitte wähle ein Ergebnis aus',
  }),
  notes: z.string(),
})

type MainFormData = z.infer<typeof mainStaticSchema> & {
  form_data: Record<string, unknown>
}

const VERDICT_OPTIONS = [
  { value: 'approved', label: 'Genehmigt' },
  { value: 'rejected', label: 'Abgelehnt' },
]

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

function CopyLinkButton({ url }: { url: string }) {
  const [copied, setCopied] = useState(false)
  const [failed, setFailed] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setFailed(true)
      setTimeout(() => setFailed(false), 2000)
    }
  }

  return (
    <Button
      size="sm"
      variant={failed ? 'destructive' : 'outline'}
      onClick={handleCopy}
    >
      {copied ? (
        <Check className="h-4 w-4 mr-2" />
      ) : (
        <Copy className="h-4 w-4 mr-2" />
      )}
      {failed
        ? 'Kopieren fehlgeschlagen'
        : copied
          ? 'Kopiert!'
          : 'Link kopieren'}
    </Button>
  )
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------
interface PreInspectionEditPageProps {
  inspection: PreInspectionResource
  inspectors: PersonListResource[]
  deleteAction: ReactNode
}

export function PreInspectionEditPage({
  inspection,
  inspectors,
  deleteAction,
}: PreInspectionEditPageProps) {
  const queryClient = useQueryClient()
  const isSubmitted = inspection.submitted_at !== null
  const [confirmOpen, setConfirmOpen] = useState(false)

  // Template: pinned version post-submission, latest template pre-submission
  const template = isSubmitted
    ? inspection.form_submission?.template
    : inspection.pre_inspection_form_template

  const mainSchema = useDynamicFormSchema(mainStaticSchema, template?.schema)

  // ---------------------------------------------------------------------------
  // Inspector form — always available, decoupled
  // ---------------------------------------------------------------------------
  const inspectorForm = useForm<InspectorFormData>({
    resolver: zodResolver(inspectorSchema),
    defaultValues: { inspector_id: inspection.inspector_id ?? null },
  })

  const updateInspectorMutation = useMutation({
    mutationFn: (data: InspectorFormData) =>
      updatePreInspectionInspector(inspection.id, {
        inspector_id: data.inspector_id,
      }),
    onSuccess: (res) => {
      queryClient.invalidateQueries({
        queryKey: preInspectionQueryKeys.detail(inspection.id),
      })
      queryClient.invalidateQueries({ queryKey: preInspectionQueryKeys.all })
      toast.success(res.message)
      inspectorForm.reset({ inspector_id: res.data.inspector_id ?? null })
    },
    onError: (err) =>
      toast.error(err instanceof Error ? err.message : 'Fehler'),
  })

  // ---------------------------------------------------------------------------
  // Main form — form_data + verdict + notes, submitted as a whole
  // ---------------------------------------------------------------------------
  const mainForm = useForm<MainFormData>({
    resolver: zodResolver(mainSchema) as never,
    defaultValues: {
      verdict: isSubmitted
        ? ((inspection.verdict === 'pending'
            ? undefined
            : inspection.verdict) as 'approved' | 'rejected' | undefined)
        : undefined,
      notes: inspection.notes ?? '',
      form_data: buildFormDataDefaults(
        template?.schema,
        inspection.form_submission?.data ?? {}
      ),
    },
  })

  const mainMutation = useMutation({
    mutationFn: (data: MainFormData) =>
      updatePreInspection(inspection.id, {
        verdict: data.verdict!,
        notes: data.notes,
        form_data: template ? data.form_data : undefined,
      }),
    onSuccess: (res) => {
      toast.success(res.message)
      setConfirmOpen(false)
      queryClient.setQueryData(
        preInspectionQueryKeys.detail(inspection.id),
        res.data
      )
      queryClient.invalidateQueries({ queryKey: preInspectionQueryKeys.all })
      mainForm.reset({
        verdict: (res.data.verdict === 'pending'
          ? undefined
          : res.data.verdict) as 'approved' | 'rejected' | undefined,
        notes: res.data.notes ?? '',
        form_data: buildFormDataDefaults(
          template?.schema,
          res.data.form_submission?.data ?? {}
        ),
      })
    },
    onError: (err) => {
      setConfirmOpen(false)
      toast.error(err instanceof Error ? err.message : 'Fehler')
    },
  })

  return (
    <>
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Vorkontrolle bearbeiten</CardTitle>
            <CardDescription>
              Details und Ergebnis der Vorkontrolle
            </CardDescription>
            <CardAction>{deleteAction}</CardAction>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InfoRow label="Interessent">
                  {inspection.person?.full_name}
                </InfoRow>
                <InfoRow label="Kontrolle für">
                  {inspection.animal_type?.title}
                </InfoRow>
                <InfoRow label="Erstellt am">
                  {formatApiDate(inspection.created_at)}
                </InfoRow>
                <InfoRow label="Eingereicht am">
                  {inspection.submitted_at ? (
                    <span className="flex items-center gap-2">
                      {formatApiDate(inspection.submitted_at)}
                      <Badge variant="success">Eingereicht</Badge>
                    </span>
                  ) : (
                    <Badge variant="outline">Ausstehend</Badge>
                  )}
                </InfoRow>
              </div>

              <FormProvider {...inspectorForm}>
                <form
                  onSubmit={inspectorForm.handleSubmit((data) =>
                    updateInspectorMutation.mutateAsync(data)
                  )}
                  className="space-y-4"
                >
                  <FormBlocker />
                  <PersonSelect
                    name="inspector_id"
                    control={inspectorForm.control}
                    label="Kontrolleur"
                    persons={inspectors}
                    renderSubline={(person) =>
                      person.inspector_animal_types
                        ? `Kontrollen für ${person.inspector_animal_types.map((animalType) => animalType.title).join(', ')}`
                        : ''
                    }
                    canRemove
                  />
                  <div className="flex justify-end">
                    <Button
                      type="submit"
                      disabled={updateInspectorMutation.isPending}
                    >
                      {updateInspectorMutation.isPending
                        ? 'Speichert...'
                        : 'Speichern'}
                    </Button>
                  </div>
                </form>
              </FormProvider>
            </div>
          </CardContent>
        </Card>

        {/* Inspector link — pre-submission only */}
        {!isSubmitted && inspection.submission_url && (
          <Card>
            <CardHeader>
              <CardTitle>Kontrolleur-Link</CardTitle>
              <CardDescription>
                Teile diesen Link mit dem Kontrolleur. Der Link bleibt gültig,
                bis die Vorkontrolle eingereicht wird.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <code className="flex-1 rounded-md bg-muted px-3 py-2 text-sm font-mono break-all">
                  {inspection.submission_url}
                </code>
                <CopyLinkButton url={inspection.submission_url} />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Unified form — form_data + verdict + notes */}
        <FormProvider {...mainForm}>
          <form
            onSubmit={mainForm.handleSubmit((data) =>
              isSubmitted ? mainMutation.mutate(data) : setConfirmOpen(true)
            )}
            className="space-y-6"
          >
            <FormBlocker />

            {template && (
              <Card>
                <CardHeader>
                  <CardTitle>Kontrolldaten</CardTitle>
                </CardHeader>
                <CardContent>
                  <DynamicFormFields
                    schema={template.schema}
                    uiSchema={template.ui_schema}
                    control={
                      mainForm.control as unknown as Control<FieldValues>
                    }
                    namePrefix="form_data"
                  />
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle>Bewertung</CardTitle>
              </CardHeader>
              <CardContent>
                <FieldGroup>
                  <SelectInput
                    name="verdict"
                    control={mainForm.control}
                    label="Ergebnis"
                    options={VERDICT_OPTIONS}
                    required
                  />
                  <Textarea
                    name="notes"
                    control={mainForm.control}
                    label="Notizen"
                    rows={6}
                  />
                </FieldGroup>
              </CardContent>
              <CardFooter className="flex justify-end">
                <Button type="submit" disabled={mainMutation.isPending}>
                  {mainMutation.isPending
                    ? isSubmitted
                      ? 'Speichert...'
                      : 'Wird eingereicht...'
                    : isSubmitted
                      ? 'Speichern'
                      : 'Einreichen'}
                </Button>
              </CardFooter>
            </Card>
          </form>
        </FormProvider>
      </div>

      {/* Confirm dialog — first submission only, form fields are on the page */}
      <Dialog
        open={confirmOpen}
        onOpenChange={(o) => !o && setConfirmOpen(false)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Vorkontrolle einreichen</DialogTitle>
            <DialogDescription>
              Möchtest du die Vorkontrolle wirklich einreichen? Diese Aktion
              kann nicht rückgängig gemacht werden. Der Kontrolleur-Link wird
              danach ungültig.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmOpen(false)}
              disabled={mainMutation.isPending}
            >
              Abbrechen
            </Button>
            <Button
              onClick={() => mainMutation.mutate(mainForm.getValues())}
              disabled={mainMutation.isPending}
            >
              {mainMutation.isPending
                ? 'Wird eingereicht...'
                : 'Ja, einreichen'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
