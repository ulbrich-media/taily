import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm, FormProvider } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { userQueryKeys } from '@/admin/module/users/api/queries'
import { updateUser } from '@/admin/module/users/api/requests'
import type { UserResource } from '@/api/types/users'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shadcn/components/ui/dialog'
import { Button } from '@/shadcn/components/ui/button'
import { Edit } from 'lucide-react'
import { FieldGroup } from '@/shadcn/components/ui/field'
import { toast } from 'sonner'
import { UserRole } from '@/api/types/users'
import { FormBlocker } from '@/components/form/FormBlocker'
import { TextInput } from '@/components/field/TextInput'
import { SelectInput } from '@/components/field/SelectInput'

const updateUserSchema = z.object({
  name: z
    .string()
    .min(1, 'Bitte gib einen Namen ein')
    .max(255, 'Der Name darf maximal 255 Zeichen lang sein')
    .trim(),
  email: z
    .email('Bitte gib eine gültige E-Mail Adresse ein')
    .min(1, 'Bitte gib eine E-Mail Adresse ein')
    .max(255, 'Die E-Mail Adresse darf maximal 255 Zeichen lang sein')
    .trim(),
  role: z.enum(UserRole, {
    error: 'Bitte wähle eine Rolle aus',
  }),
})

type UpdateUserFormData = z.infer<typeof updateUserSchema>

interface UserEditPageProps {
  user: UserResource
  onClose: () => void
}

export function UserEditPage({ user, onClose }: UserEditPageProps) {
  const queryClient = useQueryClient()

  const form = useForm<UpdateUserFormData>({
    resolver: zodResolver(updateUserSchema),
    defaultValues: {
      name: user.name,
      email: user.email,
      role: user.role,
    },
  })

  const updateMutation = useMutation({
    mutationFn: (data: UpdateUserFormData) => updateUser(user.id, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: userQueryKeys.list })
      toast.success(data.message)
      onClose()
    },
    onError: (error) => {
      toast.error(
        error instanceof Error
          ? error.message
          : 'Fehler beim Aktualisieren des Benutzers'
      )
    },
  })

  const onSubmit = async (data: UpdateUserFormData) => {
    await updateMutation.mutateAsync(data)
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="h-5 w-5 text-primary" />
            Benutzer bearbeiten
          </DialogTitle>
          <DialogDescription>
            Bearbeite die Benutzerdaten und Berechtigungen.
          </DialogDescription>
        </DialogHeader>
        <FormProvider {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormBlocker />

            <FieldGroup>
              <TextInput
                name="name"
                control={form.control}
                label="Name"
                required
              />

              <TextInput
                name="email"
                control={form.control}
                label="E-Mail"
                required
              />

              <SelectInput
                name="role"
                control={form.control}
                label="Rolle"
                required
                options={[
                  { value: UserRole.User, label: 'Benutzer' },
                  { value: UserRole.Admin, label: 'Administrator' },
                ]}
              />
            </FieldGroup>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={updateMutation.isPending}
              >
                Abbrechen
              </Button>
              <Button type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? 'Aktualisiere...' : 'Speichern'}
              </Button>
            </DialogFooter>
          </form>
        </FormProvider>
      </DialogContent>
    </Dialog>
  )
}
