import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { isSentryEnabled, showCrashReportDialog } from '@/lib/sentry.ts'
import { ErrorInfoComponent } from './ErrorInfoComponent'

vi.mock('@/lib/sentry.ts', () => ({
  isSentryEnabled: vi.fn(),
  showCrashReportDialog: vi.fn(),
}))

describe('ErrorInfoComponent', () => {
  it('offers a crash report when Sentry is enabled', async () => {
    vi.mocked(isSentryEnabled).mockReturnValue(true)
    render(<ErrorInfoComponent error={new Error('Boom')} />)

    await userEvent.click(
      screen.getByRole('button', { name: 'Problem melden' })
    )

    expect(showCrashReportDialog).toHaveBeenCalledOnce()
  })

  it('hides the crash report button without Sentry', () => {
    vi.mocked(isSentryEnabled).mockReturnValue(false)
    render(<ErrorInfoComponent error={new Error('Boom')} />)

    expect(
      screen.queryByRole('button', { name: 'Problem melden' })
    ).not.toBeInTheDocument()
  })
})
