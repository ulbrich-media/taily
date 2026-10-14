/**
 * Classes for list content that is being replaced: the old rows keep their
 * place and pulse softly, and cannot be clicked while they are stale. The
 * animation starts after a short delay so a fast response never flashes.
 */
export const updatingClass =
  'pointer-events-none animate-pulse [animation-delay:150ms] motion-reduce:animate-none motion-reduce:opacity-60'
