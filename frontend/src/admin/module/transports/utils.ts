import type { TransportListResource } from '@/api/types/transports.ts'
import { formatApiDate } from '@/lib/dates.utils.ts'

export function getTransportTitle(transport: TransportListResource): string {
  if (transport.name) return transport.name
  if (transport.planned_at)
    return `Transport am ${formatApiDate(transport.planned_at)}`
  return 'Transport'
}
