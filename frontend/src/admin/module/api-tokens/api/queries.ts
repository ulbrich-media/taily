import { type QueryKey, queryOptions } from '@tanstack/react-query'
import {
  getApiAbilities,
  getApiTokens,
} from '@/admin/module/api-tokens/api/requests.ts'

export const apiTokenQueryKeys: Record<string, QueryKey> = {
  all: ['apiTokens'],
  list: ['apiTokens', 'list'],
  abilities: ['apiTokens', 'abilities'],
}

export const listApiTokensQuery = queryOptions({
  queryFn: getApiTokens,
  queryKey: apiTokenQueryKeys.list,
})

export const listApiTokenAbilitiesQuery = queryOptions({
  queryFn: getApiAbilities,
  queryKey: apiTokenQueryKeys.abilities,
})
