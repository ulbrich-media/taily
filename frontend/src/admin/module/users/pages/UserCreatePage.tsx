import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm, FormProvider } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { userQueryKeys } from '@/admin/module/users/api/queries'
import { createUser } from '@/admin/module/users/api/requests'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shadcn/components/ui/dialog'
import { Button } from '@/shadcn/components/ui/button'
import { UserPlus } from 'lucide-react'
import { FieldGroup } from '@/shadcn/components/ui/field'
import { toast } from 'sonner'
import { UserRole } from '@/api/types/users'
import { FormBlocker } from '@/components/form/FormBlocker'
import { TextInput } from '@/components/field/TextInput'
import { SelectInput } from '@/components/field/SelectInput'
import { zFieldString } from '@/components/field/TextInput.utils.ts'

const createUserSchema = z.object({
  name: zFieldString({ required: true }),
  email: z
    .email('Bitte gib eine gültige E-Mail Adresse ein')
    .max(255, 'E-Mail darf maximal 255 Zeichen lang sein')
    .trim()
    .or(z.literal('')),
  role: z.enum(UserRole, {
    error: 'Bitte wähle eine Rolle aus',
  }),
})

type CreateUserFormData = z.infer<typeof createUserSchema>

interface UserCreatePageProps {
  onClose: () => void
}

export function UserCreatePage({ onClose }: UserCreatePageProps) {
  const queryClient = useQueryClient()

  const [keepOpen, setKeepOpen] = useState(false)

  const form = useForm<CreateUserFormData>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      name: '',
      email: '',
      role: UserRole.User,
    },
  })

  const createMutation = useMutation({
    mutationFn: createUser,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: userQueryKeys.list })
      toast.success(data.message)

      if (keepOpen) {
        form.reset({
          name: '',
          email: '',
          role: UserRole.User,
        })
        setKeepOpen(false)
      } else {
        onClose()
      }
    },
    onError: (error) => {
      toast.error(
        error instanceof Error
          ? error.message
          : 'Fehler beim Erstellen des Benutzers'
      )
    },
  })

  const onSubmit = async (data: CreateUserFormData) => {
    await createMutation.mutateAsync(data)
  }

  const handleSaveAndNew = () => {
    setKeepOpen(true)
    form.handleSubmit(onSubmit)()
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-primary" />
            Neuen Benutzer erstellen
          </DialogTitle>
          <DialogDescription>
            Erstelle einen neuen Benutzer. Eine E-Mail zur Einladung wird
            automatisch versendet.
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
                placeholder="Rolle auswählen"
              />
            </FieldGroup>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={createMutation.isPending}
              >
                Abbrechen
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={handleSaveAndNew}
                disabled={createMutation.isPending}
              >
                {createMutation.isPending && keepOpen
                  ? 'Erstelle...'
                  : 'Speichern und Neu'}
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending && !keepOpen
                  ? 'Erstelle...'
                  : 'Speichern'}
              </Button>
            </DialogFooter>
          </form>
        </FormProvider>
      </DialogContent>
    </Dialog>
  )
}
