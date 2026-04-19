import type { ReactNode } from 'react'
import { PawPrint } from 'lucide-react'
import { cn } from '@/shadcn/lib/utils.ts'
import type { AnimalListResource } from '@/api/types/animals'
import type { AnimalTypeResource } from '@/api/types/animal-types'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shadcn/components/ui/table'
import {
  ToggleGroup,
  ToggleGroupItem,
} from '@/shadcn/components/ui/toggle-group.tsx'
import { Field, FieldLabel } from '@/shadcn/components/ui/field.tsx'
import { TableListView } from '@/components/list/TableListView'
import { PageHeader } from '@/components/layout/PageHeader'

interface AnimalListPageProps {
  animals: AnimalListResource[]
  animalTypes: AnimalTypeResource[]
  animalTypeId?: string
  onAnimalTypeChange: (animalTypeId: string | undefined) => void
  createAction: ReactNode
  renderRowActions: (animal: AnimalListResource) => ReactNode
}

export function AnimalListPage({
  animals,
  animalTypes,
  animalTypeId,
  onAnimalTypeChange,
  createAction,
  renderRowActions,
}: AnimalListPageProps) {
  const handleAnimalTypeChange = (value: string) => {
    onAnimalTypeChange(value === 'all' ? undefined : value)
  }

  return (
    <div className="space-y-6">
      <PageHeader
        icon={PawPrint}
        title="Tiere"
        description="Verwalte alle Tiere im System"
        actions={createAction}
      />

      {/* Filter Controls */}
      <div className="flex items-center gap-4">
        <Field>
          <FieldLabel>Tierarten</FieldLabel>
          <ToggleGroup
            type="single"
            variant="outline"
            value={animalTypeId ?? 'all'}
            onValueChange={handleAnimalTypeChange}
          >
            <ToggleGroupItem value="all">Alle</ToggleGroupItem>
            {animalTypes.map((type) => (
              <ToggleGroupItem key={type.id} value={type.id}>
                {type.title}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </Field>
      </div>

      {/* Animal List Table */}
      <TableListView
        data={animals}
        emptyState={{
          title: 'Keine Ergebnisse gefunden',
          description: 'Füge jetzt ein Tier hinzu!',
        }}
      >
        {(animals) => (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12"></TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Tierart</TableHead>
                <TableHead>Rasse</TableHead>
                <TableHead>Geschlecht</TableHead>
                <TableHead>Farbe</TableHead>
                <TableHead className="th-contain"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {animals.map((animal) => {
                const animalType = animalTypes.find(
                  (type) => type.id === animal.animal_type_id
                )
                return (
                  <TableRow key={animal.id}>
                    <TableCell className="w-12">
                      <div
                        className={cn(
                          'size-10 rounded-md bg-muted flex items-center justify-center overflow-hidden shrink-0',
                          animal.profile_picture_url && 'bg-transparent'
                        )}
                      >
                        {animal.profile_picture_url ? (
                          <img
                            src={animal.profile_picture_url}
                            alt={animal.name}
                            className="size-full object-cover"
                          />
                        ) : (
                          <PawPrint className="size-5 text-muted-foreground" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{animal.name}</TableCell>
                    <TableCell>{animalType?.title || '-'}</TableCell>
                    <TableCell>{animal.breed || '-'}</TableCell>
                    <TableCell>
                      {animal.gender === 'male' ? 'Männlich' : 'Weiblich'}
                    </TableCell>
                    <TableCell>{animal.color || '-'}</TableCell>
                    <TableCell className="text-right">
                      {renderRowActions(animal)}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        )}
      </TableListView>
    </div>
  )
}
