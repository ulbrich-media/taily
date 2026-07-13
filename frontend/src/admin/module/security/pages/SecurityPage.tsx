import type { ReactNode } from 'react'
import { PageHeader } from '@/components/layout/PageHeader'
import { PasskeySection } from '@/admin/module/security/components/PasskeySection'
import { PasswordSection } from '@/admin/module/security/components/PasswordSection'
import { SessionsSection } from '@/admin/module/security/components/SessionsSection'
import { TwoFactorSection } from '@/admin/module/security/components/TwoFactorSection'
import type { Passkey, Session } from '@/admin/module/security/api/types'

interface SecurityPageProps {
  breadcrumb?: ReactNode
  passkeys: Passkey[]
  sessions: Session[]
}

/**
 * Single overview of the account's security settings. Each section shows the
 * current state and launches the relevant action (password change, two-factor
 * setup, recovery codes) in its own dialog. Passkeys and sessions are
 * resolved by the route (see the `security` route file) and passed down as
 * props; this page never fetches them itself.
 */
export function SecurityPage({
  breadcrumb,
  passkeys,
  sessions,
}: SecurityPageProps) {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Sicherheit"
        description="Alles was dir hilft dein Konto sicher zu halten"
        breadcrumb={breadcrumb}
      />

      <div className="space-y-6 max-w-3xl mx-auto">
        <PasswordSection />
        <PasskeySection passkeys={passkeys} />
        <TwoFactorSection />
        <SessionsSection sessions={sessions} />
      </div>
    </div>
  )
}
