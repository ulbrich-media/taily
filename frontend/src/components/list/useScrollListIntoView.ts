import { useRef } from 'react'

/** Height of the sticky header; a list top below this is still in view. */
const HEADER_OFFSET = 96

/**
 * For lists with pagination below the results: after a page change the user
 * is looking at the bottom of the next page. `scrollIfNeeded` brings the top
 * of the referenced element (toolbar and progress line included) into view,
 * but only when it is scrolled out of view, so nobody at the top is moved.
 * Smooth, unless the user prefers reduced motion.
 */
export function useScrollListIntoView<T extends HTMLElement>() {
  const ref = useRef<T>(null)

  const scrollIfNeeded = () => {
    const element = ref.current
    if (!element || element.getBoundingClientRect().top >= HEADER_OFFSET) return

    const reduceMotion =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches

    element.scrollIntoView({
      behavior: reduceMotion ? 'auto' : 'smooth',
      block: 'start',
    })
  }

  return { ref, scrollIfNeeded }
}
