import { useEffect, useRef, useState } from 'react'
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  useSortable,
  rectSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Button } from '@/shadcn/components/ui/button.tsx'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/shadcn/components/ui/alert-dialog.tsx'
import { Trash2, Upload, Loader2 } from 'lucide-react'

export interface Picture {
  id: string
  url: string
}

interface SortablePictureProps {
  picture: Picture
  isFirst: boolean
  isDeleting: boolean
  onDelete: (id: string) => void
}

function SortablePicture({
  picture,
  isFirst,
  isDeleting,
  onDelete,
}: SortablePictureProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: picture.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="relative group aspect-square"
    >
      <img
        src={picture.url}
        alt=""
        className="w-full h-full object-cover rounded-lg cursor-grab active:cursor-grabbing select-none"
        draggable={false}
        {...attributes}
        {...listeners}
      />
      {isFirst && (
        <span className="absolute bottom-2 left-2 text-xs font-medium bg-black/60 text-white rounded px-1.5 py-0.5 pointer-events-none">
          Profilbild
        </span>
      )}
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
            disabled={isDeleting}
          >
            {isDeleting ? (
              <Loader2 className="size-3 animate-spin" />
            ) : (
              <Trash2 className="size-3" />
            )}
            <span className="sr-only">Bild löschen</span>
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent size="sm">
          <AlertDialogHeader>
            <AlertDialogTitle>Bild löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              Dieses Bild wird unwiderruflich gelöscht.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => onDelete(picture.id)}
            >
              Löschen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export interface PictureGalleryProps {
  pictures: Picture[]
  onUpload: (files: File[]) => void
  onDelete: (pictureId: string) => void
  onReorder: (ids: string[]) => void
  isUploading?: boolean
  isDeleting?: boolean
}

export function PictureGallery({
  pictures,
  onUpload,
  onDelete,
  onReorder,
  isUploading = false,
  isDeleting = false,
}: PictureGalleryProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [localPictures, setLocalPictures] = useState<Picture[] | null>(null)
  const displayPictures = localPictures ?? pictures

  // Reset optimistic state whenever the source-of-truth updates (after query invalidation)
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLocalPictures(null)
  }, [pictures])

  const sensors = useSensors(useSensor(PointerSensor))

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    if (files.length > 0) {
      onUpload(files)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = displayPictures.findIndex((p) => p.id === active.id)
    const newIndex = displayPictures.findIndex((p) => p.id === over.id)
    const reordered = arrayMove(displayPictures, oldIndex, newIndex)

    setLocalPictures(reordered)
    onReorder(reordered.map((p) => p.id))
  }

  return (
    <div className="space-y-6">
      <div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="sr-only"
          onChange={handleFileChange}
          disabled={isUploading}
        />
        <Button
          type="button"
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
        >
          {isUploading ? (
            <>
              <Loader2 className="mr-2 size-4 animate-spin" />
              Wird hochgeladen...
            </>
          ) : (
            <>
              <Upload className="mr-2 size-4" />
              Bilder hochladen
            </>
          )}
        </Button>
      </div>

      {displayPictures.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Noch keine Bilder vorhanden.
        </p>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={displayPictures.map((p) => p.id)}
            strategy={rectSortingStrategy}
          >
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
              {displayPictures.map((picture, index) => (
                <SortablePicture
                  key={picture.id}
                  picture={picture}
                  isFirst={index === 0}
                  isDeleting={isDeleting}
                  onDelete={onDelete}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  )
}
