import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  CardTitleIcon,
} from '@/shadcn/components/ui/card'

export interface NavigationCard {
  icon: LucideIcon
  title: string
  subtitle: string
  description?: string
  actions?: ReactNode
}

interface NavigationCardsProps {
  cards: NavigationCard[]
}

export function NavigationCards({ cards }: NavigationCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {cards.map((card) => (
        <Card key={card.title} className="flex flex-col">
          <CardHeader>
            <CardTitle>
              <CardTitleIcon icon={card.icon} />
              {card.title}
            </CardTitle>
            <CardDescription>{card.subtitle}</CardDescription>
          </CardHeader>
          {card.description && (
            <CardContent className="flex-1">
              <p className="text-muted-foreground text-sm">
                {card.description}
              </p>
            </CardContent>
          )}
          {card.actions && (
            <CardFooter className="flex gap-2 justify-end flex-wrap">
              {card.actions}
            </CardFooter>
          )}
        </Card>
      ))}
    </div>
  )
}
