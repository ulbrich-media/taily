import type { ReactNode } from 'react'
import { Key, KeyRound, ShieldCheck } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { NavigationCards } from '@/components/navigation/NavigationCards'

interface PersonalSettingsPageProps {
  apiTokensAction: ReactNode
  changePasswordAction: ReactNode
  twoFactorAction: ReactNode
  breadcrumb?: ReactNode
}

export function PersonalSettingsPage({
  apiTokensAction,
  changePasswordAction,
  twoFactorAction,
  breadcrumb,
}: PersonalSettingsPageProps) {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Persönliche Einstellungen"
        description="Passe deine persönlichen Präferenzen an"
        breadcrumb={breadcrumb}
      />

      <NavigationCards
        cards={[
          {
            icon: KeyRound,
            title: 'Passwort ändern',
            subtitle: 'Konto-Sicherheit',
            description: 'Aktualisiere das Passwort für dein Konto',
            actions: changePasswordAction,
          },
          {
            icon: ShieldCheck,
            title: 'Zwei-Faktor-Authentifizierung',
            subtitle: 'Konto-Sicherheit',
            description:
              'Sichere die Anmeldung mit einem zusätzlichen Code aus einer Authentifizierungs-App',
            actions: twoFactorAction,
          },
          {
            icon: Key,
            title: 'API Tokens',
            subtitle: 'Externe API-Zugriffstoken',
            description:
              'Verwalte API-Tokens für den externen Zugriff auf die öffentliche API',
            actions: apiTokensAction,
          },
        ]}
      />
    </div>
  )
}
