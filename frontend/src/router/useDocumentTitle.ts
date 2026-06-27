import { useEffect } from 'react'
import { useBreadcrumbs } from './useBreadcrumbs'

const APP_NAME = 'Taily'

export function useDocumentTitle(): void {
  const breadcrumbs = useBreadcrumbs()

  const leafLabel =
    breadcrumbs.filter((item) => !item.isRoot).at(-1)?.label ?? ''

  useEffect(() => {
    document.title = leafLabel ? `${APP_NAME}: ${leafLabel}` : APP_NAME
  }, [leafLabel])
}
