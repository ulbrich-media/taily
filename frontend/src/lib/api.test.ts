import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  apiRequest,
  setUnauthenticatedHandler,
  UnauthenticatedError,
} from './api'

function mockStatus(status: number) {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ message: 'Unauthenticated.' }), {
        status,
      })
    )
  )
}

describe('apiRequest session handling', () => {
  afterEach(() => {
    setUnauthenticatedHandler(null)
    vi.unstubAllGlobals()
  })

  it.each([401, 419])('notifies the handler on %i', async (status) => {
    const handler = vi.fn()
    setUnauthenticatedHandler(handler)
    mockStatus(status)

    await expect(apiRequest('animals')).rejects.toBeInstanceOf(
      UnauthenticatedError
    )
    expect(handler).toHaveBeenCalledOnce()
  })

  it.each(['profile', 'logout'])('skips the handler for %s', async (path) => {
    const handler = vi.fn()
    setUnauthenticatedHandler(handler)
    mockStatus(401)

    await expect(apiRequest(path)).rejects.toBeInstanceOf(UnauthenticatedError)
    expect(handler).not.toHaveBeenCalled()
  })

  it('keeps login failures as regular errors', async () => {
    const handler = vi.fn()
    setUnauthenticatedHandler(handler)
    mockStatus(401)

    const error = await apiRequest('login').catch((e: unknown) => e)
    expect(error).not.toBeInstanceOf(UnauthenticatedError)
    expect(handler).not.toHaveBeenCalled()
  })
})
