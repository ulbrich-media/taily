import type { PersonListResource } from '@/api/types/people'

export function personName(person: PersonListResource): string {
  return person.full_name || `${person.first_name} ${person.last_name}`
}
