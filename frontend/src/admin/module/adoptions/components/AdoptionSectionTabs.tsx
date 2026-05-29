import { Route as AdoptionsListRoute } from '@/routes/admin/_authenticated/adoptions/_list/route'
import { Route as TransportsRoute } from '@/routes/admin/_authenticated/adoptions/transports/route'

const tabLinkClass =
  'px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground rounded-md hover:bg-accent transition-colors [&.active]:bg-accent [&.active]:text-foreground'

export function AdoptionSectionTabs() {
  return (
    <nav className="flex gap-1 border-b pb-1 mb-2">
      <AdoptionsListRoute.Link
        className={tabLinkClass}
        activeOptions={{ exact: false }}
      >
        Vermittlungen
      </AdoptionsListRoute.Link>
      <TransportsRoute.Link
        className={tabLinkClass}
        activeOptions={{ exact: false }}
      >
        Transporte
      </TransportsRoute.Link>
    </nav>
  )
}
