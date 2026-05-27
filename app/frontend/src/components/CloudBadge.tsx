import type { CloudName } from '../hooks/useSubjects'

type CloudBadgeProps = {
  cloud: CloudName
}

export function CloudBadge({ cloud }: CloudBadgeProps) {
  const normalized = String(cloud || 'unknown').toLowerCase()
  const label =
    normalized === 'aws'
      ? 'Servido por AWS'
      : normalized === 'azure'
        ? 'Servido por Azure'
        : 'Cloud desconhecida'

  return (
    <span className="inline-flex min-h-9 items-center gap-2 rounded-md border border-zinc-300 bg-white px-3 text-sm font-medium text-zinc-900 shadow-sm">
      <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" aria-hidden="true" />
      {label}
    </span>
  )
}
