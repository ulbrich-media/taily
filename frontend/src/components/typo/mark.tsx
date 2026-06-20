import type { ReactNode } from 'react'
import { cn } from '@/shadcn/lib/utils.ts'

interface MarkProps {
  children: ReactNode
  variant?: 'default' | 'headline'
}

export const Mark = ({ children, variant = 'default' }: MarkProps) => {
  return (
    <mark
      className={cn(
        'bg-inherit decoration-solid underline decoration-primary text-current/75',
        {
          'decoration-2': variant === 'default',
          'decoration-4': variant === 'headline',
        }
      )}
    >
      {children}
    </mark>
  )
}
