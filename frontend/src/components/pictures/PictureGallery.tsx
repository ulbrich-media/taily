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
import { Trash2, Upload, Loader2, Play } from 'lucide-react'

export interface Picture {
  id: string
  type: 'image' | 'video'
  url: string
}

interface SortablePictureProps {
  picture: Picture
  cssOrder: number
  isProfilePicture: boolean
  isDeleting: boolean
  onDelete: (id: string) => void
}

function SortablePicture({
  picture,
  cssOrder,
  isProfilePicture,
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
    order: cssOrder,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="relative group aspect-square"
      {...(picture.type === 'video' ? attributes : {})}
    >
      {picture.type === 'video' ? (
        <>
          <video
            src={picture.url}
            className="w-full h-full object-cover rounded-lg select-none"
            preload="metadata"
            muted
            playsInline
            draggable={false}
          />
          {/* Transparent drag handle covering the tile */}
          <div
            className="absolute inset-0 rounded-lg cursor-grab active:cursor-grabbing"
            {...listeners}
          />
          {/* Play icon to signal this is a video */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <Play className="size-10 text-white opacity-80 drop-shadow-lg" />
          </div>
        </>
      ) : (
        <img
          src={picture.url}
          alt=""
          className="w-full h-full object-cover rounded-lg cursor-grab active:cursor-grabbing select-none"
          draggable={false}
          {...attributes}
          {...listeners}
        />
      )}
      {isProfilePicture && (
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
            className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity"
            disabled={isDeleting}
          >
            {isDeleting ? (
              <Loader2 className="size-3 animate-spin" />
            ) : (
              <Trash2 className="size-3" />
            )}
            <span className="sr-only">Medium löschen</span>
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent size="sm">
          <AlertDialogHeader>
            <AlertDialogTitle>Medium löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              Dieses Medium wird unwiderruflich gelöscht.
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

  // Tracks visual order as an array of IDs. Kept separate from pictures so the
  // DOM order of rendered items never changes — only the CSS `order` property
  // does. This prevents Firefox from reinitialising <video> elements when the
  // list is sorted.
  const [sortOrder, setSortOrder] = useState<string[]>([])

  // Reset optimistic order whenever the source-of-truth updates (after query invalidation)
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSortOrder([])
  }, [pictures])

  const sensors = useSensors(useSensor(PointerSensor))

  // The display order: either the optimistic sort or the server order
  const effectiveOrder =
    sortOrder.length > 0 ? sortOrder : pictures.map((p) => p.id)

  // Map from id → visual position index (used for CSS `order` and profile badge)
  const orderIndex = Object.fromEntries(effectiveOrder.map((id, i) => [id, i]))

  // Profile picture = first image in visual order
  const firstImageId = effectiveOrder.find(
    (id) => pictures.find((p) => p.id === id)?.type === 'image'
  )

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

    const reordered = arrayMove(
      effectiveOrder,
      effectiveOrder.indexOf(String(active.id)),
      effectiveOrder.indexOf(String(over.id))
    )

    setSortOrder(reordered)
    onReorder(reordered)
  }

  return (
    <div className="space-y-6">
      <div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*"
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
              Medien hochladen
            </>
          )}
        </Button>
      </div>

      {pictures.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Noch keine Medien vorhanden.
        </p>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={effectiveOrder} strategy={rectSortingStrategy}>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
              {pictures.map((picture) => (
                <SortablePicture
                  key={picture.id}
                  picture={picture}
                  cssOrder={orderIndex[picture.id] ?? 0}
                  isProfilePicture={picture.id === firstImageId}
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
