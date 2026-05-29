import { apiRequest } from '@/lib/api'
import type {
  Transport,
  TransportResponse,
  TransportsResponse,
  CreateTransportRequest,
  UpdateTransportRequest,
} from './types'

export async function getTransports(): Promise<TransportsResponse> {
  return apiRequest<TransportsResponse>('transports')
}

export async function getTransport(id: string): Promise<Transport> {
  return apiRequest<Transport>(`transports/${id}`)
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
  id: string
): Promise<TransportResponse> {
  return apiRequest<TransportResponse>(`transports/${id}/mark-done`, {
    method: 'POST',
  })
}
