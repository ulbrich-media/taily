import { useLayoutEffect, useState, type RefObject } from 'react'

/**
 * How many of the measured items fit into the slot next to an overflow
 * button. `measureRef` holds one child per item followed by a child for the
 * overflow button, all rendered at their natural width.
 *
 * Returns the number of items that stay inline; when all fit, no overflow
 * button is needed.
 */
export function useFittingCount(
  slotRef: RefObject<HTMLElement | null>,
  measureRef: RefObject<HTMLElement | null>,
  itemCount: number
): number {
  const [count, setCount] = useState(itemCount)

  useLayoutEffect(() => {
    const slot = slotRef.current
    const measure = measureRef.current
    if (!slot || !measure) return

    const update = () => {
      const widths = Array.from(measure.children).map(
        (child) => (child as HTMLElement).offsetWidth
      )
      const overflowWidth = widths.pop() ?? 0
      const gap = parseFloat(getComputedStyle(measure).columnGap) || 0
      const available = slot.clientWidth

      const total =
        widths.reduce((sum, width) => sum + width, 0) +
        gap * Math.max(widths.length - 1, 0)
      if (total <= available) {
        setCount(widths.length)
        return
      }

      let used = overflowWidth
      let fitting = 0
      for (const width of widths) {
        used += gap + width
        if (used > available) break
        fitting++
      }
      setCount(fitting)
    }

    update()
    if (typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(update)
    observer.observe(slot)
    observer.observe(measure)
    return () => observer.disconnect()
  }, [slotRef, measureRef, itemCount])

  return Math.min(count, itemCount)
}
