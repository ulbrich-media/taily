/** Age as German text, e.g. "2 Jahre", "5 Monate"; "-" without a (valid) birth date. */
export function formatAnimalAge(
  dateOfBirth: string | null,
  now: Date = new Date()
): string {
  if (!dateOfBirth) return '-'
  const birth = new Date(dateOfBirth)
  if (Number.isNaN(birth.getTime())) return '-'

  let months =
    (now.getFullYear() - birth.getFullYear()) * 12 +
    (now.getMonth() - birth.getMonth())
  if (now.getDate() < birth.getDate()) months -= 1
  if (months < 0) return '-'

  if (months < 12) return months === 1 ? '1 Monat' : `${months} Monate`
  const years = Math.floor(months / 12)
  return years === 1 ? '1 Jahr' : `${years} Jahre`
}
