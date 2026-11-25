import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ApiValidationError } from '@/lib/api'
import { isSentryEnabled } from '@/lib/sentry'
import { ApplicationRouteError } from './ApplicationRouteError'

vi.mock('@/lib/sentry', () => ({
  isSentryEnabled: vi.fn(),
  showCrashReportDialog: vi.fn(),
}))

vi.mock('./ApplicantLayout', () => ({
  ApplicantLayout: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}))

describe('ApplicationRouteError', () => {
  beforeEach(() => {
    vi.mocked(isSentryEnabled).mockReturnValue(true)
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  it('shows "not found" for a 404', () => {
    render(
      <ApplicationRouteError
        error={new ApiValidationError('Not found', undefined, 404)}
      />
    )

    expect(screen.getByText('Bewerbung nicht gefunden')).toBeInTheDocument()
  })

  it('shows a generic error for any other error', () => {
    render(<ApplicationRouteError error={new Error('removeChild')} />)

    expect(screen.getByText('Etwas ist schiefgelaufen')).toBeInTheDocument()
    expect(
      screen.queryByText('Bewerbung nicht gefunden')
    ).not.toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Problem melden' })
    ).toBeInTheDocument()
  })
})
