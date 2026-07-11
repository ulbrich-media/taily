import { useState } from 'react'
import { KeyRound } from 'lucide-react'
import { Button } from '@/shadcn/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/shadcn/components/ui/card'
import { ChangePasswordDialog } from '@/admin/module/security/components/ChangePasswordDialog'

/**
 * Security page section for the account password. Shows a short summary and
 * launches the password change dialog.
 */
export function PasswordSection() {
  const [changeOpen, setChangeOpen] = useState(false)

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <KeyRound className="size-5 text-primary" />
          Passwort
        </CardTitle>
        <CardDescription>
          Das Passwort, mit dem du dich anmeldest.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <p className="text-sm text-muted-foreground">
          Wähle ein starkes Passwort und ändere es regelmäßig, um dein Konto zu
          schützen.
        </p>
      </CardContent>

      <CardFooter>
        <Button type="button" onClick={() => setChangeOpen(true)}>
          Passwort ändern
        </Button>
      </CardFooter>

      <ChangePasswordDialog
        open={changeOpen}
        onClose={() => setChangeOpen(false)}
      />
    </Card>
  )
}
