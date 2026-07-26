import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useAuth } from '@/lib/auth.hook'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  CardTitleIcon,
} from '@/shadcn/components/ui/card'
import { Avatar, AvatarFallback } from '@/shadcn/components/ui/avatar'
import { Badge } from '@/shadcn/components/ui/badge'
import { Button } from '@/shadcn/components/ui/button'
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/shadcn/components/ui/alert'
import { Mail, Clock } from 'lucide-react'
import { usePasswordConfirmation } from '@/admin/module/security/usePasswordConfirmation'
import { cancelEmailChange } from '@/admin/module/profile/api/requests'
import { getInitials } from '@/lib/utils.ts'

interface ProfilePageProps {
  /** Called once a fresh password confirmation is in place. */
  onChangeEmail: () => void
}

export function ProfilePage({ onChangeEmail }: ProfilePageProps) {
  const { user, refreshProfile } = useAuth()
  const { ensureConfirmed, dialog: passwordDialog } = usePasswordConfirmation()

  const cancelMutation = useMutation({
    mutationFn: cancelEmailChange,
    onSuccess: async (response) => {
      toast.success(response.message)
      await refreshProfile()
    },
    onError: () => {
      toast.error('Die ausstehende Änderung konnte nicht verworfen werden.')
    },
  })

  const openChangeEmail = async () => {
    if (await ensureConfirmed()) {
      onChangeEmail()
    }
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <Card className="w-full max-w-md">
        <CardHeader className="flex flex-col items-center text-center">
          <Avatar className="h-24 w-24">
            <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
              {user && getInitials(user.name)}
            </AvatarFallback>
          </Avatar>
          <CardTitle className="mt-4 flex items-center gap-2">
            {user?.name}
            {user?.role === 'admin' && <Badge>Admin</Badge>}
          </CardTitle>
        </CardHeader>
      </Card>

      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>E-Mail-Adresse</CardTitle>
          <CardTitleIcon icon={Mail} />
          <CardDescription>
            Deine E-Mail für Benachrichtigungen und den Login.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>{user?.email}</div>

          {user?.pending_email && (
            <Alert>
              <Clock />
              <AlertTitle>
                Bestätigung an {user.pending_email.new_email} gesendet
              </AlertTitle>
              <AlertDescription>
                <p>
                  Klicke auf den Link in der E-Mail, um die Änderung
                  abzuschließen.
                </p>
                <Button
                  type="button"
                  variant="destructive_outline"
                  size="sm"
                  className="mt-2"
                  onClick={() => cancelMutation.mutate()}
                  disabled={cancelMutation.isPending}
                >
                  Änderung verwerfen
                </Button>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
        <CardFooter className="flex gap-2 justify-end flex-wrap">
          <Button type="button" variant="outline" onClick={openChangeEmail}>
            E-Mail-Adresse ändern
          </Button>
        </CardFooter>
      </Card>

      {passwordDialog}
    </div>
  )
}
