import type { ReactNode } from 'react'

interface FormGridProps {
  children: ReactNode
  columns?: 1 | 2
}

export function FormGrid({ children, columns = 2 }: FormGridProps) {
  const gridClass =
    columns === 2 ? 'grid grid-cols-1 md:grid-cols-2 gap-6' : 'space-y-6'

  return <div className={gridClass}>{children}</div>
}
