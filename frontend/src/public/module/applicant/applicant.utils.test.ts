import { describe, expect, it } from 'vitest'
import type { ApplicantField } from './api/types'
import { applicantRequirement } from './applicant.utils'

const field = (required: ApplicantField['effective_required_for']) =>
  ({ effective_required_for: required }) as ApplicantField

describe('applicantRequirement', () => {
  it('says what is needed now and what later', () => {
    expect(applicantRequirement(field('application'), 'application')).toBe(
      'Pflicht'
    )
    expect(applicantRequirement(field('application'), 'contract')).toBe(
      'Pflicht'
    )
    expect(applicantRequirement(field('contract'), 'application')).toBe(
      'Nötig für: Vertrag'
    )
    expect(applicantRequirement(field(null), 'application')).toBe('')
  })
})
