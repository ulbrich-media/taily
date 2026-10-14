import { Check } from 'lucide-react'
import type {
  AdoptionListResource,
  AdoptionStepStatus,
} from '@/api/types/adoptions'
import { STEP_STATUS_LABELS } from '../adoption-list.labels'
import { Badge } from '@/shadcn/components/ui/badge'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/shadcn/components/ui/tooltip'
import { cn } from '@/shadcn/lib/utils'

// Connector gradient runs from the left node's color to the right node's color.
// Full class names are required so Tailwind can detect them.
const CONNECTOR_FROM: Record<AdoptionStepStatus, string> = {
  not_started: 'from-muted-foreground/30',
  pending: 'from-blumine-600',
  finished: 'from-green-600',
}
const CONNECTOR_TO: Record<AdoptionStepStatus, string> = {
  not_started: 'to-muted-foreground/30',
  pending: 'to-blumine-600',
  finished: 'to-green-600',
}

function getSteps(adoption: AdoptionListResource) {
  return [
    { label: 'Vorkontrolle', status: adoption.pre_inspection_status },
    { label: 'Vertrag', status: adoption.contract_status },
    { label: 'Transport', status: adoption.transport_status },
    { label: 'Übergabe', status: adoption.handover_status },
  ]
}

function StepNode({ status }: { status: AdoptionStepStatus }) {
  return (
    <span
      className={cn(
        'flex size-5 shrink-0 items-center justify-center rounded-full border-2',
        status === 'finished' && 'border-green-600 bg-green-600 text-white',
        status === 'pending' && 'border-blumine-600 text-blumine-600',
        status === 'not_started' && 'border-muted-foreground/30'
      )}
    >
      {status === 'finished' && <Check className="size-3" strokeWidth={3} />}
      {status === 'pending' && (
        <span className="size-2 rounded-full bg-blumine-600" />
      )}
    </span>
  )
}

function StepProgress({ adoption }: { adoption: AdoptionListResource }) {
  const steps = getSteps(adoption)
  const summary = steps
    .map((step) => `${step.label}: ${STEP_STATUS_LABELS[step.status]}`)
    .join(', ')

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            tabIndex={0}
            role="img"
            aria-label={summary}
            className="inline-flex items-center rounded-sm focus-visible:ring-ring/50 focus-visible:ring-[3px] focus-visible:outline-none"
          >
            {steps.map((step, index) => (
              <span key={step.label} className="flex items-center">
                {index > 0 && (
                  <span
                    className={cn(
                      'h-0.5 w-4 bg-linear-to-r',
                      CONNECTOR_FROM[steps[index - 1].status],
                      CONNECTOR_TO[step.status]
                    )}
                  />
                )}
                <StepNode status={step.status} />
              </span>
            ))}
          </span>
        </TooltipTrigger>
        <TooltipContent side="top" sideOffset={6}>
          <ul className="space-y-1">
            {steps.map((step) => (
              <li
                key={step.label}
                className="flex items-center justify-between gap-4"
              >
                <span>{step.label}</span>
                <span
                  className={cn(
                    'font-medium',
                    step.status === 'not_started' && 'opacity-60'
                  )}
                >
                  {STEP_STATUS_LABELS[step.status]}
                </span>
              </li>
            ))}
          </ul>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

/**
 * Active adoptions show the connected step progress; all other adoptions
 * (not started, done, canceled) show only their general status.
 */
export function AdoptionStatusIndicator({
  adoption,
}: {
  adoption: AdoptionListResource
}) {
  switch (adoption.status) {
    case 'in_progress':
      return <StepProgress adoption={adoption} />
    case 'done':
      return <Badge variant="success">Abgeschlossen</Badge>
    case 'canceled':
      return <Badge variant="destructive">Abgebrochen</Badge>
    case 'pending':
      return <Badge variant="outline">Zu prüfen</Badge>
  }
}
