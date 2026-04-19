import { createFileRoute } from '@tanstack/react-router'
import { PersonEditHistoryPage } from '@/admin/module/people/pages/PersonEditHistoryPage.tsx'

export const Route = createFileRoute(
  '/admin/_authenticated/people/$id/history'
)({
  component: PersonEditHistoryPage,
})
