import { apiRequest } from './api'

export interface InvitationDetails {
  email: string
  name: string
  expires_at: string
}

export interface AcceptInvitationData {
  name: string
  password: string
  password_confirmation: string
}

export interface AcceptInvitationResponse {
  message: string
}

export async function getInvitationDetails(
  token: string
): Promise<InvitationDetails> {
  return apiRequest<InvitationDetails>(`invitations/${token}`, {
    requiresAuth: false,
  })
}

export async function acceptInvitation(
  token: string,
  data: AcceptInvitationData
): Promise<AcceptInvitationResponse> {
  return apiRequest<AcceptInvitationResponse>(`invitations/${token}/accept`, {
    method: 'POST',
    body: JSON.stringify(data),
    requiresAuth: false,
  })
}
