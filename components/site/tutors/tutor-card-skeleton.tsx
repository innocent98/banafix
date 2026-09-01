/**
 * Loading state for the tutor grid. The shapes mirror `TutorCard` exactly —
 * same 260px well, same 22px radius, same body rhythm — so nothing shifts
 * when the real cards arrive.
 */
function Line({ className }: { className: string }) {
  return <div className={`animate-pulse rounded-md bg-bfx-tint ${className}`} />
}

export function TutorCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-[22px] border border-bfx-border bg-bfx-surface">
      <div className="h-[260px] animate-pulse bg-bfx-tint" />
      <div className="px-6 pt-[22px] pb-[26px]">
        {/* name (19px), specialty (13.5px), two bio lines, two chips */}
        <Line className="mb-2.5 h-[19px] w-2/3" />
        <Line className="mb-[14px] h-[13.5px] w-1/2" />
        <Line className="mb-2 h-[14.5px] w-full" />
        <Line className="mb-[18px] h-[14.5px] w-4/5" />
        <div className="flex gap-2">
          <Line className="h-[26px] w-20 rounded-lg" />
          <Line className="h-[26px] w-16 rounded-lg" />
        </div>
      </div>
    </div>
  )
}

export function TutorGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(250px,1fr))] gap-6">
      {Array.from({ length: count }, (_, i) => (
        <TutorCardSkeleton key={i} />
      ))}
    </div>
  )
}
