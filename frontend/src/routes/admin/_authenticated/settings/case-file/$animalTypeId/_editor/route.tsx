import { createFileRoute, Outlet } from '@tanstack/react-router'
import { useSuspenseQuery } from '@tanstack/react-query'
import { Archive, ArchiveRestore, Copy, Edit, Plus, Trash2 } from 'lucide-react'
import { queryClient } from '@/lib/queryClient'
import { useBreadcrumbs } from '@/router/useBreadcrumbs'
import { BreadcrumbNav } from '@/router/BreadcrumbNav'
import { tabLinkClass } from '@/components/layout/PageHeader'
import { Button } from '@/shadcn/components/ui/button'
import { listAnimalTypesQuery } from '@/admin/module/animal-types/api/queries'
import { getCatalogueQuery } from '@/admin/module/case-file-catalogue/api/queries'
import { CatalogueEditorPage } from '@/admin/module/case-file-catalogue/pages/CatalogueEditorPage'
import { Route as GroupNewRoute } from './group.new'
import { Route as GroupEditRoute } from './group.$groupId.edit'
import { Route as GroupDeleteRoute } from './group.$groupId.delete'
import { Route as FieldArchiveRoute } from './field.$fieldId.archive'
import { Route as CopyRoute } from './copy'
import { Route as FieldNewRoute } from '../field.new.$groupId'
import { Route as FieldEditRoute } from '../field.$fieldId'

export const Route = createFileRoute(
  '/admin/_authenticated/settings/case-file/$animalTypeId/_editor'
)({
  loader: () => queryClient.ensureQueryData(listAnimalTypesQuery),
  component: RouteComponent,
})

function RouteComponent() {
  const breadcrumbs = useBreadcrumbs()
  const { animalTypeId } = Route.useParams()
  const { data: catalogue } = useSuspenseQuery(getCatalogueQuery(animalTypeId))
  const { data: animalTypes } = useSuspenseQuery(listAnimalTypesQuery)

  const sortedTypes = [...animalTypes.data].sort((a, b) =>
    a.title.localeCompare(b.title)
  )

  return (
    <>
      <CatalogueEditorPage
        catalogue={catalogue}
        breadcrumb={<BreadcrumbNav items={breadcrumbs} />}
        animalTypeLinks={sortedTypes.map((type) => (
          <Route.Link
            key={type.id}
            to="/admin/settings/case-file/$animalTypeId"
            params={{ animalTypeId: type.id }}
            className={tabLinkClass}
          >
            {type.title}
          </Route.Link>
        ))}
        copyAction={
          <Button variant="outline" asChild>
            <CopyRoute.Link params={{ animalTypeId }}>
              <Copy />
              Von anderer Tierart kopieren
            </CopyRoute.Link>
          </Button>
        }
        addGroupAction={
          <Button asChild>
            <GroupNewRoute.Link params={{ animalTypeId }}>
              <Plus />
              Abschnitt hinzufügen
            </GroupNewRoute.Link>
          </Button>
        }
        renderGroupActions={(group) => (
          <>
            <Button size="icon-sm" variant="ghost" asChild>
              <GroupEditRoute.Link
                params={{ animalTypeId, groupId: group.id }}
                aria-label={`Abschnitt ${group.title} bearbeiten`}
              >
                <Edit />
              </GroupEditRoute.Link>
            </Button>
            <Button size="icon-sm" variant="ghost" asChild>
              <GroupDeleteRoute.Link
                params={{ animalTypeId, groupId: group.id }}
                aria-label={`Abschnitt ${group.title} löschen`}
              >
                <Trash2 />
              </GroupDeleteRoute.Link>
            </Button>
          </>
        )}
        renderAddFieldAction={(group) => (
          <Button size="sm" variant="outline" asChild>
            <FieldNewRoute.Link params={{ animalTypeId, groupId: group.id }}>
              <Plus />
              Feld hinzufügen
            </FieldNewRoute.Link>
          </Button>
        )}
        renderFieldActions={(field) => (
          <>
            {!field.archived_at && (
              <Button size="icon-sm" variant="ghost" asChild>
                <FieldEditRoute.Link
                  params={{ animalTypeId, fieldId: field.id }}
                  aria-label={`${field.label} bearbeiten`}
                >
                  <Edit />
                </FieldEditRoute.Link>
              </Button>
            )}
            {field.built_in ? (
              // Keeps the buttons of all rows aligned.
              <span className="size-8" aria-hidden />
            ) : (
              <Button size="icon-sm" variant="ghost" asChild>
                <FieldArchiveRoute.Link
                  params={{ animalTypeId, fieldId: field.id }}
                  aria-label={`${field.label} ${field.archived_at ? 'wiederherstellen' : 'archivieren'}`}
                >
                  {field.archived_at ? <ArchiveRestore /> : <Archive />}
                </FieldArchiveRoute.Link>
              </Button>
            )}
          </>
        )}
      />
      <Outlet />
    </>
  )
}
