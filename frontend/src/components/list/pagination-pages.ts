export type PageToken = number | 'ellipsis-start' | 'ellipsis-end'

/**
 * Page numbers to render: first, last and the pages around the current one,
 * with ellipses for the gaps. Short ranges are shown in full.
 */
export function getPageTokens(
  current: number,
  last: number,
  siblings = 1
): PageToken[] {
  const slots = siblings * 2 + 5 // first, last, current, siblings, two ellipses
  if (last <= slots) {
    return Array.from({ length: last }, (_, i) => i + 1)
  }

  const start = Math.max(
    2,
    Math.min(current - siblings, last - siblings * 2 - 2)
  )
  const end = Math.min(last - 1, Math.max(current + siblings, siblings * 2 + 3))

  const tokens: PageToken[] = [1]
  if (start > 2) tokens.push('ellipsis-start')
  for (let page = start; page <= end; page++) tokens.push(page)
  if (end < last - 1) tokens.push('ellipsis-end')
  tokens.push(last)
  return tokens
}
