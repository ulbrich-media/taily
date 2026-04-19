import { apiRequest } from '@/lib/api'
import type {
  FormTemplatesResponse,
  FormTemplateResponse,
  UpdateFormTemplateRequest,
  UpdateFormTemplateResponse,
  CreateFormTemplateRequest,
  CreateFormTemplateResponse,
} from './types'

/** Returns the latest version of each template type. */
export async function getFormTemplates(): Promise<FormTemplatesResponse> {
  return apiRequest<FormTemplatesResponse>('form-templates')
}

/** Returns all versions for a specific template type. */
export async function getFormTemplateVersions(
  type: string
): Promise<FormTemplatesResponse> {
  return apiRequest<FormTemplatesResponse>(
    `form-templates/${encodeURIComponent(type)}/versions`
  )
}

/** Returns a single template by UUID. */
export async function getFormTemplate(
  id: string
): Promise<FormTemplateResponse> {
  return apiRequest<FormTemplateResponse>(`form-templates/${id}`)
}

export async function updateFormTemplate(
  id: string,
  data: UpdateFormTemplateRequest
): Promise<UpdateFormTemplateResponse> {
  return apiRequest<UpdateFormTemplateResponse>(`form-templates/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

export async function createFormTemplate(
  data: CreateFormTemplateRequest
): Promise<CreateFormTemplateResponse> {
  return apiRequest<CreateFormTemplateResponse>('form-templates', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}
