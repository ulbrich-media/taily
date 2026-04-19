import { createFileRoute, Outlet, notFound } from '@tanstack/react-router'
import { queryClient } from '@/lib/queryClient'
import { formTemplateQuery } from '@/admin/module/form-templates/api/queries'

export const Route = createFileRoute(
  '/admin/_authenticated/settings/form-templates/$formTemplateId'
)({
  loader: async ({ params }) => {
    const response = await queryClient.ensureQueryData(
      formTemplateQuery(params.formTemplateId)
    )

    if (!response) {
      throw notFound()
    }
  },
  component: () => <Outlet />,
})
