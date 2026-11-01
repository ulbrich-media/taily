import { beforeAll, describe, expect, it } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import { FormProvider, useForm } from 'react-hook-form'
import type { CustomFieldDefinitionGroup } from '@/api/types/custom-fields'
import { CustomFieldSections } from './CustomFieldSections'
import { buildCustomFieldDefaults } from '../custom-fields.schema'
import { idCardGroup, makeGroup } from '../custom-fields.fixtures'

beforeAll(() => {
  // Radix Switch measures itself; jsdom has no ResizeObserver.
  globalThis.ResizeObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
})

function Harness({ groups }: { groups: CustomFieldDefinitionGroup[] }) {
  const form = useForm({
    defaultValues: {
      custom_fields: buildCustomFieldDefaults(groups, {
        id_card_number: 'X123',
      }),
    },
  })
  return (
    <FormProvider {...form}>
      <form>
        <CustomFieldSections groups={groups} control={form.control} />
      </form>
    </FormProvider>
  )
}

describe('CustomFieldSections', () => {
  it('renders one section per group with its fields', () => {
    render(<Harness groups={[makeGroup(), idCardGroup]} />)

    const groups = screen.getAllByRole('group')
    const size = groups.find((g) => within(g).queryByText('Größe'))!
    const idCard = groups.find((g) => within(g).queryByText('Ausweis'))!

    expect(within(size).getByText('Erwartete Größe')).toBeInTheDocument()
    expect(within(size).getByLabelText('Fellnotizen')).toBeInTheDocument()
    expect(within(idCard).getByLabelText('Ausweisnummer')).toHaveValue('X123')
    expect(within(idCard).getByLabelText('Geprüft')).toBeInTheDocument()
  })

  it('marks out-of-scope groups and does not flag their fields as required', () => {
    render(<Harness groups={[makeGroup(), idCardGroup]} />)

    expect(screen.getAllByText('Trifft nicht mehr zu')).toHaveLength(1)
    // Only expected_size (in scope) carries the "Pflicht" badge.
    expect(screen.getAllByText('Pflicht')).toHaveLength(1)
  })

  it('renders nothing without groups', () => {
    const { container } = render(<Harness groups={[]} />)
    expect(container.querySelector('fieldset')).toBeNull()
  })
})
