import { useMatches } from '@tanstack/react-router'

export interface BreadcrumbItem {
  label: string
  pathname: string
}

export function useBreadcrumbs(): BreadcrumbItem[] {
  const matches = useMatches()
  return matches
    .map((match) => {
      const label =
        match.staticData?.breadcrumb ??
        (match.loaderData as { breadcrumb?: string } | undefined)?.breadcrumb
      if (!label) return null
      return { label, pathname: match.pathname }
    })
    .filter((item): item is BreadcrumbItem => item !== null)
}
