import type { ReactNode } from 'react'
import { Key, ShieldCheck } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { NavigationCards } from '@/components/navigation/NavigationCards'

interface PersonalSettingsPageProps {
  apiTokensAction: ReactNode
  securityAction: ReactNode
  breadcrumb?: ReactNode
}

export function PersonalSettingsPage({
  apiTokensAction,
  securityAction,
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
            icon: ShieldCheck,
            title: 'Sicherheit',
            subtitle: 'Konto-Sicherheit',
            description:
              'Verwalte dein Passwort und die Zwei-Faktor-Authentifizierung',
            actions: securityAction,
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
