import type { TransportListResource } from '@/api/types/transports'

export type TransportsResponse = TransportListResource[]
export interface TransportResponse {
  message: string
  data: TransportListResource
}

export interface CreateTransportRequest {
  name?: string
  planned_at?: string | null
  notes?: string
  responsible_id?: string | null
  transporter?: string
}

export interface UpdateTransportRequest {
  name?: string
  planned_at?: string | null
  notes?: string
  responsible_id?: string | null
  transporter?: string
}

export interface MarkTransportDoneRequest {
  done_at?: string | null
}

export interface ListTransportsParams {
  is_done?: boolean
}
