import { createFileRoute } from '@tanstack/react-router'
import { useSuspenseQuery } from '@tanstack/react-query'
import { SecurityPage } from '@/admin/module/security/pages/SecurityPage'
import { useBreadcrumbs } from '@/router/useBreadcrumbs'
import { BreadcrumbNav } from '@/router/BreadcrumbNav'
import { queryClient } from '@/lib/queryClient.ts'
import {
  listPasskeysQuery,
  listSessionsQuery,
} from '@/admin/module/security/api/queries'

export const Route = createFileRoute(
  '/admin/_authenticated/personal-settings/security'
)({
  staticData: { breadcrumb: 'Sicherheit' },
  loader: async () => {
    await Promise.all([
      queryClient.ensureQueryData(listPasskeysQuery),
      queryClient.ensureQueryData(listSessionsQuery),
    ])
  },
  component: RouteComponent,
})

function RouteComponent() {
  const breadcrumbs = useBreadcrumbs()
  const { data: passkeys } = useSuspenseQuery(listPasskeysQuery)
  const { data: sessions } = useSuspenseQuery(listSessionsQuery)

  return (
    <SecurityPage
      breadcrumb={<BreadcrumbNav items={breadcrumbs} />}
      passkeys={passkeys}
      sessions={sessions}
    />
  )
}
