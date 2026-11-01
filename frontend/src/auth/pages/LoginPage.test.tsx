import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { LoginPage } from './LoginPage'
import { useAuth } from '@/lib/auth.hook'

vi.mock('@/lib/auth.hook', () => ({ useAuth: vi.fn() }))
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))
vi.mock('@laravel/passkeys/react', () => ({
  usePasskeyVerify: () => ({ verify: vi.fn(), isSupported: false }),
}))
vi.mock('@/lib/api', () => ({ csrfCookie: vi.fn(), API_URL: '/internal' }))

vi.stubGlobal(
  'ResizeObserver',
  class {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
)

function renderPage(sessionExpired?: boolean) {
  vi.mocked(useAuth).mockReturnValue({
    login: vi.fn(),
    isAuthenticated: false,
    isLoading: false,
    refreshProfile: vi.fn(),
  } as unknown as ReturnType<typeof useAuth>)

  render(
    <LoginPage
      sessionExpired={sessionExpired}
      onAlreadyAuthenticated={vi.fn()}
      onForgotPassword={vi.fn()}
      onTwoFactorRequired={vi.fn()}
    />
  )
}

describe('LoginPage', () => {
  it('shows the timeout info after an expired session', () => {
    renderPage(true)
    expect(screen.getByText(/Deine Sitzung ist abgelaufen/)).toBeTruthy()
  })

  it('shows no timeout info by default', () => {
    renderPage()
    expect(screen.queryByText(/Sitzung ist abgelaufen/)).toBeNull()
  })
})
