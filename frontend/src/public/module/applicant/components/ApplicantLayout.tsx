import type { ReactNode } from 'react'

interface ApplicantLayoutProps {
  children: ReactNode
  // Top-right corner, e.g. logging out.
  action?: ReactNode
}

/** The frame of the public application and portal pages. */
export function ApplicantLayout({ children, action }: ApplicantLayoutProps) {
  return (
    <div className="min-h-screen">
      <header className="mx-auto flex max-w-3xl items-center justify-between px-4 pt-6">
        <span className="font-heading text-lg">Taily</span>
        {action}
      </header>
      <main className="mx-auto max-w-3xl space-y-6 px-4 py-8">{children}</main>
    </div>
  )
}

export function AnimalHeading({
  title,
  animal,
  children,
}: {
  title: ReactNode
  animal: {
    name: string
    animal_type: string | null
    picture_url: string | null
  }
  children?: ReactNode
}) {
  return (
    <div className="flex items-center gap-4">
      {animal.picture_url ? (
        <img
          src={animal.picture_url}
          alt={animal.name}
          className="size-20 shrink-0 rounded-md object-cover"
        />
      ) : null}
      <div className="min-w-0 space-y-1">
        <h1 className="font-heading text-3xl leading-tight">{title}</h1>
        {animal.animal_type && (
          <p className="text-sm text-muted-foreground">{animal.animal_type}</p>
        )}
        {children}
      </div>
    </div>
  )
}
