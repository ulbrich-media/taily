import { type ReactNode, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm, FormProvider } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ClipboardCheck, Copy, Check } from 'lucide-react'
import { preInspectionQueryKeys } from '@/admin/module/pre-inspections/api/queries'
import { updatePreInspection } from '@/admin/module/pre-inspections/api/requests'
import type { PreInspectionResource } from '@/api/types/pre-inspections'
import type { PersonListResource } from '@/api/types/people'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/shadcn/components/ui/card'
import { Button } from '@/shadcn/components/ui/button'
import { Badge } from '@/shadcn/components/ui/badge'
import { FieldGroup } from '@/shadcn/components/ui/field'
import { toast } from 'sonner'
import { FormBlocker } from '@/components/form/FormBlocker'
import { PersonSelect } from '@/components/field/PersonSelect'
import { Textarea } from '@/components/field/Textarea'
import { PageHeader } from '@/components/layout/PageHeader'
import { SelectInput } from '@/components/field/SelectInput.tsx'
import { formatApiDate } from '@/lib/dates.utils.ts'
import { FormGrid } from '@/components/form/FormGrid.tsx'
import {
  STRING_LENGTH_TEXTAREA,
  zFieldString,
} from '@/components/field/TextInput.utils.ts'

const editSchema = z.object({
  inspector_id: z.string().nullable(),
  verdict: z.enum(['pending', 'approved', 'rejected']),
  notes: zFieldString({
    maxLength: STRING_LENGTH_TEXTAREA,
  }),
})

type EditFormData = z.infer<typeof editSchema>

const VERDICT_OPTIONS = [
  { value: 'pending', label: 'Ausstehend' },
  { value: 'approved', label: 'Genehmigt' },
  { value: 'rejected', label: 'Abgelehnt' },
]

function CopyLinkButton({ url }: { url: string }) {
  const [copied, setCopied] = useState(false)
  const [failed, setFailed] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy link:', err)
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

function InfoRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground uppercase tracking-wide">
        {label}
      </p>
      <p className="text-sm font-medium mt-0.5">{value ?? '–'}</p>
    </div>
  )
}

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

  const hasVerdict = inspection.verdict !== 'pending'

  const allowedVerdicts = ['pending', 'approved', 'rejected'] as const
  const safeVerdict = allowedVerdicts.includes(
    inspection.verdict as (typeof allowedVerdicts)[number]
  )
    ? (inspection.verdict as 'pending' | 'approved' | 'rejected')
    : 'pending'

  const form = useForm<EditFormData>({
    resolver: zodResolver(editSchema),
    defaultValues: {
      inspector_id: inspection.inspector_id ?? null,
      verdict: safeVerdict,
      notes: inspection.notes,
    },
  })

  const updateMutation = useMutation({
    mutationFn: (data: EditFormData) =>
      updatePreInspection(inspection.id, {
        inspector_id: data.inspector_id || null,
        verdict: data.verdict,
        notes: data.notes,
      }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: preInspectionQueryKeys.detail(inspection.id),
      })
      queryClient.invalidateQueries({ queryKey: preInspectionQueryKeys.all })
      toast.success(data.message)
      form.reset({
        inspector_id: data.data.inspector_id ?? null,
        verdict: data.data.verdict,
        notes: data.data.notes,
      })
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })

  const onSubmit = async (data: EditFormData) => {
    await updateMutation.mutateAsync(data)
  }

  return (
    <div className="space-y-6">
      <PageHeader
        icon={ClipboardCheck}
        title="Vorkontrolle bearbeiten"
        description="Details und Ergebnis der Vorkontrolle"
        actions={deleteAction}
      />

      {!hasVerdict && inspection.submission_url && (
        <Card>
          <CardHeader>
            <CardTitle>Kontrolleur-Link</CardTitle>
            <CardDescription>
              Teile diesen Link mit dem Kontrolleur. Der Link bleibt gültig, bis
              ein Ergebnis gesetzt wird.
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

      <Card>
        <CardHeader>
          <CardTitle>Informationen</CardTitle>
          <CardDescription>
            Unveränderliche Angaben zur Vorkontrolle
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InfoRow label="Interessent" value={inspection.person?.full_name} />
            <InfoRow
              label="Kontrolle für"
              value={inspection.animal_type?.title}
            />
            <InfoRow
              label="Erstellt am"
              value={formatApiDate(inspection.created_at)}
            />
            <InfoRow
              label="Eingereicht am"
              value={
                inspection.submitted_at ? (
                  <span className="flex items-center gap-2">
                    {formatApiDate(inspection.submitted_at)}
                    <Badge variant="success">Eingereicht</Badge>
                  </span>
                ) : (
                  <Badge variant="outline">Ausstehend</Badge>
                )
              }
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Bearbeitung</CardTitle>
        </CardHeader>
        <CardContent>
          <FormProvider {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormBlocker />

              <FieldGroup>
                <FormGrid>
                  <SelectInput
                    name="verdict"
                    control={form.control}
                    label="Ergebnis"
                    options={VERDICT_OPTIONS}
                    required
                  />

                  <PersonSelect
                    name="inspector_id"
                    control={form.control}
                    label="Kontrolleur"
                    persons={inspectors}
                    canRemove
                  />
                </FormGrid>

                <Textarea
                  name="notes"
                  control={form.control}
                  label="Notizen"
                  rows={6}
                />
              </FieldGroup>

              <div className="flex justify-end">
                <Button type="submit" disabled={updateMutation.isPending}>
                  {updateMutation.isPending ? 'Speichert...' : 'Speichern'}
                </Button>
              </div>
            </form>
          </FormProvider>
        </CardContent>
      </Card>
    </div>
  )
}
