import { beforeEach, describe, expect, it, vi } from 'vitest'
import { apiRequest } from '@/lib/api'
import { animalListSearchDefaults } from '../animal-list.search'
import { getAnimalsPage } from './requests'

vi.mock('@/lib/api', () => ({ apiRequest: vi.fn() }))

const apiRequestMock = vi.mocked(apiRequest)

beforeEach(() => apiRequestMock.mockReset())

describe('getAnimalsPage', () => {
  it('requests one page with the list params', async () => {
    apiRequestMock.mockResolvedValueOnce({ data: [], meta: {} })

    await getAnimalsPage({
      ...animalListSearchDefaults,
      page: 2,
      search: 'luna',
      status: ['open'],
    })

    const url = decodeURIComponent(String(apiRequestMock.mock.calls[0][0]))
    expect(url).toMatch(/^animals\?/)
    expect(url).toContain('page=2')
    expect(url).toContain('per_page=25')
    expect(url).toContain('search=luna')
    expect(url).toContain('filter[status]=open')
  })

  it('uses a smaller page size for pickers', async () => {
    apiRequestMock.mockResolvedValueOnce({ data: [], meta: {} })

    await getAnimalsPage({ ...animalListSearchDefaults, search: 'x' }, 10)

    expect(String(apiRequestMock.mock.calls[0][0])).toContain('per_page=10')
  })
})
