import {
  FieldDescription,
  FieldGroup,
  FieldLegend,
  FieldSet,
} from '@/shadcn/components/ui/field.tsx'
import type { ReactNode } from 'react'
import { cn } from '@/shadcn/lib/utils.ts'

interface FormSectionProps {
  title: string
  titleHidden?: boolean
  description?: string
  children: ReactNode
}

export function FormSection({
  title,
  titleHidden,
  description,
  children,
}: FormSectionProps) {
  return (
    <FieldSet>
      <FieldLegend
        className={cn({
          'sr-only': titleHidden,
          'mb-6': !description,
        })}
      >
        {title}
      </FieldLegend>
      {description && <FieldDescription>{description}</FieldDescription>}
      <FieldGroup>{children}</FieldGroup>
    </FieldSet>
  )
}
