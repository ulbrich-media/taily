import type { ReactNode } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardTitleIcon,
} from '@/shadcn/components/ui/card.tsx'
import { ClipboardCheck, Heart } from 'lucide-react'
import { PreInspectionList } from '@/admin/module/pre-inspections/components/PreInspectionList.tsx'
import { AdoptionList } from '@/admin/module/adoptions/components/AdoptionList.tsx'
import type { PreInspectionResource } from '@/api/types/pre-inspections'
import type { AdoptionListResource } from '@/api/types/adoptions'
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from '@/shadcn/components/ui/empty.tsx'

interface PersonEditAdoptionsPageProps {
  inspections: PreInspectionResource[]
  adoptions: AdoptionListResource[]
  renderAdoptionDetailLink?: (adoption: AdoptionListResource) => ReactNode
  renderInspectionDetailLink?: (inspection: PreInspectionResource) => ReactNode
}

export function PersonEditAdoptionsPage({
  inspections,
  adoptions,
  renderAdoptionDetailLink,
  renderInspectionDetailLink,
}: PersonEditAdoptionsPageProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>
            <CardTitleIcon icon={Heart} />
            Vermittlungen
          </CardTitle>
          <CardDescription>
            Übersicht der Vermittlungen dieser Person
          </CardDescription>
        </CardHeader>
        <CardContent>
          {adoptions.length ? (
            <AdoptionList
              adoptions={adoptions}
              showApplicant={false}
              renderDetailLink={renderAdoptionDetailLink}
            />
          ) : (
            <Empty>
              <EmptyHeader>
                <EmptyTitle className="text-base">
                  Keine Vermittlungen vorhanden
                </EmptyTitle>
              </EmptyHeader>
            </Empty>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            <CardTitleIcon icon={ClipboardCheck} />
            Vorkontrollen
          </CardTitle>
          <CardDescription>
            Aus Vermittlungen entstandene Vorkontrollen für diese Person
          </CardDescription>
        </CardHeader>
        <CardContent>
          {inspections.length ? (
            <PreInspectionList
              inspections={inspections}
              renderDetailLink={renderInspectionDetailLink}
            />
          ) : (
            <Empty>
              <EmptyHeader>
                <EmptyTitle className="text-base">
                  Keine Vorkontrollen vorhanden.
                </EmptyTitle>
                <EmptyDescription>
                  Eine Vorkontrolle kann über eine Vermittlung jederzeit
                  erstellt werden.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
