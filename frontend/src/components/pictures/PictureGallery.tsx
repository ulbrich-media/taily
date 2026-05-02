import { useRef, useState, type ChangeEvent } from 'react'
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
import { Trash2, Upload, Loader2, ImageIcon, Film } from 'lucide-react'
import { Badge } from '@/shadcn/components/ui/badge.tsx'
import Lightbox from 'yet-another-react-lightbox'
import Video from 'yet-another-react-lightbox/plugins/video'
import Download from 'yet-another-react-lightbox/plugins/download'
import 'yet-another-react-lightbox/styles.css'

export interface Picture {
  id: string
  type: 'image' | 'video'
  url: string
  full: string
}

interface SortablePictureProps {
  picture: Picture
  index: number
  isProfilePicture: boolean
  isDeleting: boolean
  onDelete: (id: string) => void
  onOpen: (index: number) => void
}

function SortablePicture({
  picture,
  index,
  isProfilePicture,
  isDeleting,
  onDelete,
  onOpen,
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
      className="relative group aspect-square bg-muted rounded-lg overflow-hidden"
      {...(picture.type === 'video' ? attributes : {})}
      onClick={() => onOpen(index)}
    >
      {picture.type === 'video' ? (
        <video
          src={picture.url}
          className="w-full h-full object-cover cursor-grab active:cursor-grabbing select-none"
          preload="metadata"
          muted
          playsInline
          draggable={false}
          {...listeners}
        />
      ) : (
        <img
          src={picture.url}
          alt=""
          className="w-full h-full object-cover cursor-grab active:cursor-grabbing select-none"
          draggable={false}
          {...attributes}
          {...listeners}
        />
      )}
      <div className="absolute top-4 left-4 z-10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
        {picture.type === 'video' ? (
          <Film className="size-5 text-white drop-shadow" />
        ) : (
          <ImageIcon className="size-5 text-white drop-shadow" />
        )}
      </div>
      {isProfilePicture && (
        <span className="absolute bottom-2 left-2">
          <Badge variant="secondary">Profilbild</Badge>
        </span>
      )}
      {/* Stop propagation so the delete button doesn't trigger the lightbox */}
      <div onClick={(e) => e.stopPropagation()}>
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
  acceptVideo?: boolean
}

export function PictureGallery({
  pictures,
  onUpload,
  onDelete,
  onReorder,
  isUploading = false,
  isDeleting = false,
  acceptVideo = false,
}: PictureGalleryProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [sortOrder, setSortOrder] = useState<string[]>([])
  const [lightboxIndex, setLightboxIndex] = useState(-1)

  // Require 5px of movement before activating drag so taps open the lightbox.
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  )

  const pictureIds = pictures.map((p) => p.id)
  const pictureIdSet = new Set(pictureIds)

  const isSortOrderValid =
    sortOrder.length === pictureIds.length &&
    sortOrder.every((id) => pictureIdSet.has(id))

  const effectiveOrder = isSortOrderValid ? sortOrder : pictureIds

  const firstImageId = effectiveOrder.find(
    (id) => pictures.find((p) => p.id === id)?.type === 'image'
  )

  // Build slides in visual order for YARL — use full-size URLs for both display and download
  const slides = effectiveOrder.map((id) => {
    const picture = pictures.find((p) => p.id === id)!
    if (picture.type === 'video') {
      return {
        type: 'video' as const,
        sources: [{ src: picture.full, type: 'video/mp4' }],
        download: picture.full,
      }
    }
    return { src: picture.full, download: picture.full }
  })

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
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
          accept={acceptVideo ? 'image/*,video/*' : 'image/*'}
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
        <>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={effectiveOrder}
              strategy={rectSortingStrategy}
            >
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
                {effectiveOrder.map((id, index) => {
                  const picture = pictures.find((p) => p.id === id)!
                  return (
                    <SortablePicture
                      key={picture.id}
                      picture={picture}
                      index={index}
                      isProfilePicture={picture.id === firstImageId}
                      isDeleting={isDeleting}
                      onDelete={onDelete}
                      onOpen={setLightboxIndex}
                    />
                  )
                })}
              </div>
            </SortableContext>
          </DndContext>

          <Lightbox
            open={lightboxIndex >= 0}
            index={lightboxIndex}
            close={() => setLightboxIndex(-1)}
            slides={slides}
            plugins={[Video, Download]}
          />
        </>
      )}
    </div>
  )
}
