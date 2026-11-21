export type CompatibleWithOption = 'children' | 'dogs' | 'cats'

export type CompatibleWithMapping = Record<CompatibleWithOption, string[]>

export interface ExportAttentionItem {
  animal_id: string
  animal_type_id: string | null
  name: string | null
  status: 'abgelehnt' | 'nicht_veroeffentlicht'
}

export interface ExportNotExportedItem {
  animal_id: string
  animal_type_id: string | null
  name: string | null
  reasons: string[]
}

export interface TiervermittlungExportStatus {
  enabled: boolean
  api_key_configured: boolean
  listings: {
    veroeffentlicht: number
    nicht_veroeffentlicht: number
    doppelt: number
    abgelehnt: number
    not_delivered: number
  }
  last_delivery_at: string | null
  attention: ExportAttentionItem[]
  not_exported: ExportNotExportedItem[]
}

export interface TiervermittlungSettingsResponse {
  compatibleWith: CompatibleWithMapping
  status: TiervermittlungExportStatus
}

export interface UpdateTiervermittlungSettingsRequest {
  compatibleWith: CompatibleWithMapping
}

export type UpdateTiervermittlungSettingsResponse =
  TiervermittlungSettingsResponse & {
    message: string
  }
