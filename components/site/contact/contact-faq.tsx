"use client"

/**
 * "COMMON QUESTIONS" accordion — handoff lines 603–618. Single-open, with the
 * bronze `+` / `−` sign, and the first item open on load exactly as the
 * handoff's `faq: 0` initial state.
 *
 * The handoff hangs the click on the card <div>; here the header row is a real
 * <button> so the accordion is reachable by keyboard and announces its state.
 */
import { useId, useState } from "react"

import { Eyebrow } from "@/components/site/primitives"

/**
 * Static marketing copy — there is no FAQ table in the DB. Wording is the
 * handoff's, verbatim. The ₦ figures here (₦8,000 rental, ₦5,000 registration)
 * are the handoff's own copy and are NOT derived from `lib/application-fee.ts`;
 * if the real registration fee changes, this copy must change with it.
 */
const FAQS = [
  {
    q: "Is the trial lesson really free?",
    a: "Yes. Thirty minutes with a tutor on your chosen instrument, no card details required.",
  },
  {
    q: "How young can students be?",
    a: "We take students from age five on piano, violin and vocals, and from age seven on guitar, drums and saxophone.",
  },
  {
    q: "What if I miss a lesson?",
    a: "Tell us 24 hours ahead and we reschedule at no cost. Every student also gets one free makeup lesson each term.",
  },
  {
    q: "Do I need my own instrument?",
    a: "Not to begin with. Studio instruments are free during lessons, and rentals are ₦8,000 a term for home practice.",
  },
  {
    q: "How do payments work?",
    a: "₦5,000 registration holds your spot. The course fee is billed the week before classes begin, and can be split across two payments.",
  },
] as const

export function ContactFaq() {
  const uid = useId()
  const [open, setOpen] = useState<number>(0)

  return (
    <div>
      <Eyebrow className="mb-4">COMMON QUESTIONS</Eyebrow>
      <div className="flex flex-col gap-2.5">
        {FAQS.map((faq, i) => {
          const isOpen = open === i
          return (
            <div key={faq.q} className="rounded-2xl border border-bfx-border bg-bfx-surface">
              <button
                type="button"
                id={`${uid}-q${i}`}
                aria-expanded={isOpen}
                aria-controls={`${uid}-a${i}`}
                onClick={() => setOpen(isOpen ? -1 : i)}
                className="flex w-full items-center justify-between gap-4 rounded-2xl px-[22px] py-5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-bfx-amber"
              >
                <span className="text-[16px] font-bold tracking-[-0.01em] text-bfx-ink">
                  {faq.q}
                </span>
                <span aria-hidden className="text-[19px] leading-none text-bfx-bronze">
                  {isOpen ? "−" : "+"}
                </span>
              </button>
              <div
                id={`${uid}-a${i}`}
                role="region"
                aria-labelledby={`${uid}-q${i}`}
                hidden={!isOpen}
                className="bfx-pretty px-[22px] pb-5 text-[15px] leading-[1.65] text-bfx-body-2"
              >
                {faq.a}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
