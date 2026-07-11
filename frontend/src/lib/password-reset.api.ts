import { apiRequest, csrfCookie } from './api'

export interface ResetPasswordData {
  token: string
  email: string
  password: string
  password_confirmation: string
}

export interface PasswordResetResponse {
  message: string
}

export async function requestPasswordResetLink(
  email: string
): Promise<PasswordResetResponse> {
  await csrfCookie()

  return apiRequest<PasswordResetResponse>('forgot-password', {
    method: 'POST',
    body: JSON.stringify({ email }),
  })
}

export async function resetPassword(
  data: ResetPasswordData
): Promise<PasswordResetResponse> {
  await csrfCookie()

  return apiRequest<PasswordResetResponse>('reset-password', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}
