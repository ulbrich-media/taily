import { useMutation, useQueryClient } from '@tanstack/react-query'
import { AlertTriangle } from 'lucide-react'
import { animalTypeQueryKeys } from '@/admin/module/animal-types/api/queries'
import { deleteAnimalType } from '@/admin/module/animal-types/api/requests'
import type { AnimalTypeResource } from '@/api/types/animal-types'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardTitleIcon,
} from '@/shadcn/components/ui/card'
import { Button } from '@/shadcn/components/ui/button'
import { toast } from 'sonner'

interface AnimalTypeDeletePageProps {
  animalType: AnimalTypeResource
  onClose: () => void
  /** Called instead of onClose once the type is deleted. */
  onDeleted?: () => void
}

export function AnimalTypeDeletePage({
  animalType,
  onClose,
  onDeleted,
}: AnimalTypeDeletePageProps) {
  const queryClient = useQueryClient()

  const deleteMutation = useMutation({
    mutationFn: deleteAnimalType,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: animalTypeQueryKeys.list })
      toast.success(data.message)
      // The open page belongs to the deleted type, so leave it for the list.
      const leave = onDeleted ?? onClose
      leave()
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle variant="destructive">Tierart löschen</CardTitle>
        <CardTitleIcon icon={AlertTriangle} />
        <CardDescription>
          Bist du sicher, dass du diese Tierart löschen möchtest? Dieser Vorgang
          kann nicht rückgängig gemacht werden!
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <h4 className="font-medium mb-2">Folgende Daten werden gelöscht:</h4>
          <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
            <li>Name: {animalType.title}</li>
          </ul>
        </div>

        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={deleteMutation.isPending}
          >
            Abbrechen
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={() => deleteMutation.mutate(animalType.id)}
            disabled={deleteMutation.isPending}
          >
            {deleteMutation.isPending ? 'Lösche...' : 'Ja, löschen'}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
