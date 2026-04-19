import { createFileRoute } from '@tanstack/react-router'
import { AdoptionHistoryPage } from '@/admin/module/adoptions/pages/AdoptionHistoryPage'

export const Route = createFileRoute(
  '/admin/_authenticated/adoptions/$adoptionId/history'
)({
  component: AdoptionHistoryPage,
})
