import { Fragment } from 'react'
import { Link } from '@tanstack/react-router'
import {
  Breadcrumb,
  BreadcrumbItem as BcItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/shadcn/components/ui/breadcrumb'
import type { BreadcrumbItem } from './useBreadcrumbs'
import { PawPrintIcon } from 'lucide-react'

interface BreadcrumbNavProps {
  items: BreadcrumbItem[]
  size?: 'sm' | 'default'
}

export function BreadcrumbNav({ items, size }: BreadcrumbNavProps) {
  if (items.length <= 1) return null

  return (
    <Breadcrumb>
      <BreadcrumbList size={size}>
        {items.map((crumb, index) => {
          const isLast = index === items.length - 1
          return (
            <Fragment key={`${crumb.pathname}-${index}`}>
              <BcItem>
                {isLast ? (
                  <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    <Link to={crumb.pathname} aria-label={crumb.label}>
                      {crumb.isRoot ? <PawPrintIcon /> : crumb.label}
                    </Link>
                  </BreadcrumbLink>
                )}
              </BcItem>
              {!isLast && <BreadcrumbSeparator />}
            </Fragment>
          )
        })}
      </BreadcrumbList>
    </Breadcrumb>
  )
}
