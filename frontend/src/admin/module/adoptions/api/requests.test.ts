import { beforeEach, describe, expect, it, vi } from 'vitest'
import { apiRequest } from '@/lib/api'
import { getAdoptions } from './requests'

vi.mock('@/lib/api', () => ({ apiRequest: vi.fn() }))

const apiRequestMock = vi.mocked(apiRequest)

const page = (ids: string[], current: number, last: number) => ({
  data: ids.map((id) => ({ id })),
  meta: { current_page: current, last_page: last, per_page: 100, total: 0 },
})

beforeEach(() => apiRequestMock.mockReset())

describe('getAdoptions', () => {
  it('collects every page, not only the first one', async () => {
    apiRequestMock
      .mockResolvedValueOnce(page(['a', 'b'], 1, 3))
      .mockResolvedValueOnce(page(['c'], 2, 3))
      .mockResolvedValueOnce(page(['d'], 3, 3))

    const adoptions = await getAdoptions({ applicant_id: 'person-1' })

    expect(adoptions.map((adoption) => adoption.id)).toEqual([
      'a',
      'b',
      'c',
      'd',
    ])
    expect(apiRequestMock).toHaveBeenCalledTimes(3)

    const urls = apiRequestMock.mock.calls.map(([url]) => String(url))
    expect(urls[0]).toContain('page=1')
    expect(urls[2]).toContain('page=3')
    for (const url of urls) {
      expect(decodeURIComponent(url)).toContain('filter[applicant_id]=person-1')
      expect(url).toContain('per_page=100')
    }
  })

  it('makes a single request when everything fits on one page', async () => {
    apiRequestMock.mockResolvedValueOnce(page(['a'], 1, 1))

    await getAdoptions()

    expect(apiRequestMock).toHaveBeenCalledTimes(1)
  })
})
