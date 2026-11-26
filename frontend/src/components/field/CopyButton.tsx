import { Copy } from 'lucide-react'
import { toast } from 'sonner'
import { InputGroupButton } from '@/shadcn/components/ui/input-group.tsx'

interface CopyButtonProps {
  value: string | null | undefined
  label: string
  successMessage: string
}

/** Copy-to-clipboard button for use inside an InputGroupAddon. Copies the given (current) value. */
export function CopyButton({ value, label, successMessage }: CopyButtonProps) {
  const copy = () => {
    if (!value) return
    navigator.clipboard
      .writeText(value)
      .then(() => toast.success(successMessage))
      .catch(() => toast.error('Der Link konnte nicht kopiert werden.'))
  }

  return (
    <InputGroupButton
      size="icon-xs"
      aria-label={label}
      disabled={!value}
      onClick={copy}
    >
      <Copy />
    </InputGroupButton>
  )
}
