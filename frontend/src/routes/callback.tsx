import { createFileRoute, Navigate } from '@tanstack/react-router'
import { z } from 'zod'

const CallbackAction = {
  UserInviteAccepted: 'user_invite_accepted',
  Inspect: 'inspect',
  PasswordReset: 'password_reset',
  EmailChange: 'email_change',
} as const

type CallbackAction = (typeof CallbackAction)[keyof typeof CallbackAction]

const callbackSearchSchema = z.object({
  action: z.enum(CallbackAction),
  token: z.string().optional(),
  email: z.string().optional(),
})

export const Route = createFileRoute('/callback')({
  validateSearch: callbackSearchSchema,
  component: CallbackPage,
})

function CallbackPage() {
  const { action, token, email } = Route.useSearch()

  // Handle different actions
  switch (action) {
    case CallbackAction.UserInviteAccepted:
      if (!token) {
        return (
          <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
              <h1 className="text-2xl font-bold mb-2">Ungültige Anfrage</h1>
              <p className="text-muted-foreground">
                Das Token wurde nicht angegeben.
              </p>
            </div>
          </div>
        )
      }
      return <Navigate to="/admin/invitation/$token" params={{ token }} />

    case CallbackAction.Inspect:
      if (!token) {
        return (
          <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
              <h1 className="text-2xl font-bold mb-2">Ungültige Anfrage</h1>
              <p className="text-muted-foreground">
                Das Token wurde nicht angegeben.
              </p>
            </div>
          </div>
        )
      }
      return <Navigate to="/inspect/$token" params={{ token }} replace />

    case CallbackAction.PasswordReset:
      return (
        <Navigate
          to="/admin/reset-password"
          search={{ token, email }}
          replace
        />
      )

    case CallbackAction.EmailChange:
      return (
        <Navigate to="/admin/email-change-confirm" search={{ token }} replace />
      )

    default:
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-2">Unbekannte Aktion</h1>
            <p className="text-muted-foreground">
              Die angegebene Aktion ist nicht bekannt.
            </p>
          </div>
        </div>
      )
  }
}
