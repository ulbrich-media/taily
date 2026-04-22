import type { ReactNode } from 'react'
import {
  Settings,
  Syringe,
  FlaskConical,
  Users,
  TriangleAlert,
  Building2,
  ClipboardList,
  PawPrint,
} from 'lucide-react'
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/shadcn/components/ui/alert.tsx'
import { useAuth } from '@/lib/auth.hook.tsx'
import { PageHeader } from '@/components/layout/PageHeader'
import { NavigationCards } from '@/components/navigation/NavigationCards'

interface SettingsPageProps {
  usersAction: ReactNode
  animalTypesAction: ReactNode
  vaccinationsAction: ReactNode
  medicalTestsAction: ReactNode
  organizationsAction: ReactNode
  formTemplatesAction: ReactNode
}

export function SettingsPage({
  usersAction,
  animalTypesAction,
  vaccinationsAction,
  medicalTestsAction,
  organizationsAction,
  formTemplatesAction,
}: SettingsPageProps) {
  const { isAdmin } = useAuth()

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Settings}
        title="Einstellungen"
        description="Verwalte deine Systemeinstellungen"
      />

      {!isAdmin && (
        <Alert>
          <TriangleAlert />
          <AlertTitle>Eingeschränkte Berechtigungen</AlertTitle>
          <AlertDescription>
            Einige Einstellungen sind nur für Administratoren verfügbar. Du
            kannst dir trotzdem alles ansehen.
          </AlertDescription>
        </Alert>
      )}

      <NavigationCards
        cards={[
          {
            icon: Users,
            title: 'Benutzerverwaltung',
            subtitle: 'Einladungen und Berechtigungen',
            description:
              'Verwalte alle Benutzer, verändere Berechtigungen oder lade neue Benutzer ein.',
            actions: usersAction,
          },
          {
            icon: PawPrint,
            title: 'Tierarten',
            subtitle: 'Tierarten und Formularvorlagen',
            description:
              'Verwalte die verfügbaren Tierarten und weise Formularvorlagen für Vorkontrollen zu.',
            actions: animalTypesAction,
          },
          {
            icon: Syringe,
            title: 'Impfungen',
            subtitle: 'Verfügbare Impfungen',
            description: 'Verwalte die verfügbaren Impfungen der Tiere.',
            actions: vaccinationsAction,
          },
          {
            icon: FlaskConical,
            title: 'Tests',
            subtitle: 'Medizinische Tests',
            description:
              'Verwalte die verfügbaren medizinischen Tests der Tiere.',
            actions: medicalTestsAction,
          },
          {
            icon: Building2,
            title: 'Organisationen',
            subtitle: 'Organisationen und Kontakte',
            description: 'Verwalte alle Organisationen und deren Kontaktdaten.',
            actions: organizationsAction,
          },
          {
            icon: ClipboardList,
            title: 'Formularvorlagen',
            subtitle: 'Dynamische Formulare',
            description:
              'Erstelle und verwalte Formularvorlagen für Inspektionen, Bewerbungen und andere dynamische Formulare.',
            actions: formTemplatesAction,
          },
        ]}
      />
    </div>
  )
}
