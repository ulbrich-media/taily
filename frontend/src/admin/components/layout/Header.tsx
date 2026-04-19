import { type ReactNode, useState } from 'react'
import { useAuth } from '@/lib/auth.hook'
import { useTheme } from '@/lib/theme.hook'
import { Button } from '@/shadcn/components/ui/button'
import { Avatar, AvatarFallback } from '@/shadcn/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/shadcn/components/ui/dropdown-menu'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/shadcn/components/ui/sheet'
import { Menu, LogOut, Sun, Moon, Monitor, PawPrint } from 'lucide-react'
import { Badge } from '@/shadcn/components/ui/badge.tsx'

interface HeaderProps {
  navLinks: ReactNode
  dropdownUserItems: ReactNode
  mobileUserLinks: ReactNode
}

export function Header({
  navLinks,
  dropdownUserItems,
  mobileUserLinks,
}: HeaderProps) {
  const { logout, user, isAdmin } = useAuth()
  const { mode, setMode } = useTheme()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Get user initials
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const getThemeIcon = (themeMode: typeof mode) => {
    switch (themeMode) {
      case 'light':
        return <Sun className="mr-2 h-4 w-4" />
      case 'dark':
        return <Moon className="mr-2 h-4 w-4" />
      case 'system':
        return <Monitor className="mr-2 h-4 w-4" />
    }
  }

  return (
    <>
      {/* Sticky Floating Header */}
      <div className="sticky top-0 z-50 w-full pt-2">
        <div className="container mx-auto px-4">
          <header className="bg-card/90 backdrop-blur-sm border border-border rounded-xl shadow-sm">
            <div className="flex h-16 items-center justify-between px-6">
              {/* Left: Logo/Brand */}
              <div className="flex items-center gap-6">
                <a href="/admin" className="font-bold text-xl text-foreground">
                  <PawPrint className="h-6 w-6" />
                </a>

                {/* Desktop Navigation */}
                <nav className="hidden md:flex items-center gap-1">
                  {navLinks}
                </nav>
              </div>

              {/* Right: User Menu & Mobile Trigger */}
              <div className="flex items-center gap-2">
                {/* User Dropdown (Desktop Only) */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className="relative h-10 w-10 rounded-full hidden md:flex"
                    >
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-primary text-primary-foreground">
                          {user && getInitials(user.name)}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuGroup>
                      <DropdownMenuLabel>
                        <div className="flex flex-col space-y-1">
                          <p className="text-sm font-medium leading-none">
                            {user?.name} {isAdmin && <Badge>Admin</Badge>}
                          </p>
                          <p className="text-xs leading-none text-muted-foreground">
                            {user?.email}
                          </p>
                        </div>
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      {dropdownUserItems}
                      <DropdownMenuSeparator />
                      <DropdownMenuSub>
                        <DropdownMenuSubTrigger>
                          {getThemeIcon(mode)}
                          Design
                        </DropdownMenuSubTrigger>
                        <DropdownMenuPortal>
                          <DropdownMenuSubContent>
                            <DropdownMenuRadioGroup
                              value={mode}
                              onValueChange={(value) =>
                                setMode(value as typeof mode)
                              }
                            >
                              <DropdownMenuRadioItem value="system">
                                <Monitor className="mr-2 h-4 w-4" />
                                System
                              </DropdownMenuRadioItem>
                              <DropdownMenuRadioItem value="light">
                                <Sun className="mr-2 h-4 w-4" />
                                Hell
                              </DropdownMenuRadioItem>
                              <DropdownMenuRadioItem value="dark">
                                <Moon className="mr-2 h-4 w-4" />
                                Dunkel
                              </DropdownMenuRadioItem>
                            </DropdownMenuRadioGroup>
                          </DropdownMenuSubContent>
                        </DropdownMenuPortal>
                      </DropdownMenuSub>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem variant="destructive" onClick={logout}>
                        <LogOut className="mr-2 h-4 w-4" />
                        Abmelden
                      </DropdownMenuItem>
                    </DropdownMenuGroup>
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Mobile Menu Trigger */}
                <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                  <SheetTrigger asChild>
                    <Button variant="ghost" size="icon" className="md:hidden">
                      <Menu className="h-5 w-5" />
                      <span className="sr-only">Menü öffnen</span>
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                    <SheetHeader>
                      <SheetTitle>Menü</SheetTitle>
                    </SheetHeader>

                    {/* User Profile Section */}
                    <div className="mt-6 mb-6">
                      <div className="flex items-center gap-3 px-3 py-2">
                        <Avatar className="h-12 w-12">
                          <AvatarFallback className="bg-primary text-primary-foreground">
                            {user && getInitials(user.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                          <p className="text-sm font-medium leading-none">
                            {user?.name} {isAdmin && <Badge>Admin</Badge>}
                          </p>
                          <p className="text-xs leading-none text-muted-foreground mt-1">
                            {user?.email}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Navigation Links */}
                    <div className="flex flex-col space-y-1 mb-4">
                      <p className="px-3 text-xs font-semibold text-muted-foreground mb-2">
                        Navigation
                      </p>
                      <div onClick={() => setMobileMenuOpen(false)}>
                        {navLinks}
                      </div>
                    </div>

                    <div className="border-t border-border my-4" />

                    {/* User Options */}
                    <div className="flex flex-col space-y-1 mb-4">
                      <p className="px-3 text-xs font-semibold text-muted-foreground mb-2">
                        Konto
                      </p>
                      <div onClick={() => setMobileMenuOpen(false)}>
                        {mobileUserLinks}
                      </div>
                    </div>

                    {/* Theme Selection */}
                    <div className="flex flex-col space-y-1 mb-4">
                      <p className="px-3 text-xs font-semibold text-muted-foreground mb-2">
                        Design
                      </p>
                      <button
                        onClick={() => setMode('system')}
                        className={`flex items-center px-3 py-2 text-sm font-medium rounded-md hover:bg-accent transition-colors ${
                          mode === 'system'
                            ? 'text-foreground bg-accent'
                            : 'text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        <Monitor className="mr-2 h-4 w-4" />
                        System
                      </button>
                      <button
                        onClick={() => setMode('light')}
                        className={`flex items-center px-3 py-2 text-sm font-medium rounded-md hover:bg-accent transition-colors ${
                          mode === 'light'
                            ? 'text-foreground bg-accent'
                            : 'text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        <Sun className="mr-2 h-4 w-4" />
                        Hell
                      </button>
                      <button
                        onClick={() => setMode('dark')}
                        className={`flex items-center px-3 py-2 text-sm font-medium rounded-md hover:bg-accent transition-colors ${
                          mode === 'dark'
                            ? 'text-foreground bg-accent'
                            : 'text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        <Moon className="mr-2 h-4 w-4" />
                        Dunkel
                      </button>
                    </div>

                    <div className="border-t border-border my-4" />

                    {/* Logout */}
                    <button
                      onClick={() => {
                        logout()
                        setMobileMenuOpen(false)
                      }}
                      className="flex items-center w-full px-3 py-2 text-sm font-medium text-red-600 dark:text-red-400 rounded-md hover:bg-accent transition-colors"
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      Abmelden
                    </button>
                  </SheetContent>
                </Sheet>
              </div>
            </div>
          </header>
        </div>
      </div>
    </>
  )
}
