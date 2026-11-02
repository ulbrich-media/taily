import type { ReactNode } from 'react'
import type { CaseFileResource, ChecklistItem } from '@/api/types/case-file'
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/shadcn/components/ui/card'
import { ChecklistSummary } from './ChecklistSummary'

interface CaseFileSummaryCardProps {
  caseFile: CaseFileResource
  // Link to the "Angaben" tab.
  showAllAction: ReactNode
  renderChecklistItemAction?: (item: ChecklistItem) => ReactNode
}

/** What is still missing per step, on the adoption's overview. */
export function CaseFileSummaryCard({
  caseFile,
  showAllAction,
  renderChecklistItemAction,
}: CaseFileSummaryCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Checkliste</CardTitle>
        <CardDescription>
          Welche Angaben für die einzelnen Schritte noch fehlen.
        </CardDescription>
        <CardAction>{showAllAction}</CardAction>
      </CardHeader>
      <CardContent>
        <ChecklistSummary
          checklists={caseFile.checklists}
          renderItemAction={renderChecklistItemAction}
        />
      </CardContent>
    </Card>
  )
}
