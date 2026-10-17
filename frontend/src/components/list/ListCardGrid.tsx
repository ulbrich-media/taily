import type { ReactNode } from 'react'
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from '@/shadcn/components/ui/card'
import { cn } from '@/shadcn/lib/utils'

interface ListCardGridProps<T> {
  items: T[]
  getKey: (item: T) => string
  className?: string
  children: (item: T) => ReactNode
}

/** The grid of the cards view: one `ListCard` per item. */
export function ListCardGrid<T>({
  items,
  getKey,
  className,
  children,
}: ListCardGridProps<T>) {
  return (
    <ul
      className={cn(
        'grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5',
        className
      )}
    >
      {items.map((item) => (
        <li key={getKey(item)} className="flex">
          {children(item)}
        </li>
      ))}
    </ul>
  )
}

interface ListCardProps {
  /** Title area, e.g. the name of the item. */
  header: ReactNode
  /** The remaining columns of the table row, usually `InfoRow`s. */
  children?: ReactNode
  /** The row actions. */
  footer?: ReactNode
}

/** One item of the cards view; shows what the table row shows. */
export function ListCard({ header, children, footer }: ListCardProps) {
  return (
    <Card className="w-full py-4 gap-4">
      <CardHeader className="px-4">
        <div className="min-w-0 break-words">{header}</div>
      </CardHeader>
      {children && (
        <CardContent className="space-y-4 px-4">{children}</CardContent>
      )}
      {footer && (
        <CardFooter className="px-4 mt-auto justify-end">{footer}</CardFooter>
      )}
    </Card>
  )
}
