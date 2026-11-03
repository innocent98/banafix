const ITEMS = [
  { label: "Available", cls: "border-emerald-400 bg-emerald-100 dark:bg-emerald-950" },
  { label: "Scheduled", cls: "border-blue-400 bg-blue-100 dark:bg-blue-950" },
  { label: "Held", cls: "border-green-500 bg-green-100 dark:bg-green-950" },
  { label: "Missed", cls: "border-amber-500 bg-amber-100 dark:bg-amber-950" },
  { label: "Cancelled / rescheduled", cls: "border-gray-300 bg-gray-100 dark:bg-gray-800" },
]

export function ScheduleLegend() {
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground" aria-label="Legend">
      {ITEMS.map((i) => (
        <li key={i.label} className="flex items-center gap-1.5">
          <span className={`inline-block h-3 w-3 rounded-sm border ${i.cls}`} />
          <span className={i.label.startsWith("Cancelled") ? "line-through" : ""}>{i.label}</span>
        </li>
      ))}
    </ul>
  )
}
