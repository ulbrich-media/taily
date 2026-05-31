import type { TransportListResource } from '@/api/types/transports'

export type TransportsResponse = TransportListResource[]
export interface TransportResponse {
  message: string
  data: TransportListResource
}

export interface CreateTransportRequest {
  planned_at?: string | null
  notes?: string
}

export interface UpdateTransportRequest {
  planned_at?: string | null
  notes?: string
}
