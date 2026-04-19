import { useMutation, useQueryClient } from '@tanstack/react-query'
import { personQueryKeys } from '@/admin/module/people/api/queries.ts'
import {
  uploadPersonPicture,
  deletePersonPicture,
  reorderPersonPictures,
} from '@/admin/module/people/api/requests.ts'
import type { PersonDetailResource } from '@/api/types/people'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/shadcn/components/ui/card.tsx'
import { PictureGallery } from '@/components/pictures/PictureGallery.tsx'
import { toast } from 'sonner'

interface PersonEditPicturesPageProps {
  person: PersonDetailResource
}

export function PersonEditPicturesPage({
  person,
}: PersonEditPicturesPageProps) {
  const queryClient = useQueryClient()

  const invalidate = () =>
    queryClient.invalidateQueries({
      queryKey: personQueryKeys.detail(person.id),
    })

  const uploadMutation = useMutation({
    mutationFn: (files: File[]) =>
      Promise.all(files.map((file) => uploadPersonPicture(person.id, file))),
    onSuccess: async (responses) => {
      await invalidate()
      const count = responses.length
      toast.success(
        count === 1
          ? 'Bild erfolgreich hochgeladen.'
          : `${count} Bilder erfolgreich hochgeladen.`
      )
    },
    onError: () => {
      toast.error('Fehler beim Hochladen der Bilder.')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (pictureId: string) =>
      deletePersonPicture(person.id, pictureId),
    onSuccess: async (response) => {
      await invalidate()
      toast.success(response.message || 'Bild erfolgreich gelöscht.')
    },
    onError: () => {
      toast.error('Fehler beim Löschen des Bildes.')
    },
  })

  const reorderMutation = useMutation({
    mutationFn: (ids: string[]) => reorderPersonPictures(person.id, ids),
    onSuccess: () => invalidate(),
    onError: async () => {
      await invalidate()
      toast.error('Fehler beim Speichern der Reihenfolge.')
    },
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle>Bilder</CardTitle>
      </CardHeader>
      <CardContent>
        <PictureGallery
          pictures={person.pictures ?? []}
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
