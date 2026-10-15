import { useEffect, useState } from 'react'
import { cn } from '@/shadcn/lib/utils'

/** Wait before showing, so a fast response never flashes the bar. */
const SHOW_DELAY_MS = 150
const SWEEP_MS = 1200

interface ProgressBarProps {
  loading: boolean
  label?: string
  /** Position it with this, e.g. `absolute inset-x-0 top-0`. */
  className?: string
}

/**
 * Indeterminate 2 px progress line. shadcn's `Progress` is determinate and
 * has no value to show for a refresh.
 *
 * Once it has started, a sweep always runs to the end: when loading finishes
 * mid-sweep the bar stays until the line has reached the right edge.
 */
export function ProgressBar({
  loading,
  label = 'Wird aktualisiert',
  className,
}: ProgressBarProps) {
  const [shown, setShown] = useState(false)

  useEffect(() => {
    if (loading) {
      const timer = setTimeout(() => setShown(true), SHOW_DELAY_MS)
      return () => clearTimeout(timer)
    }

    // The normal way out is the end of the current sweep (below). This is
    // for when no animation runs, e.g. with reduced motion.
    const timer = setTimeout(() => setShown(false), SWEEP_MS + 100)
    return () => clearTimeout(timer)
  }, [loading])

  if (!shown) return null

  return (
    <div
      role="progressbar"
      aria-label={label}
      className={cn(
        'z-10 h-0.5 overflow-hidden animate-in fade-in-0',
        className
      )}
    >
      <div
        className="h-full w-1/3 bg-foreground animate-[progress-sweep_1.2s_ease-in-out_infinite] motion-reduce:w-full motion-reduce:animate-none"
        onAnimationIteration={() => {
          // A sweep has just ended; stop here unless there is more to load.
          if (!loading) setShown(false)
        }}
      />
    </div>
  )
}
