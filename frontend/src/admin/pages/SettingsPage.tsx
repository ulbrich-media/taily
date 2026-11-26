import type { ReactNode } from 'react'
import {
  FlaskConical,
  Users,
  TriangleAlert,
  Building2,
  ClipboardList,
  PawPrint,
  ListChecks,
  FileSignature,
  Upload,
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
  contractsAction: ReactNode
  medicalTestsAction: ReactNode
  organizationsAction: ReactNode
  formTemplatesAction: ReactNode
  exportAction: ReactNode
  breadcrumb?: ReactNode
}

export function SettingsPage({
  usersAction,
  animalTypesAction,
  caseFileAction,
  contractsAction,
  medicalTestsAction,
  organizationsAction,
  formTemplatesAction,
  exportAction,
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
            title: 'Tierarten & ihre Konfiguration',
            subtitle: 'Alles, was zu einer Tierart gehört',
            description:
              'Verwalte die Tierarten, die vermittelt werden, und ihre Einstellungen.',
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
            icon: FileSignature,
            title: 'Verträge',
            subtitle: 'Vorlagen für den Schutzvertrag',
            description:
              'Lege Titel, Vertragstext und die gedruckten Angaben fest – Pflichtfelder erscheinen auf der Checkliste jeder Vermittlung.',
            actions: contractsAction,
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
          {
            icon: Upload,
            title: 'Export',
            subtitle: 'Tiervermittlung.de',
            description:
              'Lege fest, wie Verträglichkeiten exportiert werden, und sieh dir den Status des Exports an.',
            actions: exportAction,
          },
        ]}
      />
    </div>
  )
}
