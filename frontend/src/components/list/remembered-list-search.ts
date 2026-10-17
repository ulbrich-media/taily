import { deepEqual } from '@tanstack/react-router'
import type { ZodType } from 'zod'
import { LIST_VIEWS, type ListView } from './list-search'

// Work in progress is what this is for, not a long-term preference.
export const REMEMBER_MAX_AGE_MS = 2 * 60 * 60 * 1000

const PREFIX = 'taily:list-search:'
const VIEW_PREFIX = 'taily:list-view:'

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
  if (isListView(search.view)) rememberListView(key, search.view)
}

function isListView(value: unknown): value is ListView {
  return (LIST_VIEWS as readonly unknown[]).includes(value)
}

/**
 * Remembers the table/cards choice of a list. Unlike the filters this is a
 * preference: it does not expire and survives logout.
 */
export function rememberListView(key: string, view: ListView): void {
  try {
    localStorage.setItem(VIEW_PREFIX + key, view)
  } catch {
    // Not remembering is fine.
  }
}

/** The remembered view of a list, or null if none or invalid. */
export function recallListView(key: string): ListView | null {
  try {
    const value = localStorage.getItem(VIEW_PREFIX + key)
    return isListView(value) ? value : null
  } catch {
    return null
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

/**
 * The search to redirect to when a list is entered, or null to stay where we
 * are. Only a fresh entry with nothing asked for in the URL restores; an
 * explicit link, or moving within the open list, never does.
 */
export function searchToRestore<T>(options: {
  cause: string
  search: T
  defaults: T
  key: string
  schema: ZodType<T>
  now?: number
}): T | null {
  const { cause, search, defaults, key, schema, now } = options
  if (cause !== 'enter') return null

  let target: T = search
  if (isDefaultSearch(search, defaults)) {
    target = recallListSearch(key, schema, now) ?? search
  }

  // The view is a lasting preference and wins over the (expiring) remembered
  // search. Defaults are stripped from URLs, so a view equal to the default
  // counts as "not asked for".
  const view = (target as { view?: unknown }).view
  const defaultView = (defaults as { view?: unknown }).view
  const preferred = recallListView(key)
  if (preferred && view === defaultView && preferred !== view) {
    target = { ...target, view: preferred }
  }

  return isDefaultSearch(target, search) ? null : target
}
