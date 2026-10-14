interface MatchWithStaticData {
  staticData?: { dialog?: boolean }
}

/**
 * Dialogs are routes, but opening or closing one must not move the page
 * behind it. Scroll is only reset when neither side of a navigation is a
 * dialog route.
 */
export function shouldResetScroll(
  fromMatches: readonly MatchWithStaticData[],
  toMatches: readonly MatchWithStaticData[]
): boolean {
  const isDialog = (match: MatchWithStaticData) =>
    match.staticData?.dialog === true
  return !fromMatches.some(isDialog) && !toMatches.some(isDialog)
}
