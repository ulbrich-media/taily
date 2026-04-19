import type { ReactNode } from 'react'
import { Settings, Key } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { NavigationCards } from '@/components/navigation/NavigationCards'

interface PersonalSettingsPageProps {
  apiTokensAction: ReactNode
}

export function PersonalSettingsPage({
  apiTokensAction,
}: PersonalSettingsPageProps) {
  return (
    <div className="space-y-6">
      <PageHeader
        icon={Settings}
        title="Persönliche Einstellungen"
        description="Passe deine persönlichen Präferenzen an"
      />

      <NavigationCards
        cards={[
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
