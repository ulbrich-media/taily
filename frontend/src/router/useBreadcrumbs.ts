import { useMatches } from '@tanstack/react-router'

export interface BreadcrumbItem {
  label: string
  pathname: string
  isRoot: boolean
}

export function useBreadcrumbs(): BreadcrumbItem[] {
  const matches = useMatches()
  return matches
    .map((match) => {
      const label =
        match.staticData?.breadcrumb ??
        (match.loaderData as { breadcrumb?: string } | undefined)?.breadcrumb
      if (!label) return null
      return {
        label,
        pathname: match.pathname,
        isRoot: match.staticData?.breadcrumbRoot ?? false,
      }
    })
    .filter((item): item is BreadcrumbItem => item !== null)
}
