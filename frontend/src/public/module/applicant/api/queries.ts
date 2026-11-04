import { queryOptions } from '@tanstack/react-query'
import {
  getApplicationForm,
  getPortalAdoption,
  getPortalOverview,
} from './requests'

export const applicantQueryKeys = {
  all: ['applicant'] as const,
  form: (animalId: string) => ['applicant', 'form', animalId] as const,
  overview: () => ['applicant', 'portal'] as const,
  adoption: (id: string) => ['applicant', 'portal', id] as const,
}

export const getApplicationFormQuery = (animalId: string) =>
  queryOptions({
    queryKey: applicantQueryKeys.form(animalId),
    queryFn: () => getApplicationForm(animalId),
  })

// Portal data depends on the session, so it is never shared between logins.
export const getPortalOverviewQuery = () =>
  queryOptions({
    queryKey: applicantQueryKeys.overview(),
    queryFn: getPortalOverview,
    staleTime: 0,
    retry: false,
  })

export const getPortalAdoptionQuery = (id: string) =>
  queryOptions({
    queryKey: applicantQueryKeys.adoption(id),
    queryFn: () => getPortalAdoption(id),
    staleTime: 0,
    retry: false,
  })
