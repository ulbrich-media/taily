import { apiRequest } from '@/lib/api'
import type { PersonsResponse } from './types'

export async function getPersons(): Promise<PersonsResponse> {
  return apiRequest<PersonsResponse>('persons')
}
