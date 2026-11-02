import { useState, type ReactNode } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowDown, ArrowUp, ChevronDown, ChevronRight } from 'lucide-react'
import { toast } from 'sonner'
import type {
  CatalogueField,
  CatalogueGroup,
  CatalogueResource,
} from '@/api/types/case-file-catalogue'
import { PageHeader } from '@/components/layout/PageHeader'
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/shadcn/components/ui/card'
import { Badge } from '@/shadcn/components/ui/badge'
import { Button } from '@/shadcn/components/ui/button'
import { catalogueQueryKeys } from '../api/queries'
import {
  reorderFieldDefinitions,
  reorderFieldGroups,
  type CatalogueResponse,
} from '../api/requests'
import {
  FIELD_TYPE_LABELS,
  conditionSummary,
  moved,
  stepSummary,
} from '../catalogue.utils'

interface CatalogueEditorPageProps {
  catalogue: CatalogueResource
  breadcrumb?: ReactNode
  // Links to the same editor for the other animal types.
  animalTypeLinks: ReactNode
  addGroupAction: ReactNode
  copyAction: ReactNode
  renderGroupActions: (group: CatalogueGroup) => ReactNode
  renderAddFieldAction: (group: CatalogueGroup) => ReactNode
  renderFieldActions: (field: CatalogueField) => ReactNode
}

/**
 * The Case File catalogue of one animal type: what an adoption of this type
 * asks, in which order and from which step on (docs/features/case-file.md).
 */
