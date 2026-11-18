import type { TiervermittlungSpecies } from '@/api/types/animal-types'
import type { SelectOption } from '@/components/field/SelectInput'

// Mirrors: api/src/Enums/TiervermittlungSpecies.php
export const TIERVERMITTLUNG_SPECIES_LABELS: Record<
  TiervermittlungSpecies,
  string
> = {
  dog: 'Hund',
  cat: 'Katze',
  small: 'Kleintier',
  bird: 'Vogel',
  reptile: 'Reptil',
  horse: 'Pferd',
  fish: 'Fisch',
  other: 'Sonstige',
}

// The select cannot hold null, so "not exported" travels as this value.
export const NOT_EXPORTED = 'none'

export type TiervermittlungSpeciesFormValue =
  | TiervermittlungSpecies
  | typeof NOT_EXPORTED

export const TIERVERMITTLUNG_SPECIES_FORM_VALUES = [
  NOT_EXPORTED,
  ...(Object.keys(TIERVERMITTLUNG_SPECIES_LABELS) as TiervermittlungSpecies[]),
] as [TiervermittlungSpeciesFormValue, ...TiervermittlungSpeciesFormValue[]]

export const TIERVERMITTLUNG_SPECIES_OPTIONS: SelectOption[] = [
  { value: NOT_EXPORTED, label: 'Nicht exportieren' },
  ...Object.entries(TIERVERMITTLUNG_SPECIES_LABELS).map(([value, label]) => ({
    value,
    label,
  })),
]

export function toSpeciesFormValue(
  species: TiervermittlungSpecies | null | undefined
): TiervermittlungSpeciesFormValue {
  return species ?? NOT_EXPORTED
}

export function fromSpeciesFormValue(
  value: TiervermittlungSpeciesFormValue
): TiervermittlungSpecies | null {
  return value === NOT_EXPORTED ? null : value
}
