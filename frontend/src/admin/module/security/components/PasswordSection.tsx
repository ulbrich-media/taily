import { useState } from 'react'
import { KeyRound } from 'lucide-react'
import { Button } from '@/shadcn/components/ui/button'
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  CardTitleIcon,
} from '@/shadcn/components/ui/card'
import { ChangePasswordDialog } from '@/admin/module/security/components/ChangePasswordDialog'

/**
 * Security page section for the account password. Shows a short summary and
 * launches the password change dialog.
 */
export function PasswordSection() {
  const [changeOpen, setChangeOpen] = useState(false)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">Passwort</CardTitle>
        <CardTitleIcon icon={KeyRound} />
        <CardDescription>
          Wähle ein starkes Passwort und ändere es regelmäßig, um dein Konto zu
          schützen.
        </CardDescription>
      </CardHeader>

      <CardFooter className="flex flex-wrap justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => setChangeOpen(true)}
        >
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