export function CatalogueEditorPage({
  catalogue,
  breadcrumb,
  animalTypeLinks,
  addGroupAction,
  copyAction,
  renderGroupActions,
  renderAddFieldAction,
  renderFieldActions,
}: CatalogueEditorPageProps) {
  const queryClient = useQueryClient()
  const animalTypeId = catalogue.animal_type.id

  const onReordered = (response: CatalogueResponse) =>
    queryClient.setQueryData(
      catalogueQueryKeys.detail(animalTypeId),
      response.data
    )

  const reorderGroups = useMutation({
    mutationFn: (ids: string[]) => reorderFieldGroups(animalTypeId, ids),
    onSuccess: onReordered,
    onError: (error) => toast.error(error.message),
  })

  const reorderFields = useMutation({
    mutationFn: ({ groupId, ids }: { groupId: string; ids: string[] }) =>
      reorderFieldDefinitions(groupId, ids),
    onSuccess: onReordered,
    onError: (error) => toast.error(error.message),
  })

  const groupIds = catalogue.groups.map((group) => group.id)
  const busy = reorderGroups.isPending || reorderFields.isPending

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumb={breadcrumb}
        title={`Angaben für ${catalogue.animal_type.title}`}
        description="Was eine Vermittlung dieser Tierart erfragt, in welcher Reihenfolge und ab welchem Schritt es gebraucht wird."
        links={animalTypeLinks}
      />

      <div className="flex flex-wrap justify-end gap-2">
        {copyAction}
        {addGroupAction}
      </div>

      {catalogue.groups.map((group, index) => (
        <Card key={group.id}>
          <CardHeader>
            <CardTitle>{group.title}</CardTitle>
            {group.intro && <CardDescription>{group.intro}</CardDescription>}
            <CardAction className="flex flex-wrap justify-end gap-1">
              <OrderButtons
                label={`Abschnitt ${group.title}`}
                isFirst={index === 0}
                isLast={index === catalogue.groups.length - 1}
                disabled={busy}
                onMove={(offset) =>
                  reorderGroups.mutate(moved(groupIds, group.id, offset))
                }
              />
              {renderGroupActions(group)}
            </CardAction>
          </CardHeader>
          <CardContent className="space-y-3">
            <FieldList
              group={group}
              groups={catalogue.groups}
              disabled={busy}
              renderFieldActions={renderFieldActions}
              onMove={(field, offset) =>
                reorderFields.mutate({
                  groupId: group.id,
                  ids: moved(
                    group.fields.map((f) => f.id),
                    field.id,
                    offset
                  ),
                })
              }
            />
            <div className="flex justify-end">
              {renderAddFieldAction(group)}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function FieldList({
  group,
  groups,
  disabled,
  renderFieldActions,
  onMove,
}: {
  group: CatalogueGroup
  groups: CatalogueGroup[]
  disabled: boolean
  renderFieldActions: (field: CatalogueField) => ReactNode
  onMove: (field: CatalogueField, offset: -1 | 1) => void
}) {
  const [showArchived, setShowArchived] = useState(false)
  const active = group.fields.filter((field) => !field.archived_at)
  const archived = group.fields.filter((field) => field.archived_at)

  if (group.fields.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Noch keine Felder in diesem Abschnitt.
      </p>
    )
  }

  return (
    <div className="space-y-2">
      <ul className="divide-y rounded-md border">
        {active.map((field) => {
          // Order buttons move within the full list, archived fields included,
          // so positions stay consistent with what the server stores.
          const index = group.fields.indexOf(field)
          return (
            <li
              key={field.id}
              className="flex flex-col gap-2 p-3 sm:flex-row sm:items-center"
            >
              <FieldSummary field={field} groups={groups} />
              <div className="flex shrink-0 items-center gap-1 self-end sm:self-center">
                <OrderButtons
                  label={field.label}
                  isFirst={index === 0}
                  isLast={index === group.fields.length - 1}
                  disabled={disabled}
                  onMove={(offset) => onMove(field, offset)}
                />
                {renderFieldActions(field)}
              </div>
            </li>
          )
        })}
      </ul>

      {archived.length > 0 && (
        <div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowArchived((show) => !show)}
          >
            {showArchived ? <ChevronDown /> : <ChevronRight />}
            {archived.length} archiviert
          </Button>
          {showArchived && (
            <ul className="divide-y rounded-md border border-dashed">
              {archived.map((field) => (
                <li
                  key={field.id}
                  className="flex flex-col gap-2 p-3 opacity-70 sm:flex-row sm:items-center"
                >
                  <FieldSummary field={field} groups={groups} />
                  <div className="shrink-0 self-end sm:self-center">
                    {renderFieldActions(field)}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}

function FieldSummary({
  field,
  groups,
}: {
  field: CatalogueField
  groups: CatalogueGroup[]
}) {
  const condition = conditionSummary(field, groups)

  if (field.type === 'info') {
    return (
      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline">Hinweis</Badge>
          <span className="text-xs text-muted-foreground">
            {stepSummary(field)}
          </span>
        </div>
        <p className="text-sm text-muted-foreground line-clamp-2">
          {field.label}
        </p>
      </div>
    )
  }

  return (
    <div className="min-w-0 flex-1 space-y-1">
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-medium">{field.label}</span>
        <span className="text-xs text-muted-foreground">
          {FIELD_TYPE_LABELS[field.type]}
        </span>
        {field.built_in && <Badge variant="secondary">Standardfeld</Badge>}
        {field.requires_review && <Badge variant="info">Wird geprüft</Badge>}
        {!field.visible_to_applicant && <Badge variant="outline">Intern</Badge>}
        {!field.visible_to_inspector && (
          <Badge variant="outline">Nicht für Kontrolleure</Badge>
        )}
        {field.archived_at && <Badge variant="outline">Archiviert</Badge>}
      </div>
      <p className="text-xs text-muted-foreground">
        {stepSummary(field)}
        {condition && ` · ${condition}`}
      </p>
    </div>
  )
}

function OrderButtons({
  label,
  isFirst,
  isLast,
  disabled,
  onMove,
}: {
  label: string
  isFirst: boolean
  isLast: boolean
  disabled: boolean
  onMove: (offset: -1 | 1) => void
}) {
  return (
    <>
      <Button
        size="icon-sm"
        variant="ghost"
        disabled={disabled || isFirst}
        onClick={() => onMove(-1)}
        aria-label={`${label} nach oben`}
      >
        <ArrowUp />
      </Button>
      <Button
        size="icon-sm"
        variant="ghost"
        disabled={disabled || isLast}
        onClick={() => onMove(1)}
        aria-label={`${label} nach unten`}
      >
        <ArrowDown />
      </Button>
    </>
  )
}
