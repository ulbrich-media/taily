import { apiRequest } from '@/lib/api'
import type {
  TransportResponse,
  TransportsResponse,
  CreateTransportRequest,
  UpdateTransportRequest,
  MarkTransportDoneRequest,
  ListTransportsParams,
} from './types'

export async function getTransports(
  params?: ListTransportsParams
): Promise<TransportsResponse> {
  const search =
    params?.is_done !== undefined ? `?is_done=${params.is_done ? 1 : 0}` : ''
  return apiRequest<TransportsResponse>(`transports${search}`)
}

export async function createTransport(
  data: CreateTransportRequest
): Promise<TransportResponse> {
  return apiRequest<TransportResponse>('transports', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function updateTransport(
  id: string,
  data: UpdateTransportRequest
): Promise<TransportResponse> {
  return apiRequest<TransportResponse>(`transports/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  })
}

export async function deleteTransport(
  id: string
): Promise<{ message: string }> {
  return apiRequest<{ message: string }>(`transports/${id}`, {
    method: 'DELETE',
  })
}

export async function markTransportDone(
  id: string,
  data?: MarkTransportDoneRequest
): Promise<TransportResponse> {
  return apiRequest<TransportResponse>(`transports/${id}/mark-done`, {
    method: 'POST',
    body: JSON.stringify(data ?? {}),
  })
}
