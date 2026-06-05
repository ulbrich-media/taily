import { apiRequest } from '@/lib/api'
import type {
  FormTemplatesResponse,
  FormTemplateResponse,
  UpdateFormTemplateRequest,
  UpdateFormTemplateResponse,
  CreateFormTemplateRequest,
  CreateFormTemplateResponse,
} from './types'

/** Returns all form templates with their latest version and total submission count. */
export async function getFormTemplates(): Promise<FormTemplatesResponse> {
  return apiRequest<FormTemplatesResponse>('form-templates')
}

/** Returns a form template by its stable UUID. */
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
