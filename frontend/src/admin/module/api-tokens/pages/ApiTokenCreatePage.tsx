import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Controller, useForm, FormProvider } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { apiTokenQueryKeys } from '@/admin/module/api-tokens/api/queries.ts'
import { createApiToken } from '@/admin/module/api-tokens/api/requests.ts'
import type { ApiAbility } from '@/admin/module/api-tokens/api/types.ts'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shadcn/components/ui/dialog.tsx'
import { Button } from '@/shadcn/components/ui/button.tsx'
import { CopyIcon, KeyIcon } from 'lucide-react'
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from '@/shadcn/components/ui/field.tsx'
import { Checkbox } from '@/shadcn/components/ui/checkbox.tsx'
import { Badge } from '@/shadcn/components/ui/badge.tsx'
import { toast } from 'sonner'
import { FormBlocker } from '@/components/form/FormBlocker'
import { TextInput } from '@/components/field/TextInput'
import { zFieldString } from '@/components/field/TextInput.utils.ts'

const createTokenSchema = z.object({
  name: zFieldString({ required: true }),
  abilities: z
    .array(z.string())
    .min(1, 'Mindestens eine Berechtigung muss ausgewählt werden'),
})

type CreateTokenFormData = z.infer<typeof createTokenSchema>

interface ApiTokenCreatePageProps {
  abilities: ApiAbility
  onClose: () => void
}

export function ApiTokenCreatePage({
  abilities,
  onClose,
}: ApiTokenCreatePageProps) {
  const queryClient = useQueryClient()

  const [createdToken, setCreatedToken] = useState<string | null>(null)

  const form = useForm<CreateTokenFormData>({
    resolver: zodResolver(createTokenSchema),
    defaultValues: {
      name: '',
      abilities: [],
    },
  })

  const createMutation = useMutation({
    mutationFn: createApiToken,
    onSuccess: (data) => {
      setCreatedToken(data.data.token)
      queryClient.invalidateQueries({ queryKey: apiTokenQueryKeys.list })
    },
  })

  const onSubmit = async (data: CreateTokenFormData) => {
    await createMutation.mutateAsync(data)
  }

  const handleCopyToken = async () => {
    if (createdToken) {
      await navigator.clipboard.writeText(createdToken)
      toast.success('Token wurde kopiert')
    }
  }

  if (createdToken) {
    return (
      <Dialog open onOpenChange={onClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <KeyIcon className="h-5 w-5 text-primary" />
              API Token erfolgreich erstellt
            </DialogTitle>
            <DialogDescription>
              Bitte kopiere den Token jetzt. <br />
              <span className="text-destructive">
                Aus Sicherheitsgründen kann er später nicht mehr angezeigt
                werden.
              </span>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-muted p-4 rounded-md">
              <code className="text-sm break-all font-mono">
                {createdToken}
              </code>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleCopyToken}>
              <CopyIcon className="h-4 w-4" />
              Token kopieren
            </Button>
            <Button onClick={onClose} variant="secondary">
              Fertig
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <KeyIcon className="h-5 w-5 text-primary" />
            Neues API Token erstellen
          </DialogTitle>
          <DialogDescription>
            Erstelle ein neues API Token für den externen Zugriff auf die API.
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

              <Controller
                name="abilities"
                control={form.control}
                render={({ field, fieldState }) => (
                  <FieldSet data-invalid={fieldState.invalid}>
                    <FieldLegend variant="label">Berechtigungen</FieldLegend>
                    <FieldDescription>
                      Wähle aus auf welche Daten und Funktionen zugegriffen
                      werden darf.
                    </FieldDescription>
                    <FieldGroup data-slot="checkbox-group">
                      {Object.entries(abilities).map(
                        ([abilityKey, abilityName]) => (
                          <Field
                            key={abilityKey}
                            orientation="horizontal"
                            data-invalid={fieldState.invalid}
                          >
                            <Checkbox
                              id={`form-rhf-checkbox-${abilityKey}`}
                              name={field.name}
                              aria-invalid={fieldState.invalid}
                              checked={field.value.includes(abilityKey)}
                              onCheckedChange={(checked) => {
                                const newValue = checked
                                  ? [...field.value, abilityKey]
                                  : field.value.filter(
                                      (value) => value !== abilityKey
                                    )
                                field.onChange(newValue)
                              }}
                            />
                            <FieldContent>
                              <FieldLabel
                                htmlFor={`form-rhf-checkbox-${abilityKey}`}
                                className="flex flex-col gap-1 items-start"
                              >
                                <Badge>{abilityKey}</Badge>
                              </FieldLabel>
                              <FieldDescription>{abilityName}</FieldDescription>
                            </FieldContent>
                          </Field>
                        )
                      )}
                    </FieldGroup>
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </FieldSet>
                )}
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
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? 'Erstelle...' : 'Token erstellen'}
              </Button>
            </DialogFooter>
          </form>
        </FormProvider>
      </DialogContent>
    </Dialog>
  )
}
