import type { ReactNode } from 'react'
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/shadcn/components/ui/empty'
import { Card, CardContent } from '@/shadcn/components/ui/card'
import { type LucideIcon, SlashSquare } from 'lucide-react'

interface TableListViewProps<T> {
  data: T[] | undefined
  emptyState: {
    icon?: LucideIcon
    title: string
    description: string
  }
  children: (data: T[]) => ReactNode
}

export function TableListView<T>({
  data,
  emptyState,
  children,
}: TableListViewProps<T>) {
  const hasData = data && data.length > 0

  if (!hasData) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            {emptyState.icon ? <emptyState.icon /> : <SlashSquare />}
          </EmptyMedia>
          <EmptyTitle>{emptyState.title}</EmptyTitle>
          <EmptyDescription>{emptyState.description}</EmptyDescription>
        </EmptyHeader>
      </Empty>
    )
  }

  return (
    <Card>
      <CardContent>{children(data)}</CardContent>
    </Card>
  )
}
