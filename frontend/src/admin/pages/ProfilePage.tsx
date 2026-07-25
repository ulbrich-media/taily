import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useAuth } from '@/lib/auth.hook'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
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

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>E-Mail-Adresse</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Mail className="h-4 w-4" />
            {user?.email}
          </div>

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
                  variant="outline"
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

          <Button type="button" variant="outline" onClick={openChangeEmail}>
            E-Mail-Adresse ändern
          </Button>
        </CardContent>
      </Card>

      <Card className="w-full max-w-sm">
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

      {passwordDialog}
    </div>
  )
}
