import { apiRequest } from '@/lib/api'
import type {
  TiervermittlungSettingsResponse,
  UpdateTiervermittlungSettingsRequest,
  UpdateTiervermittlungSettingsResponse,
} from './types'

export async function getTiervermittlungSettings(): Promise<TiervermittlungSettingsResponse> {
  return apiRequest<TiervermittlungSettingsResponse>(
    'export-settings/tiervermittlung'
  )
}

export async function updateTiervermittlungSettings(
  data: UpdateTiervermittlungSettingsRequest
): Promise<UpdateTiervermittlungSettingsResponse> {
  return apiRequest<UpdateTiervermittlungSettingsResponse>(
    'export-settings/tiervermittlung',
    {
      method: 'PUT',
      body: JSON.stringify(data),
    }
  )
}
