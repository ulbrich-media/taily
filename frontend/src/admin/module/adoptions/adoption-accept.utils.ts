/**
 * Who is pre-selected when accepting: the logged-in user's person if that
 * person is a selectable mediator, otherwise the adoption's current mediator.
 */
export function getDefaultMediatorId(
  currentPersonId: string | null | undefined,
  mediators: { id: string }[],
  adoptionMediatorId: string | null
): string | null {
  if (currentPersonId && mediators.some((m) => m.id === currentPersonId)) {
    return currentPersonId
  }
  return adoptionMediatorId
}
