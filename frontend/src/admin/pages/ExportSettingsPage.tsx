import type { ReactNode } from 'react'
import { PageHeader } from '@/components/layout/PageHeader'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/shadcn/components/ui/card'
import { CompatibilityMappingForm } from '@/admin/module/export-settings/components/CompatibilityMappingForm'
import { ExportStatusCard } from '@/admin/module/export-settings/components/ExportStatusCard'
import type {
  CompatibleWithMapping,
  ExportAttentionItem,
  TiervermittlungExportStatus,
} from '@/admin/module/export-settings/api/types'

interface ExportSettingsPageProps {
  compatibleWith: CompatibleWithMapping
  status: TiervermittlungExportStatus
  isAdmin: boolean
  isSaving?: boolean
  /** Changes after a successful save to reload the form from the saved state. */
  formResetKey?: number
  onSave: (value: CompatibleWithMapping) => void
  renderAnimalLink: (item: ExportAttentionItem) => ReactNode
  breadcrumb?: ReactNode
}

export function ExportSettingsPage({
  compatibleWith,
  status,
  isAdmin,
  isSaving,
  formResetKey = 0,
  onSave,
  renderAnimalLink,
  breadcrumb,
}: ExportSettingsPageProps) {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Export"
        description="Einstellungen und Status der Exporte zu anderen Plattformen"
        breadcrumb={breadcrumb}
      />

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Tiervermittlung.de</h2>

        <Card>
          <CardHeader>
            <CardTitle>Verträglichkeiten</CardTitle>
            <CardDescription>
              Tiervermittlung.de kennt nur Kinder, Hunde und Katzen als
              Verträglichkeit. Lege fest, welche Wörter bei den
              Verträglichkeiten eines Tieres zu welcher Option gehören
              (Groß-/Kleinschreibung spielt keine Rolle).
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CompatibilityMappingForm
              // Only a save resets the form; background refetches must not
              // discard unsaved edits.
              key={formResetKey}
              value={compatibleWith}
              readOnly={!isAdmin}
              isPending={isSaving}
              onSubmit={onSave}
            />
          </CardContent>
        </Card>

        <ExportStatusCard status={status} renderAnimalLink={renderAnimalLink} />
      </section>
    </div>
  )
}
