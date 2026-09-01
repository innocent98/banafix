/**
 * Skeleton for /faqs. Heights and rhythm mirror page.tsx exactly — the 52px
 * search field, the 44px chip row, six 66px accordion rows — so nothing shifts
 * when the real content lands.
 */
export default function Loading() {
  return (
    <div aria-busy aria-label="Loading frequently asked questions">
      <section className="bfx-shell pt-16 pb-9">
        <div className="max-w-[640px]">
          <div className="mb-3 h-3 w-16 rounded bg-bfx-border" />
          <div className="mb-4 h-[62px] w-[80%] rounded-lg bg-bfx-border" />
          <div className="h-[29px] w-full rounded bg-bfx-hair" />
        </div>
      </section>

      <section className="bfx-shell pb-24">
        <div className="mb-5 h-[52px] max-w-[560px] rounded-[14px] bg-bfx-border/70" />

        <div className="mb-7 flex flex-wrap gap-[10px]">
          {[96, 118, 104, 132].map((width) => (
            <div key={width} className="h-11 rounded-full bg-bfx-border/70" style={{ width }} />
          ))}
        </div>

        <div className="flex flex-col gap-[10px]">
          {[0, 1, 2, 3, 4, 5].map((row) => (
            <div
              key={row}
              className="h-[66px] rounded-2xl border border-bfx-border bg-bfx-surface"
            />
          ))}
        </div>
      </section>
    </div>
  )
}
