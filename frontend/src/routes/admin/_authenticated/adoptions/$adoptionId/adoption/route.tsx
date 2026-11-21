import { createFileRoute, Outlet } from '@tanstack/react-router'
import { useSuspenseQuery, useQuery } from '@tanstack/react-query'
import {
  getAdoptionQuery,
  getRelatedAdoptionsQuery,
} from '@/admin/module/adoptions/api/queries'
import { RelatedAdoptionsCard } from '@/admin/module/adoptions/components/RelatedAdoptionsCard'
import {
  listPreInspectionsByAdoptionQuery,
  listRelatedPreInspectionsQuery,
} from '@/admin/module/pre-inspections/api/queries'
import { getCaseFileQuery } from '@/admin/module/case-file/api/queries'
import { CaseFileSummaryCard } from '@/admin/module/case-file/components/CaseFileSummaryCard'
import { PreInspectionConfirmAction } from '@/admin/module/case-file/components/PreInspectionConfirmAction'
import { AdoptionDetailPage } from '@/admin/module/adoptions/pages/AdoptionDetailPage'
import { Button } from '@/shadcn/components/ui/button'
import {
  Ban,
  ChevronDown,
  CopyPlus,
  Edit,
  FileUp,
  PlusCircle,
  ListChecks,
  RotateCcw,
  Send,
  Truck,
  X,
} from 'lucide-react'
import { ButtonGroup } from '@/shadcn/components/ui/button-group'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/shadcn/components/ui/dropdown-menu'
import { Route as InternalNotesRoute } from '@/routes/admin/_authenticated/adoptions/$adoptionId/adoption/internal-notes'
import { Route as PreInspectionRoute } from '@/routes/admin/_authenticated/adoptions/$adoptionId/adoption/pre-inspection'
import { Route as NewInspectionRoute } from '@/routes/admin/_authenticated/adoptions/$adoptionId/adoption/new-inspection'
import { Route as ContractRoute } from '@/routes/admin/_authenticated/adoptions/$adoptionId/adoption/contract'
import { Route as ContractSigningRoute } from '@/routes/admin/_authenticated/adoptions/$adoptionId/adoption/contract-signing'
import { Route as ContractSigningCancelRoute } from '@/routes/admin/_authenticated/adoptions/$adoptionId/adoption/contract-signing-cancel'
import { Route as CancelRoute } from '@/routes/admin/_authenticated/adoptions/$adoptionId/adoption/cancel'
import { Route as ReopenRoute } from '@/routes/admin/_authenticated/adoptions/$adoptionId/adoption/reopen'
import { Route as TransportAssignRoute } from '@/routes/admin/_authenticated/adoptions/$adoptionId/adoption/transport-assign'
import { Route as TransportRemoveRoute } from '@/routes/admin/_authenticated/adoptions/$adoptionId/adoption/transport-remove'
import { Route as InspectionDetailRoute } from '@/routes/admin/_authenticated/adoptions/$adoptionId/pre-inspections/$preInspectionId/index'
import { Route as ImportRoute } from '@/routes/admin/_authenticated/adoptions/$adoptionId/adoption/import.$fromAdoptionId'
import { Route as AdoptionOverviewRoute } from '@/routes/admin/_authenticated/adoptions/$adoptionId/index'
import { Route as CaseFileRoute } from '@/routes/admin/_authenticated/adoptions/$adoptionId/case-file/index'
import { Route as AnimalRoute } from '@/routes/admin/_authenticated/animals/_animalDetail/$animalTypeId.animal.$animalId/index'
import { Route as PersonRoute } from '@/routes/admin/_authenticated/people/$id/index'
import type { PreInspectionResource } from '@/api/types/pre-inspections'
import type { ChecklistItem } from '@/api/types/case-file'
import { Spinner } from '@/shadcn/components/ui/spinner'

export const Route = createFileRoute(
  '/admin/_authenticated/adoptions/$adoptionId/adoption'
)({
  component: RouteComponent,
})

