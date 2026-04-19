import { createFileRoute, Navigate } from '@tanstack/react-router'
import { z } from 'zod'

const CallbackAction = {
  UserInviteAccepted: 'user_invite_accepted',
  Inspect: 'inspect',
} as const

type CallbackAction = (typeof CallbackAction)[keyof typeof CallbackAction]

const callbackSearchSchema = z.object({
  action: z.enum(CallbackAction),
  token: z.string().optional(),
})

export const Route = createFileRoute('/callback')({
  validateSearch: callbackSearchSchema,
  component: CallbackPage,
})

function CallbackPage() {
  const { action, token } = Route.useSearch()

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
