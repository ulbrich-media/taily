export const formatApiDateTime = (dateString: string | null, fallback = '') => {
  if (!dateString) return fallback
  return new Date(dateString).toLocaleString('de-DE', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export const formatApiDate = (dateString: string | null) => {
  if (!dateString) return ''
  return new Date(dateString).toLocaleString('de-DE', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
}
