import { useMutation, useQueryClient } from '@tanstack/react-query'
import { animalQueryKeys } from '@/admin/module/animals/api/queries.ts'
import {
  uploadAnimalPicture,
  deleteAnimalPicture,
  reorderAnimalPictures,
} from '@/admin/module/animals/api/requests.ts'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/shadcn/components/ui/card.tsx'
import { PictureGallery } from '@/components/pictures/PictureGallery.tsx'
import { toast } from 'sonner'
import type { AnimalDetailResource } from '@/api/types/animals'

interface AnimalEditPicturesPageProps {
  animal: AnimalDetailResource
}

export function AnimalEditPicturesPage({
  animal,
}: AnimalEditPicturesPageProps) {
  const queryClient = useQueryClient()

  const invalidate = () =>
    queryClient.invalidateQueries({
      queryKey: animalQueryKeys.detail(animal.id),
    })

  const uploadMutation = useMutation({
    mutationFn: (files: File[]) =>
      Promise.all(files.map((file) => uploadAnimalPicture(animal.id, file))),
    onSuccess: async (responses) => {
      await invalidate()
      const count = responses.length
      toast.success(
        count === 1
          ? 'Medium erfolgreich hochgeladen.'
          : `${count} Medien erfolgreich hochgeladen.`
      )
    },
    onError: () => {
      toast.error('Fehler beim Hochladen der Bilder.')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (pictureId: string) =>
      deleteAnimalPicture(animal.id, pictureId),
    onSuccess: async (response) => {
      await invalidate()
      toast.success(response.message || 'Bild erfolgreich gelöscht.')
    },
    onError: () => {
      toast.error('Fehler beim Löschen des Bildes.')
    },
  })

  const reorderMutation = useMutation({
    mutationFn: (ids: string[]) => reorderAnimalPictures(animal.id, ids),
    onSuccess: () => invalidate(),
    onError: async () => {
      await invalidate()
      toast.error('Fehler beim Speichern der Reihenfolge.')
    },
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle>Medien</CardTitle>
      </CardHeader>
      <CardContent>
        <PictureGallery
          pictures={animal.pictures ?? []}
          onUpload={(files) => uploadMutation.mutate(files)}
          onDelete={(id) => deleteMutation.mutate(id)}
          onReorder={(ids) => reorderMutation.mutate(ids)}
          isUploading={uploadMutation.isPending}
          isDeleting={deleteMutation.isPending}
        />
      </CardContent>
    </Card>
  )
}
