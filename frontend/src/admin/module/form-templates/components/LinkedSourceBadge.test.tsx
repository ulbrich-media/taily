import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { LinkableField } from '@/api/types/custom-fields'
import { customFieldQueryKeys } from '@/admin/module/custom-fields/api/queries'
import type { LinkedSettings } from '../api/types'
import { LinkedSourceBadge } from './LinkedSourceBadge'
import { editorFieldFromSource } from './linked-field'
import { genderSource } from './linked-field.fixtures'

function renderBadge(linkable: LinkableField[], onUpdate = vi.fn()) {
  const queryClient = new QueryClient()
  queryClient.setQueryData(customFieldQueryKeys.linkable('animal'), {
    data: linkable,
  })
  render(
    <QueryClientProvider client={queryClient}>
      <LinkedSourceBadge
        field={editorFieldFromSource(genderSource)}
        onUpdate={onUpdate}
      />
    </QueryClientProvider>
  )
  return onUpdate
}

describe('LinkedSourceBadge', () => {
  it('shows nothing while the copy matches its source', () => {
    renderBadge([genderSource])
    expect(screen.queryByText('Quelle geändert')).not.toBeInTheDocument()
  })

  it('flags a changed source and re-copies it', async () => {
    const changed = {
      ...genderSource,
      schema: { type: 'string', enum: ['male', 'female', 'unknown'] },
    }
    const onUpdate = renderBadge([changed])

    expect(screen.getByText('Quelle geändert')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: /Aktualisieren/ }))

    const updated = onUpdate.mock.calls[0][0]
    expect((updated.settings as LinkedSettings).schema).toEqual(changed.schema)
  })

  it('flags a removed source without offering a re-copy', () => {
    renderBadge([])
    expect(screen.getByText('Quelle geändert')).toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: /Aktualisieren/ })
    ).not.toBeInTheDocument()
  })
})
