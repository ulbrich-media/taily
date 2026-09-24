export type PublicContractSignerRole = 'mediator' | 'adopter'

export interface PublicContractOtherSigner {
  role: PublicContractSignerRole
  typed_name: string
  signed_at: string
}

// Mirrors: api/src/Http/Controllers/Internal/ContractSigningSubmissionController.php (show)
export interface PublicContract {
  role: PublicContractSignerRole
  animal: {
    name: string
    animal_type: string | null
  }
  mediator: { full_name: string | null }
  applicant: { full_name: string }
  other_signer: PublicContractOtherSigner | null
}

export interface SubmitContractSignatureRequest {
  typed_name: string
  contract_content_accepted: boolean
  privacy_policy_accepted: boolean
  information_confirmed: boolean
}
