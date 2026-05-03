import { useRef, useState, type ChangeEvent, type CSSProperties } from 'react'
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
  AlertDialogMedia,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/shadcn/components/ui/alert-dialog.tsx'
import {
  Trash2,
  Upload,
  Loader2,
  Download,
  Maximize2,
  GripVertical,
  Play,
  X,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { Badge } from '@/shadcn/components/ui/badge.tsx'
import Lightbox from 'yet-another-react-lightbox'
import VideoPlugin from 'yet-another-react-lightbox/plugins/video'
import 'yet-another-react-lightbox/styles.css'
import { ButtonGroup } from '@/shadcn/components/ui/button-group.tsx'
import { toast } from 'sonner'

async function triggerDownload(url: string) {
  let blobUrl: string | undefined
  let a: HTMLAnchorElement | undefined
  try {
    const response = await fetch(url)
    if (!response.ok) {
      console.error(`Download failed: ${response.status}`)
      toast.error(`Download failed`)
      return
    }
    const blob = await response.blob()
    blobUrl = URL.createObjectURL(blob)
    a = document.createElement('a')
    a.href = blobUrl
    a.download = url.split('/').pop() ?? 'download'
    document.body.appendChild(a)
    a.click()
  } catch (error) {
    console.error(error)
    toast.error(`Download failed`)
  } finally {
    setTimeout(() => {
      if (blobUrl) URL.revokeObjectURL(blobUrl)
      if (a) document.body.removeChild(a)
    }, 1000)
  }
}

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

  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : undefined,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="border border-border bg-background rounded-lg"
    >
      {/* Media — click opens lightbox */}
      <div
        className="relative aspect-square cursor-pointer"
        onClick={() => onOpen(index)}
      >
        {picture.type === 'video' ? (
          <video
            src={picture.url}
            className="w-full h-full object-cover select-none rounded-lg"
            preload="metadata"
            muted
            playsInline
            draggable={false}
          />
        ) : (
          <img
            src={picture.url}
            alt=""
            className="w-full h-full object-cover select-none rounded-lg"
            draggable={false}
          />
        )}
        {picture.type === 'video' && (
          <div className="absolute inset-0 bottom-10 flex items-center justify-center pointer-events-none">
            <div className="rounded-full bg-black/50 p-3">
              <Play className="size-6 text-white fill-white" />
            </div>
          </div>
        )}
        {isProfilePicture && (
          <Badge className="absolute top-1 left-1" variant="secondary">
            Profilbild
          </Badge>
        )}

        <ButtonGroup
          className="absolute bottom-1 inset-x-1 w-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <ButtonGroup>
            <Button
              type="button"
              variant="secondary"
              size="icon"
              className="cursor-grab active:cursor-grabbing touch-none backdrop-blur-xs"
              {...attributes}
              {...listeners}
            >
              <GripVertical />
              <span className="sr-only">Sortieren</span>
            </Button>

            {/* Open lightbox */}
            <Button
              type="button"
              variant="secondary"
              size="icon"
              className="backdrop-blur-xs"
              onClick={() => onOpen(index)}
            >
              <Maximize2 />
              <span className="sr-only">Vergrößern</span>
            </Button>

            {/* Download */}
            <Button
              type="button"
              variant="secondary"
              size="icon"
              className="backdrop-blur-xs"
              onClick={() => triggerDownload(picture.full)}
            >
              <Download />
              <span className="sr-only">Herunterladen</span>
            </Button>
          </ButtonGroup>

          <div className="flex-1"></div>

          <ButtonGroup>
            {/* Delete */}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="backdrop-blur-xs"
                  disabled={isDeleting}
                >
                  {isDeleting ? (
                    <Loader2 className="animate-spin" />
                  ) : (
                    <Trash2 />
                  )}
                  <span className="sr-only">Medium löschen</span>
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent size="sm">
                <AlertDialogHeader>
                  <AlertDialogMedia>
                    <Trash2 />
                  </AlertDialogMedia>
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
          </ButtonGroup>
        </ButtonGroup>
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

  const sensors = useSensors(useSensor(PointerSensor))

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
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 xl:grid-cols-4">
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
            plugins={[VideoPlugin]}
            video={{ muted: true, autoPlay: true, controls: true }}
            controller={{ closeOnPullDown: true, closeOnBackdropClick: true }}
            render={{
              iconClose: () => <X className="size-6" />,
              iconPrev: () => <ChevronLeft className="size-6" />,
              iconNext: () => <ChevronRight className="size-6" />,
              iconLoading: () => <Loader2 className="size-6 animate-spin" />,
            }}
          />
        </>
      )}
    </div>
  )
}
