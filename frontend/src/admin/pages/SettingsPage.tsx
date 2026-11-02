import type { ReactNode } from 'react'
import {
  Syringe,
  FlaskConical,
  Users,
  TriangleAlert,
  Building2,
  ClipboardList,
  PawPrint,
  ListChecks,
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
  caseFileAction: ReactNode
  vaccinationsAction: ReactNode
  medicalTestsAction: ReactNode
  organizationsAction: ReactNode
  formTemplatesAction: ReactNode
  breadcrumb?: ReactNode
}

export function SettingsPage({
  usersAction,
  animalTypesAction,
  caseFileAction,
  vaccinationsAction,
  medicalTestsAction,
  organizationsAction,
  formTemplatesAction,
  breadcrumb,
}: SettingsPageProps) {
  const { isAdmin } = useAuth()

  return (
    <div className="space-y-6">
      <PageHeader
        title="Einstellungen"
        description="Verwalte deine Systemeinstellungen"
        breadcrumb={breadcrumb}
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
            subtitle: 'Verfügbare Tierarten',
            description: 'Verwalte die Tierarten, die vermittelt werden.',
            actions: animalTypesAction,
          },
          {
            icon: ListChecks,
            title: 'Angaben',
            subtitle: 'Was eine Vermittlung je Tierart erfragt',
            description:
              'Lege fest, welche Angaben Bewerber:innen machen, wann sie gebraucht werden und wer sie sieht.',
            actions: caseFileAction,
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
