import type { ReactNode } from 'react'

interface InfoRowProps {
  label: string
  children: ReactNode | string | null | undefined
}

export function InfoRow({ label, children }: InfoRowProps) {
  const isValidString = typeof children === 'string' && !!children.trim()
  const isValidReactNode = !!children && typeof children === 'object'

  return (
    <dl>
      <dt className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
        {label}
      </dt>
      <dd>
        {isValidString && <InfoRowValue>{children}</InfoRowValue>}
        {isValidReactNode && <div>{children}</div>}
        {!isValidString && !isValidReactNode && <InfoRowEmptyValue />}
      </dd>
    </dl>
  )
}

export function InfoRowEmptyValue() {
  return (
    <div
      className="text-sm font-medium text-muted-foreground"
      aria-label="Keine Angabe"
    >
      k.A.
    </div>
  )
}

interface InfoRowValueProps {
  children: ReactNode
}

export function InfoRowValue({ children }: InfoRowValueProps) {
  return <div className="text-sm font-medium whitespace-pre">{children}</div>
}
