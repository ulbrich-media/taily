import { apiRequest } from '@/lib/api'
import type {
  ApiTokensResponse,
  ApiAbilitiesResponse,
  CreateApiTokenRequest,
  CreateApiTokenResponse,
  DeleteApiTokenResponse,
} from './types'

export async function getApiTokens(): Promise<ApiTokensResponse> {
  return apiRequest<ApiTokensResponse>('api-tokens')
}

export async function getApiAbilities(): Promise<ApiAbilitiesResponse> {
  return apiRequest<ApiAbilitiesResponse>('api-tokens/abilities')
}

export async function createApiToken(
  data: CreateApiTokenRequest
): Promise<CreateApiTokenResponse> {
  return apiRequest<CreateApiTokenResponse>('api-tokens', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function deleteApiToken(
  tokenId: string
): Promise<DeleteApiTokenResponse> {
  return apiRequest<DeleteApiTokenResponse>(`api-tokens/${tokenId}`, {
    method: 'DELETE',
  })
}
