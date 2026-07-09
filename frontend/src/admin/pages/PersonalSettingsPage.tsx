import type { ReactNode } from 'react'
import { Key, KeyRound } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { NavigationCards } from '@/components/navigation/NavigationCards'

interface PersonalSettingsPageProps {
  apiTokensAction: ReactNode
  changePasswordAction: ReactNode
  breadcrumb?: ReactNode
}

export function PersonalSettingsPage({
  apiTokensAction,
  changePasswordAction,
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
