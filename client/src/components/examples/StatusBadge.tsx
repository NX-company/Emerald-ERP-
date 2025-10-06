import { StatusBadge } from '../StatusBadge'

export default function StatusBadgeExample() {
  return (
    <div className="flex flex-wrap gap-2">
      <StatusBadge status="pending" />
      <StatusBadge status="in_progress" />
      <StatusBadge status="completed" />
      <StatusBadge status="overdue" />
      <StatusBadge status="cancelled" />
    </div>
  )
}
