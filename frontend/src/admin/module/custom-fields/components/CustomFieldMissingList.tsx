import type { ReactNode } from 'react'
import { CircleAlert } from 'lucide-react'
import type {
  CustomFieldMissing,
  CustomFieldSection,
} from '@/api/types/custom-fields'

interface CustomFieldMissingListProps {
  missing: CustomFieldMissing[] | undefined
  /** Wraps a label in a link to the tab where the field is edited. */
  renderSectionLink?: (
    section: CustomFieldSection,
    children: ReactNode
  ) => ReactNode
}

/** "Fehlende Angaben" in the record sidebars; renders nothing when complete. */
export function CustomFieldMissingList({
  missing,
  renderSectionLink,
}: CustomFieldMissingListProps) {
  if (!missing?.length) return null

  return (
    <div className="pt-2 border-t">
      <span className="text-xs text-muted-foreground uppercase tracking-wide flex items-center gap-1 mb-2">
        <CircleAlert className="size-3.5 text-amber-600" />
        Fehlende Angaben
      </span>
      <ul className="space-y-1 text-sm">
        {missing.map((field) => (
          <li key={field.key}>
            {renderSectionLink
              ? renderSectionLink(field.section, field.label)
              : field.label}
          </li>
        ))}
      </ul>
    </div>
  )
}
