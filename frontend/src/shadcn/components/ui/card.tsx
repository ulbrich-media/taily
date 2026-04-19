import * as React from 'react'

import { cn } from '@/shadcn/lib/utils'
import type { LucideIcon } from 'lucide-react'

function Card({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="card"
      className={cn(
        'bg-card text-card-foreground flex flex-col gap-6 rounded-xl border py-6 shadow-sm',
        className
      )}
      {...props}
    />
  )
}

function CardHeader({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="card-header"
      className={cn(
        '@container/card-header grid auto-rows-min grid-rows-[auto_auto] items-start gap-2 px-6 has-data-[slot=card-action]:grid-cols-[1fr_auto] [.border-b]:pb-6',
        className
      )}
      {...props}
    />
  )
}

type CardTitleVariant = 'default' | 'destructive' | 'success'

function CardTitle({
  className,
  variant = 'default',
  ...props
}: React.ComponentProps<'div'> & { variant?: CardTitleVariant }) {
  return (
    <div
      data-slot="card-title"
      data-variant={variant}
      className={cn(
        'leading-none font-semibold flex items-center gap-2',
        variant === 'destructive' && 'text-destructive',
        variant === 'success' && 'text-green-600',
        className
      )}
      {...props}
    />
  )
}

interface CardTitleIconProps {
  className?: string
  icon: LucideIcon
}

function CardTitleIcon({ icon: Icon, className }: CardTitleIconProps) {
  return (
    <Icon
      slot="card-title-icon"
      className={cn(
        'size-5 text-primary',
        'in-data-[variant=destructive]:text-destructive',
        'in-data-[variant=success]:text-green-600',
        className
      )}
    />
  )
}

function CardDescription({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="card-description"
      className={cn('text-muted-foreground text-sm', className)}
      {...props}
    />
  )
}

function CardAction({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="card-action"
      className={cn(
        'col-start-2 row-span-2 row-start-1 self-start justify-self-end',
        className
      )}
      {...props}
    />
  )
}

function CardContent({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="card-content"
      className={cn('px-6', className)}
      {...props}
    />
  )
}

function CardFooter({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="card-footer"
      className={cn('flex items-center px-6 [.border-t]:pt-6', className)}
      {...props}
    />
  )
}

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardTitleIcon,
  CardAction,
  CardDescription,
  CardContent,
}
