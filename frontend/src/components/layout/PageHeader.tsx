import type { ReactNode } from 'react'

export const tabLinkClass =
  'px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground rounded-md hover:bg-accent transition-colors [&.active]:bg-accent [&.active]:text-foreground'

interface PageHeaderProps {
  title: string | ReactNode
  description?: string
  actions?: ReactNode // one or two buttons to do something
  links?: ReactNode // a navigation element with a list of links
  breadcrumb?: ReactNode // the breadcrumb component shown above the headline
  // 'section' renders a smaller h2 for content inside a page that has its own h1
  variant?: 'page' | 'section'
}

export function PageHeader({
  title,
  description,
  links,
  actions,
  breadcrumb,
  variant = 'page',
}: PageHeaderProps) {
  const Heading = variant === 'section' ? 'h2' : 'h1'
  return (
    <div className="flex flex-col gap-2">
      {breadcrumb && <div className="mb-2">{breadcrumb}</div>}
      <div className="flex flex-col gap-4 md:flex-row justify-between">
        <div>
          <Heading
            className={
              variant === 'section'
                ? 'text-2xl font-heading text-foreground flex items-center gap-2'
                : 'text-4xl font-heading text-foreground flex items-center gap-2'
            }
          >
            {title}
          </Heading>
          {description && (
            <p className="text-muted-foreground mt-2">{description}</p>
          )}
        </div>
        {links && (
          <div className="self-end flex justify-end">
            <nav className="inline-flex gap-1 bg-card p-1 rounded-xl border shadow-sm">
              {links}
            </nav>
          </div>
        )}
        {actions && <div className="self-end md:self-center">{actions}</div>}
      </div>
    </div>
  )
}
