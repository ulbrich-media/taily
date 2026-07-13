import { queryOptions } from '@tanstack/react-query'
import { getPasskeys, getSessions } from '@/admin/module/security/api/requests'

export const listPasskeysQuery = queryOptions({
  queryKey: ['passkeys'],
  queryFn: getPasskeys,
})

export const listSessionsQuery = queryOptions({
  queryKey: ['sessions'],
  queryFn: getSessions,
})