function RouteComponent() {
  const { adoptionId } = Route.useParams()
  const { data: adoption } = useSuspenseQuery(getAdoptionQuery(adoptionId))

  const {
    data: inspectionsData,
    isLoading: inspectionsLoading,
    isError: inspectionsError,
  } = useQuery(listPreInspectionsByAdoptionQuery(adoptionId))

  // What the applicant already went through for other animals: their
  // adoptions with the same email or the same referenced Person (ADR-018).
  const { data: earlierInspections } = useQuery(
    listRelatedPreInspectionsQuery(adoptionId)
  )

  const { data: related } = useQuery(getRelatedAdoptionsQuery(adoptionId))

  const relatedSection = related ? (
    <RelatedAdoptionsCard
      related={related}
      renderOpenLink={(other) => (
        <Button size="sm" variant="outline" asChild>
          <AdoptionOverviewRoute.Link params={{ adoptionId: other.id }}>
            Öffnen
          </AdoptionOverviewRoute.Link>
        </Button>
      )}
      renderImportAction={(other) => (
        <Button size="sm" variant="ghost" asChild>
          <ImportRoute.Link params={{ adoptionId, fromAdoptionId: other.id }}>
            <CopyPlus />
            Angaben übernehmen
          </ImportRoute.Link>
        </Button>
      )}
    />
  ) : null

  const { data: caseFile, isError: caseFileError } = useQuery(
    getCaseFileQuery(adoptionId)
  )

  const renderChecklistItemAction = (item: ChecklistItem) => {
    if (item.subject === 'animal') {
      return (
        <AnimalRoute.Link
          params={{
            animalTypeId: adoption.animal.animal_type_id,
            animalId: adoption.animal_id,
          }}
          className="text-xs underline underline-offset-4"
        >
          Beim Tier ergänzen
        </AnimalRoute.Link>
      )
    }
    if (item.subject === 'mediator' && adoption.mediator_id) {
      return (
        <PersonRoute.Link
          params={{ id: adoption.mediator_id }}
          className="text-xs underline underline-offset-4"
        >
          Bei der Vermittler:in ergänzen
        </PersonRoute.Link>
      )
    }
    return null
  }

  const caseFileSection = caseFile ? (
    <CaseFileSummaryCard
      caseFile={caseFile}
      renderChecklistItemAction={renderChecklistItemAction}
      showAllAction={
        <Button size="sm" variant="outline" asChild>
          <CaseFileRoute.Link params={{ adoptionId }}>
            <ListChecks />
            Alle Angaben
          </CaseFileRoute.Link>
        </Button>
      }
    />
  ) : caseFileError ? (
    <p className="text-sm text-destructive">Fehler beim Laden der Angaben.</p>
  ) : (
    <p className="text-sm text-muted-foreground flex gap-2 items-baseline">
      <Spinner className="size-3" />
      Lade Angaben...
    </p>
  )

  const editInternalNotesAction = (hasNote: boolean) => (
    <Button size="sm" variant="outline" asChild>
      <InternalNotesRoute.Link params={{ adoptionId }}>
        {hasNote ? (
          <>
            <Edit />
            Notizen bearbeiten
          </>
        ) : (
          <>
            <PlusCircle /> Notizen hinzufügen
          </>
        )}
      </InternalNotesRoute.Link>
    </Button>
  )

  const cancelAction = (
    <Button size="sm" variant="outline" asChild>
      <CancelRoute.Link params={{ adoptionId }}>
        <Ban />
        Vermittlung abbrechen
      </CancelRoute.Link>
    </Button>
  )

  const reopenAction = (
    <Button size="sm" variant="outline" asChild>
      <ReopenRoute.Link params={{ adoptionId }}>
        <RotateCcw />
        Vermittlung fortsetzen
      </ReopenRoute.Link>
    </Button>
  )

  // Automated signing is the primary path; uploading an already signed
  // contract is the alternative in the menu.
  const startContractAction = (
    <ButtonGroup>
      <Button size="sm" variant="outline" asChild>
        <ContractSigningRoute.Link params={{ adoptionId }}>
          <Send />
          Signaturvorgang starten
        </ContractSigningRoute.Link>
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            size="sm"
            variant="outline"
            aria-label="Weitere Optionen für den Vertrag"
          >
            <ChevronDown />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem asChild>
            <ContractRoute.Link params={{ adoptionId }}>
              <FileUp />
              Unterschriebenen Vertrag hochladen
            </ContractRoute.Link>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </ButtonGroup>
  )

  const editContractAction = (
    <Button size="sm" variant="outline" asChild>
      <ContractRoute.Link params={{ adoptionId }}>
        <Edit />
        Bearbeiten
      </ContractRoute.Link>
    </Button>
  )

  const cancelSigningAction = (
    <Button size="sm" variant="outline" asChild>
      <ContractSigningCancelRoute.Link params={{ adoptionId }}>
        <Ban />
        Signaturvorgang abbrechen
      </ContractSigningCancelRoute.Link>
    </Button>
  )

  const editPreInspectionAction = (hasNote: boolean) => (
    <Button size="sm" variant="outline" asChild>
      <PreInspectionRoute.Link params={{ adoptionId }}>
        {hasNote ? (
          <>
            <Edit />
            Notizen bearbeiten
          </>
        ) : (
          <>
            <PlusCircle /> Notizen hinzufügen
          </>
        )}
      </PreInspectionRoute.Link>
    </Button>
  )

  const newInspectionAction = (
    <Button size="sm" variant="outline" asChild>
      <NewInspectionRoute.Link params={{ adoptionId }}>
        <PlusCircle />
        Neue Kontrolle starten
      </NewInspectionRoute.Link>
    </Button>
  )

  const renderInspectionDetailLink = (inspection: PreInspectionResource) => (
    <InspectionDetailRoute.Link
      params={{
        adoptionId: inspection.adoption_id,
        preInspectionId: inspection.id,
      }}
    >
      {inspection.submitted_at ? (
        <>
          <span>Öffnen</span>
        </>
      ) : (
        <>
          <Edit />
          <span>Bearbeiten</span>
        </>
      )}
    </InspectionDetailRoute.Link>
  )

  const assignTransportAction = (
    <Button size="sm" variant="outline" asChild>
      <TransportAssignRoute.Link params={{ adoptionId }}>
        <Truck />
        {adoption.transport_id ? 'Transport ändern' : 'Transport zuweisen'}
      </TransportAssignRoute.Link>
    </Button>
  )

  const removeTransportAction = adoption.transport_id ? (
    <Button size="sm" variant="outline" asChild>
      <TransportRemoveRoute.Link params={{ adoptionId }}>
        <X />
        Transport entfernen
      </TransportRemoveRoute.Link>
    </Button>
  ) : null

  return (
    <>
      <AdoptionDetailPage
        adoption={adoption}
        inspectionsData={inspectionsData}
        inspectionsLoading={inspectionsLoading}
        inspectionsError={inspectionsError}
        earlierInspections={earlierInspections}
        caseFileSection={caseFileSection}
        relatedSection={relatedSection}
        confirmPreInspectionAction={
          <PreInspectionConfirmAction adoption={adoption} />
        }
        editInternalNotesAction={editInternalNotesAction}
        startContractAction={startContractAction}
        editContractAction={editContractAction}
        cancelSigningAction={cancelSigningAction}
        cancelAction={cancelAction}
        reopenAction={reopenAction}
        editPreInspectionAction={editPreInspectionAction}
        newInspectionAction={newInspectionAction}
        assignTransportAction={assignTransportAction}
        removeTransportAction={removeTransportAction}
        renderInspectionDetailLink={renderInspectionDetailLink}
      />
      <Outlet />
    </>
  )
}
