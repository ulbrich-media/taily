import type { ReactNode } from 'react'
import { PageHeader } from '@/components/layout/PageHeader'
import { PasskeySection } from '@/admin/module/security/components/PasskeySection'
import { PasswordSection } from '@/admin/module/security/components/PasswordSection'
import { SessionsSection } from '@/admin/module/security/components/SessionsSection'
import { TwoFactorSection } from '@/admin/module/security/components/TwoFactorSection'

interface SecurityPageProps {
  breadcrumb?: ReactNode
}

/**
 * Single overview of the account's security settings. Each section shows the
 * current state and launches the relevant action (password change, two-factor
 * setup, recovery codes) in its own dialog.
 */
export function SecurityPage({ breadcrumb }: SecurityPageProps) {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Sicherheit"
        description="Verwalte Passwort, Passkeys und Zwei-Faktor-Authentifizierung deines Kontos"
        breadcrumb={breadcrumb}
      />

      <div className="space-y-6">
        <PasswordSection />
        <PasskeySection />
        <TwoFactorSection />
        <SessionsSection />
      </div>
    </div>
  )
}
