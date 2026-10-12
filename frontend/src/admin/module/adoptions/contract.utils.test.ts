import { describe, expect, it } from 'vitest'
import {
  describeExpiry,
  getContractView,
  getSignerState,
  isExpiryUrgent,
} from '@/admin/module/adoptions/contract.utils'
import type {
  ContractSigningProcess,
  ContractSigningStatus,
} from '@/api/types/adoptions'

function makeProcess(
  status: ContractSigningStatus,
  mediatorSigned: boolean,
  adopterSigned = false
): ContractSigningProcess {
  return {
    id: 'p1',
    status,
    created_at: '2026-10-01T10:00:00Z',
    completed_at: null,
    terminated_at: null,
    signers: [
      {
        role: 'mediator',
        invited_at: null,
        signed_at: mediatorSigned ? '2026-10-01T11:00:00Z' : null,
        full_name: 'Maria',
        expires_at: null,
      },
      {
        role: 'adopter',
        invited_at: null,
        signed_at: adopterSigned ? '2026-10-02T11:00:00Z' : null,
        full_name: 'Anna',
        expires_at: null,
      },
    ],
  }
}

describe('getContractView', () => {
  it('is signing while a process awaits a signature', () => {
    expect(
      getContractView({
        contract_signed: false,
        contract_source: null,
        contract_signing_process: makeProcess(
          'awaiting_adopter_signature',
          true
        ),
      })
    ).toBe('signing')
  })

  it('is digital for a completed native process', () => {
    expect(
      getContractView({
        contract_signed: true,
        contract_source: 'digital',
        contract_signing_process: makeProcess('completed', true, true),
      })
    ).toBe('digital')
  })

  it('is manual for a hand-confirmed contract', () => {
    expect(
      getContractView({
        contract_signed: true,
        contract_source: 'manual',
        contract_signing_process: null,
      })
    ).toBe('manual')
  })

  it('is open after a cancelled or expired process', () => {
    for (const status of ['cancelled', 'expired'] as const) {
      expect(
        getContractView({
          contract_signed: false,
          contract_source: null,
          contract_signing_process: makeProcess(status, false),
        })
      ).toBe('open')
    }
  })
})

describe('getSignerState', () => {
  it('marks the mediator pending and the adopter queued at the start', () => {
    const process = makeProcess('awaiting_mediator_signature', false)

    expect(getSignerState(process, process.signers[0])).toBe('pending')
    expect(getSignerState(process, process.signers[1])).toBe('queued')
  })

  it('marks the adopter pending once the mediator signed', () => {
    const process = makeProcess('awaiting_adopter_signature', true)

    expect(getSignerState(process, process.signers[0])).toBe('signed')
    expect(getSignerState(process, process.signers[1])).toBe('pending')
  })

  it('marks only the signer who was waited on as expired', () => {
    const process = makeProcess('expired', true)

    expect(getSignerState(process, process.signers[0])).toBe('signed')
    expect(getSignerState(process, process.signers[1])).toBe('expired')
  })

  it('leaves the unreached adopter queued when the mediator never signed', () => {
    const process = makeProcess('cancelled', false)

    expect(getSignerState(process, process.signers[0])).toBe('cancelled')
    expect(getSignerState(process, process.signers[1])).toBe('queued')
  })
})

describe('describeExpiry', () => {
  const now = new Date('2026-10-12T10:00:00')

  it('describes the remaining time in days', () => {
    expect(describeExpiry('2026-10-18T10:00:00', now)).toBe(
      'läuft in 6 Tagen ab'
    )
    expect(describeExpiry('2026-10-13T09:00:00', now)).toBe('läuft morgen ab')
    expect(describeExpiry('2026-10-12T18:00:00', now)).toBe('läuft heute ab')
  })

  it('reports a past expiry', () => {
    expect(describeExpiry('2026-10-11T10:00:00', now)).toBe('Link abgelaufen')
  })

  it('flags links expiring within two days as urgent', () => {
    expect(isExpiryUrgent('2026-10-14T10:00:00', now)).toBe(true)
    expect(isExpiryUrgent('2026-10-15T10:00:00', now)).toBe(false)
  })
})
