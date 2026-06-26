import { createFileRoute, redirect } from '@tanstack/react-router'
import { queryClient } from '@/lib/queryClient'
import { formTemplateQuery } from '@/admin/module/form-templates/api/queries'

export const Route = createFileRoute(
  '/admin/_authenticated/settings/form-templates/$formTemplateId/'
)({
  loader: async ({ params }) => {
    const response = await queryClient.ensureQueryData(
      formTemplateQuery(params.formTemplateId)
    )
    throw redirect({
      to: '/admin/settings/form-templates/$formTemplateId/versions/$versionId',
      params: {
        formTemplateId: params.formTemplateId,
        versionId: response.data.version_id,
      },
      replace: true,
    })
  },
  component: () => null,
})
