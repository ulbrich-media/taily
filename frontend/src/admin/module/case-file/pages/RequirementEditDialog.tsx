import type { ReactNode } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import {
  ADOPTION_STEPS,
  ADOPTION_STEP_LABELS,
  type AdoptionStep,
  type CaseFileField,
} from '@/api/types/case-file'
import {
  Dialog,
  DialogBreadcrumb,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shadcn/components/ui/dialog'
import { Button } from '@/shadcn/components/ui/button'
import { FieldGroup } from '@/shadcn/components/ui/field'
import { SelectInput } from '@/components/field/SelectInput'
import { Mark } from '@/components/typo/mark'
import { adoptionQueryKeys } from '@/admin/module/adoptions/api/queries'
import { caseFileQueryKeys } from '../api/queries'
import { clearRequirement, setRequirement } from '../api/requests'

// 'default' removes the override; the rest are override values.
type Choice = 'default' | 'optional' | 'waived' | AdoptionStep

interface RequirementEditDialogProps {
  adoptionId: string
  field: CaseFileField
  onClose: () => void
  breadcrumb?: ReactNode
}

/**
 * The mediator decides per adoption whether a field is needed: require the
 * home video, waive the landlord confirmation, move a due step
 * (docs/features/case-file.md#requirement-overrides).
 */
export function RequirementEditDialog({
  adoptionId,
  field,
  onClose,
  breadcrumb,
}: RequirementEditDialogProps) {
  const queryClient = useQueryClient()

  const current: Choice = !field.override
    ? 'default'
    : field.override.waived
      ? 'waived'
      : (field.override.required_for ?? 'optional')

  const form = useForm<{ choice: Choice }>({
    defaultValues: { choice: current },
  })

  const defaultLabel = field.required_for
    ? `Standard: Pflicht ab ${ADOPTION_STEP_LABELS[field.required_for]}${field.in_contract ? ' (spätestens Vertrag)' : ''}`
    : field.in_contract
      ? 'Standard: Pflicht ab Vertrag'
      : 'Standard: optional'

  // A field every contract prints can only be required earlier.
  const steps = field.fixed_in_contract
    ? ADOPTION_STEPS.slice(0, ADOPTION_STEPS.indexOf('contract') + 1)
    : ADOPTION_STEPS
  const options = [
    { value: 'default', label: defaultLabel },
    ...steps.map((step) => ({
      value: step,
      label: `Pflicht ab ${ADOPTION_STEP_LABELS[step]}`,
    })),
    ...(field.fixed_in_contract
      ? []
      : [
          { value: 'optional', label: 'Optional' },
          { value: 'waived', label: 'Für diese Vermittlung nicht nötig' },
        ]),
  ]

  const mutation = useMutation({
    mutationFn: ({ choice }: { choice: Choice }) => {
      if (choice === 'default') return clearRequirement(adoptionId, field.key)
      if (choice === 'waived')
        return setRequirement(adoptionId, field.key, {
          required_for: null,
          waived: true,
        })
      return setRequirement(adoptionId, field.key, {
        required_for: choice === 'optional' ? null : choice,
        waived: false,
      })
    },
    onSuccess: (response) => {
      queryClient.setQueryData(
        caseFileQueryKeys.detail(adoptionId),
        response.data
      )
      // A requested home video starts the pre-inspection step.
      queryClient.invalidateQueries({
        queryKey: adoptionQueryKeys.detail(adoptionId),
      })
      queryClient.invalidateQueries({ queryKey: adoptionQueryKeys.list() })
      toast.success(response.message)
      onClose()
    },
    onError: (error) => toast.error(error.message),
  })

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            Anforderung für <Mark>{field.label}</Mark>
          </DialogTitle>
          <DialogDescription>
            Gilt nur für diese Vermittlung. Die Voreinstellung aus dem Katalog
            bleibt für alle anderen unverändert.
          </DialogDescription>
        </DialogHeader>
        <form
          onSubmit={form.handleSubmit((data) => mutation.mutate(data))}
          className="space-y-4"
        >
          <FieldGroup>
            <SelectInput
              name="choice"
              control={form.control}
              label="Wird benötigt"
              options={options}
            />
          </FieldGroup>
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
          <DialogBreadcrumb>{breadcrumb}</DialogBreadcrumb>
        </form>
      </DialogContent>
    </Dialog>
  )
}
