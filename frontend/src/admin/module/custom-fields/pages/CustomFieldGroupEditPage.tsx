import type { ReactNode } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import type { CustomFieldGroupResource } from '@/api/types/custom-fields'
import type { AnimalTypeResource } from '@/api/types/animal-types'
import type { FormTemplateResource } from '@/api/types/form-templates'
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
import { Mark } from '@/components/typo/mark'
import { formTemplateQueryKeys } from '@/admin/module/form-templates/api/queries'
import { customFieldQueryKeys } from '../api/queries'
import { createCustomFieldGroup, updateCustomFieldGroup } from '../api/requests'
import type { CustomFieldGroupInput } from '../api/types'
import { CustomFieldGroupForm } from '../components/CustomFieldGroupForm'

interface CustomFieldGroupEditPageProps {
  /** Omitted on create. */
  group?: CustomFieldGroupResource
  animalTypes: AnimalTypeResource[]
  formTemplates: FormTemplateResource[]
  onClose: () => void
  breadcrumb?: ReactNode
}

/** Create and edit dialog of a Field Group. */
export function CustomFieldGroupEditPage({
  group,
  animalTypes,
  formTemplates,
  onClose,
  breadcrumb,
}: CustomFieldGroupEditPageProps) {
  const queryClient = useQueryClient()

  const saveMutation = useMutation({
    mutationFn: (data: CustomFieldGroupInput) =>
      group
        ? updateCustomFieldGroup(group.id, data)
        : createCustomFieldGroup(data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: customFieldQueryKeys.all })
      // Templates show where they are bound.
      queryClient.invalidateQueries({ queryKey: formTemplateQueryKeys.all })
      toast.success(response.message)
      onClose()
    },
    onError: (error) => {
      toast.error(error.message || 'Fehler beim Speichern der Feldgruppe')
    },
  })

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {group ? (
              <>
                <Mark>{group.title}</Mark> bearbeiten
              </>
            ) : (
              'Zusatzfelder hinzufügen'
            )}
          </DialogTitle>
          <DialogDescription>
            Binde eine Formularvorlage als Zusatzfelder an Tiere oder Personen.
          </DialogDescription>
        </DialogHeader>
        <CustomFieldGroupForm
          group={group}
          animalTypes={animalTypes}
          formTemplates={formTemplates}
          onSubmit={async (data) => {
            await saveMutation.mutateAsync(data)
          }}
          footer={
            <>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  disabled={saveMutation.isPending}
                >
                  Abbrechen
                </Button>
                <Button type="submit" disabled={saveMutation.isPending}>
                  {saveMutation.isPending ? 'Speichert...' : 'Speichern'}
                </Button>
              </DialogFooter>
              <DialogBreadcrumb>{breadcrumb}</DialogBreadcrumb>
            </>
          }
        />
      </DialogContent>
    </Dialog>
  )
}
