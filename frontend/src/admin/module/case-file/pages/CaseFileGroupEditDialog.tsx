import type { ReactNode } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  FormProvider,
  useForm,
  useWatch,
  type Control,
  type FieldValues,
} from 'react-hook-form'
import { toast } from 'sonner'
import type { CaseFileField, CaseFileGroup } from '@/api/types/case-file'
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
import { FormBlocker } from '@/components/form/FormBlocker'
import { ApiValidationError } from '@/lib/api'
import { adoptionQueryKeys } from '@/admin/module/adoptions/api/queries'
import { caseFileQueryKeys } from '../api/queries'
import { updateCaseFile } from '../api/requests'
import { CaseFileFieldInput } from '../components/CaseFileFieldInput'
import {
  fieldApplies,
  isEditable,
  toApiValue,
  type CaseFileValues,
} from '../case-file.utils'

interface FormData {
  values: CaseFileValues
}

interface CaseFileGroupEditDialogProps {
  adoptionId: string
  group: CaseFileGroup
  // Every field of the Case File, for conditions on fields in other groups.
  allFields: CaseFileField[]
  onClose: () => void
  breadcrumb?: ReactNode
}

/**
 * Edits one group of the Case File as the mediator. Conditional fields
 * appear and disappear while typing; only fields that apply are saved.
 */
export function CaseFileGroupEditDialog({
  adoptionId,
  group,
  allFields,
  onClose,
  breadcrumb,
}: CaseFileGroupEditDialogProps) {
  const queryClient = useQueryClient()
  const fieldsByKey = new Map(allFields.map((field) => [field.key, field]))
  const allValues = Object.fromEntries(allFields.map((f) => [f.key, f.value]))

  const form = useForm<FormData>({
    defaultValues: {
      values: Object.fromEntries(
        group.fields
          .filter(isEditable)
          .map((field) => [field.key, field.value ?? ''])
      ),
    },
  })

  const watched = useWatch({ control: form.control, name: 'values' })
  const liveValues = { ...allValues, ...watched }
  const applying = group.fields.filter((field) =>
    fieldApplies(field, liveValues, fieldsByKey)
  )

  const mutation = useMutation({
    mutationFn: (data: FormData) =>
      updateCaseFile(
        adoptionId,
        Object.fromEntries(
          applying
            .filter(isEditable)
            .map((field) => [
              field.key,
              toApiValue(field, data.values[field.key]),
            ])
        )
      ),
    onSuccess: (response) => {
      queryClient.setQueryData(
        caseFileQueryKeys.detail(adoptionId),
        response.data
      )
      // Built-in fields live on the person, which the adoption shows too.
      queryClient.invalidateQueries({
        queryKey: adoptionQueryKeys.detail(adoptionId),
      })
      toast.success(response.message)
      onClose()
    },
    onError: (error) => {
      if (error instanceof ApiValidationError && error.errors) {
        for (const [key, messages] of Object.entries(error.errors)) {
          form.setError(key as `values.${string}`, { message: messages[0] })
        }
      }
      toast.error(error.message)
    },
  })

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{group.title}</DialogTitle>
          <DialogDescription>
            {group.intro ||
              'Angaben ergänzen oder korrigieren, z. B. nach einem Telefonat oder der Vorkontrolle.'}
          </DialogDescription>
        </DialogHeader>
        <FormProvider {...form}>
          <form
            onSubmit={form.handleSubmit(async (data) => {
              // Awaited, so FormBlocker lets the closing navigation pass.
              try {
                await mutation.mutateAsync(data)
                form.reset(data)
              } catch {
                // Shown on the fields by onError.
              }
            })}
            className="space-y-4"
          >
            <FormBlocker />
            <FieldGroup>
              {applying.map((field) => (
                <CaseFileFieldInput
                  key={field.key}
                  field={field}
                  control={form.control as unknown as Control<FieldValues>}
                />
              ))}
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
        </FormProvider>
      </DialogContent>
    </Dialog>
  )
}
