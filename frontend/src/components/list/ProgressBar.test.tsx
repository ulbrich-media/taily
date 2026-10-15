import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, render, screen } from '@testing-library/react'
import { ProgressBar } from './ProgressBar'

afterEach(() => vi.useRealTimers())

// jsdom runs no CSS animations, so the end of a sweep is dispatched by hand.
// It has no AnimationEvent either, so React listens for the prefixed name.
const endSweep = () =>
  act(() => {
    screen
      .getByRole('progressbar')
      .firstElementChild!.dispatchEvent(
        new Event('webkitAnimationIteration', { bubbles: true })
      )
  })

describe('ProgressBar', () => {
  it('does not appear for a request that finishes quickly', () => {
    vi.useFakeTimers()
    const { rerender } = render(<ProgressBar loading />)
    act(() => vi.advanceTimersByTime(100))
    rerender(<ProgressBar loading={false} />)
    act(() => vi.advanceTimersByTime(2000))

    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument()
  })

  it('appears after the delay while loading', () => {
    vi.useFakeTimers()
    render(<ProgressBar loading />)
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument()

    act(() => vi.advanceTimersByTime(150))
    expect(screen.getByRole('progressbar')).toBeInTheDocument()
  })

  it('finishes the current sweep after loading ended', () => {
    vi.useFakeTimers()
    const { rerender } = render(<ProgressBar loading />)
    act(() => vi.advanceTimersByTime(150))

    // Loading is over, but the line has not reached the end yet.
    rerender(<ProgressBar loading={false} />)
    act(() => vi.advanceTimersByTime(300))
    expect(screen.getByRole('progressbar')).toBeInTheDocument()

    // The sweep ends: now it goes.
    endSweep()
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument()
  })

  it('keeps sweeping when a sweep ends while still loading', () => {
    vi.useFakeTimers()
    render(<ProgressBar loading />)
    act(() => vi.advanceTimersByTime(150))

    endSweep()
    expect(screen.getByRole('progressbar')).toBeInTheDocument()
  })

  it('goes away on its own when no animation runs', () => {
    vi.useFakeTimers()
    const { rerender } = render(<ProgressBar loading />)
    act(() => vi.advanceTimersByTime(150))
    rerender(<ProgressBar loading={false} />)

    act(() => vi.advanceTimersByTime(1400))
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument()
  })
})
