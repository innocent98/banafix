/**
 * Skeleton for /dashboard. Mirrors page.tsx: the header block, the amber
 * notice strip, and the two-column grouped list.
 */
export default function Loading() {
  return (
    <div aria-busy aria-label="Loading the student area">
      <section className="bfx-shell pt-16 pb-10">
        <div className="max-w-[660px]">
          <div className="mb-3 h-3 w-24 rounded bg-bfx-border" />
          <div className="mb-3 h-[62px] w-[85%] rounded-lg bg-bfx-border" />
          <div className="mb-4 h-[62px] w-[60%] rounded-lg bg-bfx-border" />
          <div className="h-[29px] w-full rounded bg-bfx-hair" />
        </div>
      </section>

      <section className="bfx-shell pb-16">
        <div className="h-[84px] rounded-[18px] border border-bfx-note-border bg-bfx-note-bg" />
      </section>

      <section className="bfx-shell pb-[92px]">
        <div className="mb-3 h-3 w-28 rounded bg-bfx-border" />
        <div className="mb-9 h-[42px] w-[420px] max-w-full rounded-lg bg-bfx-border" />
        <div className="grid gap-px overflow-hidden rounded-[22px] border border-bfx-border-4 bg-bfx-border-4 md:grid-cols-2">
          {[0, 1, 2, 3].map((cell) => (
            <div key={cell} className="h-[212px] bg-bfx-surface" />
          ))}
        </div>
      </section>
    </div>
  )
}
