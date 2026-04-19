import { Badge, type BadgeProps } from '@/shadcn/components/ui/badge.tsx'

export type BadgeOption = Pick<BadgeProps, 'variant'> & {
  label: string
}

type RecordValue = string | number | symbol

export type BadgeSet<value extends RecordValue> = Record<value, BadgeOption>

interface BadgeBySetProps<value extends RecordValue> {
  set: BadgeSet<value>
  value: value
}

function BadgeBySet<value extends RecordValue>({
  set,
  value,
}: BadgeBySetProps<value>) {
  const { variant, label } = set[value]

  return <Badge variant={variant}>{label}</Badge>
}

export { BadgeBySet }
