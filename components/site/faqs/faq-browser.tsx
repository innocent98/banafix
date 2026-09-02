"use client"

import { useMemo, useState } from "react"
import { Search, X } from "lucide-react"

import { cn } from "@/lib/utils"
import { faqCategories, type Faq, type FaqCategory } from "@/components/site/faqs/faqs"

/**
 * Search + category filter + accordion for /faqs.
 *
 * The accordion is the handoff's "COMMON QUESTIONS" block from the contact
 * screen: white card on cream, #EAE1D3 hairline, 16px radius, the question at
 * 16px/700 and a bronze +/− sign on the right. The chip row is its `chip()`
 * helper (ink when active, white with an #E4DACB inset ring when not).
 *
 * Multiple rows can be open at once, which is what the previous page did.
 */

/** Handoff `chip(active)`. `min-h-11` is the 44px touch target, not the handoff. */
function chipClass(active: boolean) {
  return cn(
    "min-h-11 rounded-full border-0 px-[18px] py-[11px] text-[14px] font-bold transition-shadow",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bfx-amber focus-visible:ring-offset-2 focus-visible:ring-offset-bfx-cream",
    active
      ? "bg-bfx-ink text-white shadow-[inset_0_0_0_1px_var(--bfx-ink)]"
      : "bg-bfx-surface text-bfx-body shadow-[inset_0_0_0_1px_var(--bfx-border-2)] hover:shadow-[inset_0_0_0_1px_var(--bfx-ink)]",
  )
}

function matchesSearch(faq: Faq, query: string) {
  const q = query.trim().toLowerCase()
  if (q === "") return true
  return (
    faq.question.toLowerCase().includes(q) ||
    faq.answer.toLowerCase().includes(q) ||
    faq.tags.some((tag) => tag.toLowerCase().includes(q))
  )
}

export function FaqBrowser({ faqs }: { faqs: Faq[] }) {
  const [query, setQuery] = useState("")
  const [category, setCategory] = useState<FaqCategory["id"]>("all")
  const [openIds, setOpenIds] = useState<number[]>([])

  const categories = useMemo(() => faqCategories(faqs), [faqs])

  const visible = useMemo(
    () =>
      faqs.filter(
        (faq) => (category === "all" || faq.category === category) && matchesSearch(faq, query),
      ),
    [faqs, category, query],
  )

  const toggle = (id: number) =>
    setOpenIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))

  const clearFilters = () => {
    setQuery("")
    setCategory("all")
  }

  const isFiltered = query.trim() !== "" || category !== "all"

  return (
    <div>
      {/* Search */}
      <div className="relative mb-5 max-w-[560px]">
        <Search
          aria-hidden
          className="pointer-events-none absolute top-1/2 left-[17px] h-[18px] w-[18px] -translate-y-1/2 text-bfx-muted-2"
        />
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search the answers…"
          aria-label="Search frequently asked questions"
          className="h-[52px] w-full rounded-[14px] border-[1.5px] border-bfx-border-2 bg-bfx-field pr-4 pl-12 text-[15px] text-bfx-ink outline-none placeholder:text-bfx-muted-2 focus:border-bfx-amber focus:bg-white"
        />
      </div>

      {/* Category chips — counts derived from the FAQ array */}
      <div className="mb-7 flex flex-wrap items-center gap-[10px]">
        {categories.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setCategory(item.id)}
            aria-pressed={category === item.id}
            className={chipClass(category === item.id)}
          >
            {item.name}
            <span
              className={cn(
                "ml-2 text-[13px] font-semibold",
                category === item.id ? "text-white/60" : "text-bfx-muted-2",
              )}
            >
              {item.count}
            </span>
          </button>
        ))}
        <span className="ml-auto text-[13.5px] font-semibold text-bfx-muted">
          {visible.length} {visible.length === 1 ? "answer" : "answers"}
        </span>
      </div>

      {/* Accordion */}
      {visible.length > 0 ? (
        <div className="flex flex-col gap-[10px]">
          {visible.map((faq) => {
            const isOpen = openIds.includes(faq.id)
            return (
              <div
                key={faq.id}
                className="rounded-2xl border border-bfx-border bg-bfx-surface transition-shadow hover:shadow-[0_18px_36px_-26px_rgba(16,26,40,0.3)]"
              >
                <button
                  type="button"
                  onClick={() => toggle(faq.id)}
                  aria-expanded={isOpen}
                  aria-controls={`faq-panel-${faq.id}`}
                  className="flex w-full items-center justify-between gap-4 rounded-2xl px-[22px] py-5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bfx-amber focus-visible:ring-inset"
                >
                  <span className="text-[16px] font-bold tracking-[-0.01em] text-bfx-ink">
                    {faq.question}
                  </span>
                  <span aria-hidden className="text-[19px] leading-none text-bfx-bronze">
                    {isOpen ? "−" : "+"}
                  </span>
                </button>
                {isOpen ? (
                  <div id={`faq-panel-${faq.id}`} className="px-[22px] pb-5">
                    <p className="text-[15px] leading-[1.65] text-bfx-body-2">{faq.answer}</p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {faq.tags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-lg bg-bfx-tint px-[10px] py-[5px] text-[12px] font-semibold text-bfx-body"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            )
          })}
        </div>
      ) : (
        /* Filtered-empty state — only reachable through search, since every
           chip is derived from a category that has at least one FAQ. */
        <div className="rounded-[22px] border border-bfx-border bg-bfx-surface px-8 py-14 text-center">
          <p className="font-display text-[26px] leading-none tracking-[-0.02em] text-bfx-ink">
            No answer matched “{query.trim()}”
          </p>
          <p className="mx-auto mt-3 max-w-[380px] text-[15px] leading-[1.6] text-bfx-body-2">
            Try a shorter word, or ask us directly. We answer WhatsApp within the hour on weekdays.
          </p>
          {isFiltered ? (
            <button
              type="button"
              onClick={clearFilters}
              className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-full border-[1.5px] border-[#E1D8C9] px-[22px] py-[13px] text-[14.5px] font-bold text-bfx-ink transition-colors hover:border-bfx-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bfx-amber focus-visible:ring-offset-2 focus-visible:ring-offset-bfx-cream"
            >
              <X aria-hidden className="h-4 w-4" />
              Clear search
            </button>
          ) : null}
        </div>
      )}
    </div>
  )
}
