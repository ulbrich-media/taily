import { CheckCircle2, Circle, CircleDot } from 'lucide-react'
import { ADOPTION_STEP_LABELS } from '@/api/types/case-file'
import type { AdoptionStep } from '@/api/types/case-file'
import { cn } from '@/shadcn/lib/utils'
import { formatApiDate } from '@/lib/dates.utils'
import type { PortalStep } from '../api/types'

const STATUS_TEXT = {
  finished: 'Erledigt',
  pending: 'Läuft',
  not_started: 'Noch nicht begonnen',
} as const

/** The steps of an adoption as the applicant sees them. */
export function StepTimeline({
  steps,
  current,
}: {
  steps: PortalStep[]
  current: AdoptionStep
}) {
  return (
    <ol className="grid gap-3 sm:grid-cols-5">
      {steps.map((step) => {
        const Icon =
          step.status === 'finished'
            ? CheckCircle2
            : step.step === current || step.status === 'pending'
              ? CircleDot
              : Circle
        return (
          <li
            key={step.step}
            aria-current={step.step === current ? 'step' : undefined}
            className={cn(
              'flex items-start gap-2 rounded-md border p-3 sm:flex-col',
              step.step === current && 'border-primary bg-primary/5'
            )}
          >
            <Icon
              className={cn(
                'size-5 shrink-0',
                step.status === 'finished'
                  ? 'text-green-600'
                  : 'text-muted-foreground'
              )}
            />
            <div className="space-y-0.5">
              <p className="text-sm font-medium">
                {ADOPTION_STEP_LABELS[step.step]}
              </p>
              <p className="text-xs text-muted-foreground">
                {STATUS_TEXT[step.status]}
                {step.planned_at &&
                  step.status !== 'finished' &&
                  ` · geplant ${formatApiDate(step.planned_at)}`}
              </p>
            </div>
          </li>
        )
      })}
    </ol>
  )
}
