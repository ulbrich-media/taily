import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import * as Sentry from '@sentry/react'
import type { AnyRouter } from '@tanstack/react-router'
import { initSentry, showCrashReportDialog } from './sentry'
import { scrubSentryData } from './sentryScrub'

vi.mock('@sentry/react', () => ({
  init: vi.fn(),
  tanstackRouterBrowserTracingIntegration: vi.fn(() => ({ name: 'router' })),
  replayIntegration: vi.fn(() => ({ name: 'replay' })),
  feedbackIntegration: vi.fn(() => ({ name: 'feedback' })),
  isInitialized: vi.fn(() => false),
  lastEventId: vi.fn(() => 'event-1'),
  showReportDialog: vi.fn(),
  reactErrorHandler: vi.fn(() => vi.fn()),
}))

const router = {} as AnyRouter

function mockClientConfig(body: unknown, status = 200) {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue(new Response(JSON.stringify(body), { status }))
  )
}

describe('initSentry', () => {
  beforeEach(() => {
    vi.mocked(Sentry.init).mockClear()
    document.documentElement.classList.remove('has-feedback-widget')
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('starts Sentry with the config from the backend', async () => {
    mockClientConfig({
      sentry: {
        dsn: 'https://key@o1.ingest.sentry.io/2',
        environment: 'production',
        release: 'v1.2.3',
        instance: 'verein-a',
        traces_sample_rate: 0.1,
        replays_session_sample_rate: 0,
        replays_on_error_sample_rate: 1,
      },
    })

    await initSentry(router)

    expect(fetch).toHaveBeenCalledWith(
      expect.stringMatching(/\/internal\/client-config$/),
      expect.anything()
    )
    expect(Sentry.init).toHaveBeenCalledOnce()
    expect(
      document.documentElement.classList.contains('has-feedback-widget')
    ).toBe(true)
    expect(Sentry.feedbackIntegration).toHaveBeenCalledWith(
      expect.objectContaining({ triggerLabel: 'Feedback geben' })
    )
    expect(Sentry.init).toHaveBeenCalledWith(
      expect.objectContaining({
        dsn: 'https://key@o1.ingest.sentry.io/2',
        environment: 'production',
        release: 'v1.2.3',
        initialScope: { tags: { instance: 'verein-a' } },
        tracesSampleRate: 0.1,
        replaysSessionSampleRate: 0,
        replaysOnErrorSampleRate: 1,
      })
    )
  })

  it('does not collect user data, cookies, bodies or query strings', async () => {
    mockClientConfig({
      sentry: {
        dsn: 'https://key@o1.ingest.sentry.io/2',
        environment: 'production',
        release: null,
        instance: '',
        traces_sample_rate: 0,
        replays_session_sample_rate: 0,
        replays_on_error_sample_rate: 1,
      },
    })

    await initSentry(router)

    expect(Sentry.init).toHaveBeenCalledWith(
      expect.objectContaining({
        dataCollection: {
          userInfo: false,
          cookies: false,
          httpBodies: [],
          urlQueryParams: false,
        },
        beforeSend: scrubSentryData,
        beforeSendTransaction: scrubSentryData,
        beforeBreadcrumb: scrubSentryData,
      })
    )
    expect(Sentry.replayIntegration).toHaveBeenCalledWith({
      beforeAddRecordingEvent: scrubSentryData,
    })
  })

  it('does not start Sentry when the operator configured none', async () => {
    mockClientConfig({ sentry: null })

    await initSentry(router)

    expect(Sentry.init).not.toHaveBeenCalled()
    expect(
      document.documentElement.classList.contains('has-feedback-widget')
    ).toBe(false)
  })

  it('does not start Sentry and does not throw when the request fails', async () => {
    mockClientConfig({ message: 'Server Error' }, 500)

    await expect(initSentry(router)).resolves.toBeUndefined()
    expect(Sentry.init).not.toHaveBeenCalled()
  })
})

describe('showCrashReportDialog', () => {
  it('opens the dialog for the last reported error', () => {
    showCrashReportDialog()

    expect(Sentry.showReportDialog).toHaveBeenCalledWith(
      expect.objectContaining({ eventId: 'event-1', lang: 'de' })
    )
  })
})
