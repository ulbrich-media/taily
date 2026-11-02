import { apiRequest } from '@/lib/api'
import type {
  ContractFieldOptions,
  ContractTemplateField,
  ContractTemplateResource,
} from '@/api/types/contract-templates'

export interface ContractTemplateRequest {
  name: string
  title: string
  body: string
  animal_type_ids: string[]
  animal_fields: ContractTemplateField[]
  mediator_fields: ContractTemplateField[]
  adopter_fields: ContractTemplateField[]
}

export interface ContractTemplateResponse {
  message: string
  data: ContractTemplateResource
}

const json = (method: string, body?: unknown): RequestInit => ({
  method,
  body: body === undefined ? undefined : JSON.stringify(body),
})

export const getContractTemplates = () =>
  apiRequest<ContractTemplateResource[]>('contract-templates')

export const getContractTemplate = (id: string) =>
  apiRequest<ContractTemplateResource>(`contract-templates/${id}`)

export const getContractFieldOptions = () =>
  apiRequest<ContractFieldOptions>('contract-templates/field-options')

export const createContractTemplate = (data: ContractTemplateRequest) =>
  apiRequest<ContractTemplateResponse>('contract-templates', json('POST', data))

export const updateContractTemplate = (
  id: string,
  data: ContractTemplateRequest
) =>
  apiRequest<ContractTemplateResponse>(
    `contract-templates/${id}`,
    json('PUT', data)
  )

export const archiveContractTemplate = (id: string) =>
  apiRequest<ContractTemplateResponse>(
    `contract-templates/${id}/archive`,
    json('POST')
  )

export const restoreContractTemplate = (id: string) =>
  apiRequest<ContractTemplateResponse>(
    `contract-templates/${id}/archive`,
    json('DELETE')
  )
