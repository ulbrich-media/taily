import { describe, expect, it } from 'vitest'
import {
  FILTERED,
  isTokenUrl,
  scrubSentryData,
  scrubTokens,
} from './sentryScrub'

describe('scrubTokens', () => {
  it.each([
    ['/inspect/abc123', `/inspect/${FILTERED}`],
    ['/contracts/abc123', `/contracts/${FILTERED}`],
    ['/admin/invitation/abc123', `/admin/invitation/${FILTERED}`],
    ['/adopter/confirm/abc123', `/adopter/confirm/${FILTERED}`],
    ['/adopter/login/abc123', `/adopter/login/${FILTERED}`],
    [
      'https://taily.example/internal/invitations/abc123/accept',
      `https://taily.example/internal/invitations/${FILTERED}/accept`,
    ],
    [
      'https://taily.example/internal/contracts/abc123/document?x=1#top',
      `https://taily.example/internal/contracts/${FILTERED}/document?x=1#top`,
    ],
    [
      'POST https://taily.example/internal/inspect/abc123/submit',
      `POST https://taily.example/internal/inspect/${FILTERED}/submit`,
    ],
  ])('removes the token from %s', (input, expected) => {
    expect(scrubTokens(input)).toBe(expected)
  })

  it.each([
    '/admin/login',
    '/inspect/$token',
    '/internal/contracts/{token}/submit',
    '/admin/login?redirect=%2Fadmin',
    '/admin/settings/contracts/0193-template-id',
    '/apply/01a204d7-b860-752b-87fe-f5db61bd414d',
    'Failed to execute removeChild on Node',
  ])('leaves %s unchanged', (input) => {
    expect(scrubTokens(input)).toBe(input)
  })
})

describe('isTokenUrl', () => {
  it.each([
    ['/inspect/abc123', true],
    ['https://taily.example/callback?action=inspect&token=abc', true],
    ['/admin/reset-password?token=abc&email=a%40b.de', true],
    ['/inspect/$token', false],
    ['/apply/01a204d7-b860-752b-87fe-f5db61bd414d', false],
    ['/admin/login', false],
  ])('%s → %s', (url, expected) => {
    expect(isTokenUrl(url)).toBe(expected)
  })
})

describe('scrubSentryData', () => {
  it('scrubs request URLs, breadcrumbs and spans of an event', () => {
    const event = {
      request: { url: 'https://taily.example/inspect/abc123' },
      breadcrumbs: [
        {
          category: 'navigation',
          data: { from: '/callback', to: '/contracts/abc123' },
        },
        {
          category: 'fetch',
          data: { url: 'https://taily.example/internal/inspect/abc123' },
        },
      ],
      spans: [
        {
          description: 'GET https://taily.example/internal/contracts/abc123',
          data: { 'http.response.status_code': 200 },
        },
      ],
    }

    expect(scrubSentryData(event)).toEqual({
      request: { url: `https://taily.example/inspect/${FILTERED}` },
      breadcrumbs: [
        {
          category: 'navigation',
          data: { from: '/callback', to: `/contracts/${FILTERED}` },
        },
        {
          category: 'fetch',
          data: { url: `https://taily.example/internal/inspect/${FILTERED}` },
        },
      ],
      spans: [
        {
          description: `GET https://taily.example/internal/contracts/${FILTERED}`,
          data: { 'http.response.status_code': 200 },
        },
      ],
    })
  })

  it('returns the same object and copes with cycles', () => {
    const event: Record<string, unknown> = { url: '/inspect/abc123' }
    event.self = event

    const result = scrubSentryData(event)

    expect(result).toBe(event)
    expect(event.url).toBe(`/inspect/${FILTERED}`)
  })

  it('passes null and non-string values through', () => {
    expect(scrubSentryData(null)).toBeNull()
    expect(scrubSentryData(42)).toBe(42)
  })
})
