import { useState, type ReactNode } from 'react'
import { CircleCheck, CircleDashed, Clock } from 'lucide-react'
import {
  ADOPTION_STEPS,
  ADOPTION_STEP_LABELS,
  type AdoptionStep,
  type Checklist,
  type ChecklistItem,
} from '@/api/types/case-file'
import {
  ToggleGroup,
  ToggleGroupItem,
} from '@/shadcn/components/ui/toggle-group'
import { cn } from '@/shadcn/lib/utils'

interface ChecklistSummaryProps {
  checklists: Record<AdoptionStep, Checklist>
  // Where to send the mediator to fix an item, e.g. the animal page.
  renderItemAction?: (item: ChecklistItem) => ReactNode
}

/**
 * What is still missing per step (docs/features/case-file.md#checklist).
 * Opens on the first step that isn't complete.
 */
export function ChecklistSummary({
  checklists,
  renderItemAction,
}: ChecklistSummaryProps) {
  const firstOpen =
    ADOPTION_STEPS.find((step) => !checklists[step].complete) ?? 'handover'
  const [step, setStep] = useState<AdoptionStep>(firstOpen)
  const checklist = checklists[step]
  const open = checklist.items.filter((item) => item.status !== 'done')

  return (
    <div className="space-y-3">
      <ToggleGroup
        type="single"
        variant="outline"
        size="sm"
        value={step}
        onValueChange={(value) => value && setStep(value as AdoptionStep)}
        className="flex-wrap"
      >
        {ADOPTION_STEPS.map((candidate) => {
          const c = checklists[candidate]
          const openCount = c.missing + c.awaiting_review
          return (
            <ToggleGroupItem
              key={candidate}
              value={candidate}
              aria-label={`Checkliste ${ADOPTION_STEP_LABELS[candidate]}`}
            >
              {c.complete ? (
                <CircleCheck className="text-green-600" />
              ) : (
                <CircleDashed className="text-amber-600" />
              )}
              {ADOPTION_STEP_LABELS[candidate]}
              {openCount > 0 && (
                <span className="text-muted-foreground">({openCount})</span>
              )}
            </ToggleGroupItem>
          )
        })}
      </ToggleGroup>

      {open.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Für {ADOPTION_STEP_LABELS[step]} ist alles vollständig (
          {checklist.items.length} Angaben).
        </p>
      ) : (
        <div className="space-y-1">
          <p className="text-sm">
            Für {ADOPTION_STEP_LABELS[step]}{' '}
            {checklist.missing > 0 &&
              `fehlen ${checklist.missing} ${checklist.missing === 1 ? 'Angabe' : 'Angaben'}`}
            {checklist.missing > 0 && checklist.awaiting_review > 0 && ', '}
            {checklist.awaiting_review > 0 &&
              `${checklist.awaiting_review} ${checklist.awaiting_review === 1 ? 'Prüfung' : 'Prüfungen'} offen`}
            :
          </p>
          <ul className="text-sm space-y-1">
            {open.map((item) => (
              <li key={item.key} className="flex items-center gap-2">
                <ChecklistItemIcon item={item} />
                <span
                  className={cn(item.status === 'missing' && 'font-medium')}
                >
                  {item.label}
                </span>
                {item.required_for !== step && (
                  <span className="text-xs text-muted-foreground">
                    (ab {ADOPTION_STEP_LABELS[item.required_for]})
                  </span>
                )}
                {renderItemAction?.(item)}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

export function ChecklistItemIcon({ item }: { item: ChecklistItem }) {
  if (item.status === 'awaiting_review') {
    return (
      <Clock className="size-4 text-blumine-600" aria-label="Prüfung offen" />
    )
  }
  if (item.status === 'missing') {
    return <CircleDashed className="size-4 text-amber-600" aria-label="Fehlt" />
  }
  return (
    <CircleCheck className="size-4 text-green-600" aria-label="Vollständig" />
  )
}
