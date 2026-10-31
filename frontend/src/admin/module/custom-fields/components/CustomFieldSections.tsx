import { Fragment } from 'react'
import type { Control, FieldValues } from 'react-hook-form'
import { FieldSeparator } from '@/shadcn/components/ui/field'
import { Badge } from '@/shadcn/components/ui/badge'
import { FormSection } from '@/components/form/FormSection'
import { DynamicFormFields } from '@/components/form/DynamicFormFields'
import type { CustomFieldDefinitionGroup } from '@/api/types/custom-fields'
import {
  CUSTOM_FIELDS_KEY,
  effectiveGroupSchema,
} from '../custom-fields.schema'

interface CustomFieldSectionsProps<T extends FieldValues> {
  /** The groups of one section, in display order (see groupsForSection). */
  groups: CustomFieldDefinitionGroup[]
  control: Control<T>
  disabled?: boolean
  /** Render a FieldSeparator before the first group (after core sections). */
  separatorBefore?: boolean
}

/**
 * Renders one FormSection per Field Group, all writing into the flat
 * `custom_fields.<key>` namespace of the surrounding form.
 */
export function CustomFieldSections<T extends FieldValues>({
  groups,
  control,
  disabled = false,
  separatorBefore = true,
}: CustomFieldSectionsProps<T>) {
  return (
    <>
      {groups.map((group, index) => (
        <Fragment key={group.id}>
          {(separatorBefore || index > 0) && <FieldSeparator />}
          <FormSection
            title={
              <span className="flex items-center gap-2 flex-wrap">
                {group.title}
                {!group.in_scope && (
                  <Badge variant="outline">Trifft nicht mehr zu</Badge>
                )}
              </span>
            }
            description={
              group.in_scope
                ? undefined
                : 'Diese Angaben gelten für diesen Eintrag nicht mehr. Leere die Felder, um sie zu entfernen.'
            }
          >
            <DynamicFormFields
              schema={effectiveGroupSchema(group)}
              uiSchema={group.template.ui_schema}
              control={control as unknown as Control<FieldValues>}
              namePrefix={CUSTOM_FIELDS_KEY}
              disabled={disabled}
              layout="grid"
            />
          </FormSection>
        </Fragment>
      ))}
    </>
  )
}
