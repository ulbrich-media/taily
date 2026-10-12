import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { AdoptionContractSummary } from '@/admin/module/adoptions/components/AdoptionContractSummary'
import { AdoptionStartContractSigningPage } from '@/admin/module/adoptions/pages/AdoptionStartContractSigningPage'
import { startContractSigning } from '@/admin/module/adoptions/api/requests'
import type {
  AdoptionDetailResource,
  ContractSigningProcess,
} from '@/api/types/adoptions'

vi.mock('@/admin/module/adoptions/api/requests', () => ({
  startContractSigning: vi.fn(),
  generateContract: vi.fn(),
  resendContractSigning: vi.fn(),
}))

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

const startContractSigningMock = vi.mocked(startContractSigning)

function makeAdoption(
  overrides: Partial<AdoptionDetailResource> = {}
): AdoptionDetailResource {
  return {
    id: 'a1',
    contract_signed: false,
    contract_signed_at: null,
    contract_source: null,
    contract_file: null,
    contract_signing_process: null,
    mediator: { full_name: 'Maria Vermittlerin', email: 'maria@example.com' },
    applicant: { full_name: 'Anna Adoptantin', email: 'anna@example.com' },
    ...overrides,
  } as unknown as AdoptionDetailResource
}

function makeProcess(
  overrides: Partial<ContractSigningProcess> = {}
): ContractSigningProcess {
  return {
    id: 'p1',
    status: 'awaiting_mediator_signature',
    created_at: '2026-10-01T10:00:00Z',
    completed_at: null,
    terminated_at: null,
    signers: [
      {
        role: 'mediator',
        invited_at: '2026-10-01T10:00:00Z',
        signed_at: null,
        full_name: 'Maria Vermittlerin',
        expires_at: '2099-01-01T10:00:00Z',
      },
      {
        role: 'adopter',
        invited_at: null,
        signed_at: null,
        full_name: 'Anna Adoptantin',
        expires_at: null,
      },
    ],
    ...overrides,
  }
}

function wrap(node: ReactNode) {
  return (
    <QueryClientProvider client={new QueryClient()}>{node}</QueryClientProvider>
  )
}

const actions = {
  startContractAction: <button>START</button>,
  editContractAction: <button>EDIT</button>,
  cancelSigningAction: <button>CANCEL</button>,
}

describe('AdoptionContractSummary', () => {
  it('offers to start when nothing is signed yet', () => {
    render(
      wrap(<AdoptionContractSummary adoption={makeAdoption()} {...actions} />)
    )

    expect(screen.getByText('START')).toBeInTheDocument()
    expect(screen.queryByText('EDIT')).not.toBeInTheDocument()
  })

  it('shows both signers and resend/cancel while signing runs', () => {
    render(
      wrap(
        <AdoptionContractSummary
          adoption={makeAdoption({
            contract_signing_process: makeProcess(),
          })}
          {...actions}
        />
      )
    )

    expect(screen.getByText(/Vermittler:in – Maria/)).toBeInTheDocument()
    expect(screen.getByText(/Adoptant:in – Anna/)).toBeInTheDocument()
    expect(screen.getByText('Wartet auf Unterschrift')).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /Einladung erneut senden/ })
    ).toBeInTheDocument()
    expect(screen.getByText('CANCEL')).toBeInTheDocument()
    expect(screen.queryByText('START')).not.toBeInTheDocument()
  })

  it('locks a digitally signed contract against manual edits', () => {
    render(
      wrap(
        <AdoptionContractSummary
          adoption={makeAdoption({
            contract_signed: true,
            contract_source: 'digital',
            contract_signing_process: makeProcess({ status: 'completed' }),
          })}
          {...actions}
        />
      )
    )

    expect(screen.getByText('Digital signiert')).toBeInTheDocument()
    expect(screen.queryByText('EDIT')).not.toBeInTheDocument()
    expect(screen.queryByText('START')).not.toBeInTheDocument()
  })

  it('allows editing a manually recorded contract', () => {
    render(
      wrap(
        <AdoptionContractSummary
          adoption={makeAdoption({
            contract_signed: true,
            contract_source: 'manual',
          })}
          {...actions}
        />
      )
    )

    expect(screen.getByText('Manuell erfasst')).toBeInTheDocument()
    expect(screen.getByText('EDIT')).toBeInTheDocument()
  })
})

describe('AdoptionStartContractSigningPage', () => {
  const templates = [{ key: 'default', label: 'Standardvertrag' }]

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('explains the signing order with the recipients named once expanded', async () => {
    const user = userEvent.setup()
    render(
      wrap(
        <AdoptionStartContractSigningPage
          adoption={makeAdoption()}
          templates={templates}
          onClose={vi.fn()}
        />
      )
    )

    const trigger = screen.getByRole('button', {
      name: 'So läuft die Unterschrift ab',
    })
    expect(trigger).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByText(/Maria Vermittlerin erhält/)).toBeNull()

    await user.click(trigger)

    expect(screen.getByText(/Maria Vermittlerin erhält/)).toBeInTheDocument()
    expect(
      screen.getByText(/Anna Adoptantin folgt anschließend/)
    ).toBeInTheDocument()
  })

  it('starts the process with the preselected template', async () => {
    startContractSigningMock.mockResolvedValue({
      message: 'ok',
    } as Awaited<ReturnType<typeof startContractSigning>>)
    const onClose = vi.fn()
    const user = userEvent.setup()

    render(
      wrap(
        <AdoptionStartContractSigningPage
          adoption={makeAdoption()}
          templates={templates}
          onClose={onClose}
        />
      )
    )

    await user.click(
      screen.getByRole('button', { name: 'Signaturvorgang starten' })
    )

    expect(startContractSigningMock).toHaveBeenCalledWith('a1', 'default')
    await vi.waitFor(() => expect(onClose).toHaveBeenCalled())
  })

  it('blocks the start when the applicant has no email address', () => {
    render(
      wrap(
        <AdoptionStartContractSigningPage
          adoption={makeAdoption({
            applicant: {
              full_name: 'Anna Adoptantin',
              email: '',
            } as AdoptionDetailResource['applicant'],
          })}
          templates={templates}
          onClose={vi.fn()}
        />
      )
    )

    expect(
      screen.getByText('Anna Adoptantin hat keine E-Mail-Adresse hinterlegt.')
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Signaturvorgang starten' })
    ).toBeDisabled()
  })
})
