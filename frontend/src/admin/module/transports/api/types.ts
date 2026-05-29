import type {
  TransportListResource,
  TransportDetailResource,
} from '@/api/types/transports'

export type Transport = TransportDetailResource
export type TransportsResponse = TransportListResource[]
export interface TransportResponse {
  message: string
  data: TransportDetailResource
}

export interface CreateTransportRequest {
  planned_at?: string | null
  notes?: string
}

export interface UpdateTransportRequest {
  planned_at?: string | null
  notes?: string
}
