import { createFileRoute } from '@tanstack/react-router'
import { ProfilePage } from '@/admin/pages/ProfilePage'

export const Route = createFileRoute('/admin/_authenticated/profile/')({
  component: ProfilePage,
})
