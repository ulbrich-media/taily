import { Badge } from '@/shadcn/components/ui/badge.tsx'
import type { AnimalDetailResource } from '@/api/types/animals'
import {
  hasExportChip,
  summarizeTiervermittlung,
} from '@/admin/module/animals/tiervermittlung-status.ts'

type ExportChipAnimal = Pick<AnimalDetailResource, 'do_publish'> & {
  tiervermittlung?: AnimalDetailResource['tiervermittlung']
}

export function AnimalExportChip({ animal }: { animal: ExportChipAnimal }) {
  const { tiervermittlung } = animal

  if (!tiervermittlung || !hasExportChip(animal)) return null

  if (tiervermittlung.blocked) {
    return <Badge variant="warning">Nicht exportiert</Badge>
  }

  const summary = summarizeTiervermittlung(tiervermittlung)

  return <Badge variant={summary.variant}>{summary.label}</Badge>
}
