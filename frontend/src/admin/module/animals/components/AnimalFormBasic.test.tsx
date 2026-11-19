import { beforeAll, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { AnimalTypeResource } from '@/api/types/animal-types'
import type { AnimalDetailResource } from '@/api/types/animals'
import { AnimalFormBasic } from './AnimalFormBasic'

// The blocker needs a router; it plays no part in what is tested here.
vi.mock('@/components/form/FormBlocker', () => ({ FormBlocker: () => null }))

beforeAll(() => {
  // jsdom has no ResizeObserver, which the radio group needs.
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    }
  )
})

const dogs = {
  id: 'type-1',
  title: 'Hund',
  tiervermittlung_species: 'dog',
  pre_inspection_form_template_id: null,
  pre_inspection_form_template: null,
  created_at: '',
  updated_at: '',
} satisfies AnimalTypeResource

const animal = {
  animal_type_id: dogs.id,
  name: 'Bello',
  gender: 'male',
  current_country: 'RO',
} as Partial<AnimalDetailResource>

describe('AnimalFormBasic', () => {
  it('shows the current country and lets it be cleared', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined)
    render(
      <AnimalFormBasic
        animalTypes={[dogs]}
        defaultValues={animal}
        onSubmit={onSubmit}
      />
    )

    const country = screen.getByRole('combobox', { name: /Aufenthaltsland/ })
    expect(country).toHaveTextContent('Rumänien')

    await userEvent.click(
      screen.getByRole('button', { name: 'Aufenthaltsland entfernen' })
    )
    expect(country).toHaveTextContent('Bitte wählen...')
    expect(
      screen.getByRole('button', { name: 'Aufenthaltsland entfernen' })
    ).toBeDisabled()

    await userEvent.click(screen.getByRole('button', { name: 'Speichern' }))

    await waitFor(() => expect(onSubmit).toHaveBeenCalled())
    expect(onSubmit.mock.calls[0][0]).toMatchObject({ current_country: '' })
  })
})
