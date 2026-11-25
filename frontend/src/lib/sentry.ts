import * as Sentry from '@sentry/react'
import type { ErrorInfo } from 'react'
import type { AnyRouter } from '@tanstack/react-router'
import { API_URL, apiRequest } from './api'
import { isTokenUrl, scrubSentryData } from './sentryScrub'

/** Frontend Sentry settings, configured by the operator on the backend. */
export interface SentryClientConfig {
  dsn: string
  environment: string
  release: string | null
  /** Tags events when several installations share one project; '' for none. */
  instance: string
  traces_sample_rate: number
  replays_session_sample_rate: number
  replays_on_error_sample_rate: number
}

interface ClientConfig {
  sentry: SentryClientConfig | null
}

/**
 * Starts Sentry with the operator's own project, if they configured one.
 *
 * The frontend assets are shared by every installation, so the DSN comes
 * from the backend at runtime (GET /internal/client-config) rather than from
 * the build. Errors thrown before this resolves are not reported.
 */
export async function initSentry(router: AnyRouter): Promise<void> {
  let config: ClientConfig
  try {
    config = await apiRequest<ClientConfig>('client-config')
  } catch {
    // Monitoring is optional; the app must start without it.
    return
  }

  if (config.sentry) {
    startSentry(config.sentry, router)
  }
}

export function startSentry(
  config: SentryClientConfig,
  router: AnyRouter
): void {
  Sentry.init({
    dsn: config.dsn,
    environment: config.environment,
    release: config.release ?? undefined,
    // Same `instance` tag as the backend, also on feedback.
    initialScope: config.instance
      ? { tags: { instance: config.instance } }
      : undefined,
    integrations: [
      Sentry.tanstackRouterBrowserTracingIntegration(router),
      // Text and media are masked by default; Taily handles personal data.
      Sentry.replayIntegration({ beforeAddRecordingEvent: scrubSentryData }),
      // "Feedback geben" button; feedback goes to the operator's project.
      Sentry.feedbackIntegration(feedbackOptions),
    ],
    tracesSampleRate: config.traces_sample_rate,
    // Propagate traces to the Laravel API so frontend and backend spans connect.
    tracePropagationTargets: [new URL(API_URL).origin],
    replaysSessionSampleRate: config.replays_session_sample_rate,
    replaysOnErrorSampleRate: config.replays_on_error_sample_rate,
    // Taily handles personal data: no IP inference or user data, no cookies,
    // request bodies or query strings (they carry tokens and emails).
    dataCollection: {
      userInfo: false,
      cookies: false,
      httpBodies: [],
      urlQueryParams: false,
    },
    // Tokens in URL paths, which the SDK does not filter.
    beforeSend: scrubSentryData,
    // Spans are streamed by default; the transaction hook covers `static`.
    beforeSendSpan: scrubSentryData,
    beforeSendTransaction: scrubSentryData,
    beforeBreadcrumb: scrubSentryData,
  })

  // Replay metadata (the list of visited URLs) bypasses beforeSend.
  Sentry.addEventProcessor((event) =>
    event.type === 'replay_event' ? scrubSentryData(event) : event
  )

  pauseReplayOnTokenRoutes(router, config.replays_on_error_sample_rate > 0)

  // Reserves space for the feedback button, see index.css.
  document.documentElement.classList.add('has-feedback-widget')
}

/**
 * Stops Session Replay while a URL with an access token is open. The recording
 * itself stores the page URL in frames that no hook can filter, so those pages
 * are not recorded at all; the pending buffer is dropped. Buffering for errors
 * resumes on the next page without a token.
 */
function pauseReplayOnTokenRoutes(router: AnyRouter, resumeBuffering: boolean) {
  let paused = false

  const sync = (href: string) => {
    const replay = Sentry.getReplay()
    if (!replay) return

    if (isTokenUrl(href)) {
      if (!paused) {
        paused = true
        void replay.stop({ flush: false })
      }
    } else if (paused) {
      paused = false
      if (resumeBuffering) replay.startBuffering()
    }
  }

  sync(window.location.href)
  router.subscribe('onResolved', ({ toLocation }) => sync(toLocation.href))
}

const feedbackOptions = {
  colorScheme: 'system',
  triggerLabel: 'Feedback geben',
  formTitle: 'Feedback geben',
  submitButtonLabel: 'Feedback senden',
  cancelButtonLabel: 'Abbrechen',
  confirmButtonLabel: 'Bestätigen',
  addScreenshotButtonLabel: 'Screenshot hinzufügen',
  removeScreenshotButtonLabel: 'Screenshot entfernen',
  nameLabel: 'Name',
  namePlaceholder: 'Dein Name',
  emailLabel: 'E-Mail',
  emailPlaceholder: 'deine.email@example.org',
  isRequiredLabel: '(Pflichtfeld)',
  messageLabel: 'Beschreibung',
  messagePlaceholder:
    'Was ist passiert? Was hast du erwartet? Oder was können wir besser machen?',
  successMessageText: 'Vielen Dank für dein Feedback!',
  highlightToolText: 'Hervorheben',
  hideToolText: 'Verbergen',
  removeHighlightText: 'Entfernen',
} as const

/** Whether the operator configured Sentry and it has started. */
export function isSentryEnabled(): boolean {
  return Sentry.isInitialized()
}

/**
 * Opens Sentry's crash-report dialog, which attaches the user's description
 * to the most recently reported error.
 */
export function showCrashReportDialog(): void {
  Sentry.showReportDialog({
    eventId: Sentry.lastEventId(),
    lang: 'de',
    title: 'Da ist leider etwas schiefgelaufen.',
    subtitle: 'Der Fehler wurde bereits gemeldet.',
    subtitle2: 'Wenn du magst, beschreib kurz, was du gerade gemacht hast.',
    labelName: 'Name',
    labelEmail: 'E-Mail',
    labelComments: 'Was ist passiert?',
    labelClose: 'Schließen',
    labelSubmit: 'Absenden',
    errorGeneric:
      'Beim Senden ist ein Fehler aufgetreten. Bitte versuch es noch einmal.',
    errorFormEntry: 'Einige Felder sind ungültig. Bitte korrigiere sie.',
    successMessage: 'Danke, deine Beschreibung wurde gesendet!',
  })
}

// Passing these hooks replaces React's own console logging, so log here too.
// Capturing is a no-op while Sentry is not initialised.
const logError = (error: unknown, errorInfo: ErrorInfo) =>
  console.error(error, errorInfo.componentStack)

/** Error hooks for createRoot, so errors React catches reach Sentry. */
export const sentryRootOptions = {
  onUncaughtError: Sentry.reactErrorHandler(logError),
  onCaughtError: Sentry.reactErrorHandler(logError),
  onRecoverableError: Sentry.reactErrorHandler(logError),
}
