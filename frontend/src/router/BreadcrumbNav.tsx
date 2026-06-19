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

interface BreadcrumbNavProps {
  items: BreadcrumbItem[]
}

export function BreadcrumbNav({ items }: BreadcrumbNavProps) {
  if (items.length <= 1) return null

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {items.map((crumb, index) => {
          const isLast = index === items.length - 1
          return (
            <Fragment key={`${crumb.pathname}-${index}`}>
              <BcItem>
                {isLast ? (
                  <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    <Link to={crumb.pathname}>{crumb.label}</Link>
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
