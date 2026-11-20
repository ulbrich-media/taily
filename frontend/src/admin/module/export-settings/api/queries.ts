import { queryOptions } from '@tanstack/react-query'
import { getTiervermittlungSettings } from './requests'

export const exportSettingsQueryKeys = {
  tiervermittlung: ['exportSettings', 'tiervermittlung'],
}

export const tiervermittlungSettingsQuery = queryOptions({
  queryFn: () => getTiervermittlungSettings(),
  queryKey: exportSettingsQueryKeys.tiervermittlung,
})
