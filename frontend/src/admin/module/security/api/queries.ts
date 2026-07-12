import { queryOptions } from '@tanstack/react-query'
import { getPasskeys } from '@/admin/module/security/api/requests'

export const listPasskeysQuery = queryOptions({
  queryKey: ['passkeys'],
  queryFn: getPasskeys,
})
