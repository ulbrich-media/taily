import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from './auth'
import { useAuth } from './auth.hook'

function Probe() {
  const { isAuthenticated, sessionExpired, isLoading } = useAuth()
  if (isLoading) return <p>loading</p>
  return (
    <p>
      {isAuthenticated ? 'in' : 'out'}
      {sessionExpired ? ' expired' : ''}
    </p>
  )
}

function respond(...responses: Array<Response | Error>) {
  const fetchMock = vi.fn()
  responses.forEach((r) =>
    r instanceof Error
      ? fetchMock.mockRejectedValueOnce(r)
      : fetchMock.mockResolvedValueOnce(r)
  )
  vi.stubGlobal('fetch', fetchMock)
}

const user = () => new Response(JSON.stringify({ id: 1, role: 'admin' }))
const unauthenticated = () => new Response('{}', { status: 401 })

function setup() {
  const client = new QueryClient()
  render(
    <QueryClientProvider client={client}>
      <AuthProvider>
        <Probe />
      </AuthProvider>
    </QueryClientProvider>
  )
  return client
}

async function returnToTab() {
  await act(async () => {
    window.dispatchEvent(new Event('visibilitychange'))
    window.dispatchEvent(new Event('focus'))
  })
}

describe('AuthProvider session checks', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('flags an expired session when the profile check fails on return', async () => {
    respond(user(), unauthenticated())
    setup()
    await screen.findByText('in')

    await returnToTab()

    await screen.findByText('out expired')
  })

  it('keeps the user signed in on network errors', async () => {
    respond(user(), new Error('offline'))
    setup()
    await screen.findByText('in')

    await returnToTab()

    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(2))
    expect(screen.getByText('in')).toBeTruthy()
  })

  it('does not flag expiry for a visitor who was never signed in', async () => {
    respond(unauthenticated())
    setup()

    await screen.findByText('out')
  })
})
