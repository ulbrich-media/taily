import type { AdoptionStatus, AdoptionStepStatus } from '@/api/types/adoptions'

export const ADOPTION_STATUS_LABELS: Record<AdoptionStatus, string> = {
  pending: 'Zu prüfen',
  in_progress: 'In Bearbeitung',
  canceled: 'Abgebrochen',
  done: 'Abgeschlossen',
}

export const STEP_STATUS_LABELS: Record<AdoptionStepStatus, string> = {
  not_started: 'Offen',
  pending: 'In Bearbeitung',
  finished: 'Abgeschlossen',
}
