import { deepEqual } from '@tanstack/react-router'
import type { ZodType } from 'zod'

// Work in progress is what this is for, not a long-term preference.
export const REMEMBER_MAX_AGE_MS = 2 * 60 * 60 * 1000

const PREFIX = 'taily:list-search:'

interface Stored {
  savedAt: number
  search: unknown
}

/**
 * Remembers a list's search params, so that coming back to the list through
 * the navigation (a link without params) shows the last filters again. The
 * URL stays the source of truth: remembered state is only read when the URL
 * carries none, and only while it is recent.
 *
 * Storage may be unavailable (private windows, blocked site data); every
 * access is allowed to fail silently.
 */
export function rememberListSearch(
  key: string,
  search: Record<string, unknown>,
  now = Date.now()
): void {
  // The page is not part of what is worth coming back to.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { page, ...rest } = search
  try {
    const stored: Stored = { savedAt: now, search: rest }
    localStorage.setItem(PREFIX + key, JSON.stringify(stored))
  } catch {
    // Not remembering is fine.
  }
}

/** The remembered search if it is recent and still valid for the schema. */
export function recallListSearch<T>(
  key: string,
  schema: ZodType<T>,
  now = Date.now()
): T | null {
  try {
    const raw = localStorage.getItem(PREFIX + key)
    if (raw === null) return null

    const stored = JSON.parse(raw) as Partial<Stored>
    if (
      typeof stored.savedAt !== 'number' ||
      now - stored.savedAt > REMEMBER_MAX_AGE_MS ||
      now < stored.savedAt
    ) {
      localStorage.removeItem(PREFIX + key)
      return null
    }

    const parsed = schema.safeParse(stored.search)
    return parsed.success ? parsed.data : null
  } catch {
    return null
  }
}

/** For logout and login: what one person was working on is not for the next. */
export function clearRememberedListSearches(): void {
  try {
    for (const name of Object.keys(localStorage)) {
      if (name.startsWith(PREFIX)) localStorage.removeItem(name)
    }
  } catch {
    // Nothing to clear.
  }
}

/**
 * True when the URL asked for nothing special. Defaults are stripped from
 * URLs, so "no params" and "all defaults" are the same thing here.
 */
export function isDefaultSearch<T>(search: T, defaults: T): boolean {
  return deepEqual(search, defaults)
}
