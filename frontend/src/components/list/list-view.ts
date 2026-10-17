import {
  createContext,
  useCallback,
  useContext,
  useSyncExternalStore,
} from 'react'
import { LIST_VIEWS, type ListView } from './list-search'

// The table/cards choice of a list is a lasting preference of the person, not
// part of the list's state: it lives in local storage, never in the URL, and
// has nothing to do with routing. It does not expire and survives logout.

const VIEW_PREFIX = 'taily:list-view:'
const DEFAULT_VIEW: ListView = 'table'

const listeners = new Set<() => void>()

function isListView(value: unknown): value is ListView {
  return (LIST_VIEWS as readonly unknown[]).includes(value)
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

/**
 * Remembers the view of a list. Storage may be unavailable (private windows,
 * blocked site data); then the choice only holds until the next load.
 */
export function rememberListView(key: string, view: ListView): void {
  try {
    localStorage.setItem(VIEW_PREFIX + key, view)
  } catch {
    // Not remembering is fine.
  }
  listeners.forEach((listener) => listener())
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  // Another tab changed the choice.
  window.addEventListener('storage', listener)
  return () => {
    listeners.delete(listener)
    window.removeEventListener('storage', listener)
  }
}

/** The view of a list and the setter that remembers a new choice. */
export function useListView(key: string) {
  const view = useSyncExternalStore(
    subscribe,
    () => recallListView(key) ?? DEFAULT_VIEW
  )
  const setView = useCallback(
    (next: ListView) => rememberListView(key, next),
    [key]
  )
  return { view, setView }
}

interface ListViewControl {
  view: ListView
  setView: (view: ListView) => void
}

const ListViewContext = createContext<ListViewControl>({
  view: DEFAULT_VIEW,
  setView: () => undefined,
})

/** Gives the toolbar of a list the view `ListPage` renders, see `ListPage`. */
export const ListViewProvider = ListViewContext.Provider

export function useListViewControl() {
  return useContext(ListViewContext)
}
