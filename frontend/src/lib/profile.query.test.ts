import { beforeEach, describe, expect, it, vi } from 'vitest'
import { QueryClient } from '@tanstack/react-query'
import { UserRole } from '@/api/types/users'
import { resolveAdminAccess } from './profile.query'

const apiRequest = vi.hoisted(() => vi.fn())

vi.mock('./api', () => {
  class UnauthenticatedError extends Error {}
  return { apiRequest, UnauthenticatedError }
})

import { UnauthenticatedError } from './api'

function makeClient() {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } })
}

describe('resolveAdminAccess', () => {
  beforeEach(() => {
    apiRequest.mockReset()
  })

  it('fetches the profile on a cold cache and detects admins', async () => {
    apiRequest.mockResolvedValue({ role: UserRole.Admin })
    const result = await resolveAdminAccess(makeClient())
    expect(result).toEqual({ isAdmin: true, isAuthenticated: true })
  })

  it('detects non-admins on a cold cache', async () => {
    apiRequest.mockResolvedValue({ role: 'user' })
    const result = await resolveAdminAccess(makeClient())
    expect(result).toEqual({ isAdmin: false, isAuthenticated: true })
  })

  it('reports unauthenticated on 401', async () => {
    apiRequest.mockRejectedValue(new UnauthenticatedError())
    const result = await resolveAdminAccess(makeClient())
    expect(result).toEqual({ isAdmin: false, isAuthenticated: false })
  })

  it('uses a warm cache without a request', async () => {
    const client = makeClient()
    client.setQueryData(['profile'], { role: UserRole.Admin })
    const result = await resolveAdminAccess(client)
    expect(result.isAdmin).toBe(true)
    expect(apiRequest).not.toHaveBeenCalled()
  })

  it('does not cache network errors', async () => {
    apiRequest.mockRejectedValue(new Error('network'))
    const client = makeClient()
    const result = await resolveAdminAccess(client)
    expect(result).toEqual({ isAdmin: false, isAuthenticated: true })
    expect(client.getQueryData(['profile'])).toBeUndefined()
  })
})
