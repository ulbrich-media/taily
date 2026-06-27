import * as React from 'react'
import { NavigationMenu as NavigationMenuPrimitive } from 'radix-ui'
import { cn } from '@/shadcn/lib/utils.ts'

// Simple vertical nav menu for a list of links. This is not a shadcn/ui component but inspired by its menubar component
function NavMenu({
  className,
  ...props
}: React.ComponentProps<typeof NavigationMenuPrimitive.List>) {
  return (
    <NavigationMenuPrimitive.Root>
      <NavigationMenuPrimitive.List
        data-slot="nav-menu"
        className={cn('flex flex-col gap-1', className)}
        {...props}
      />
    </NavigationMenuPrimitive.Root>
  )
}

function NavMenuItem({
  className,
  asChild,
  ...props
}: React.ComponentProps<typeof NavigationMenuPrimitive.Link>) {
  return (
    <NavigationMenuPrimitive.Item>
      <NavigationMenuPrimitive.Link
        data-slot="nav-menu-item"
        asChild={asChild}
        className={cn(
          'flex w-full cursor-pointer select-none rounded-md px-3 py-2.5 text-sm outline-none transition-colors hover:bg-accent [&.active]:bg-accent [&.active]:font-medium',
          className
        )}
        {...props}
      />
    </NavigationMenuPrimitive.Item>
  )
}

export { NavMenu, NavMenuItem }
