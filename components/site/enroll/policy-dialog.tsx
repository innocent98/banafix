"use client"

/**
 * Full policy text, kept reachable from the two consent rows on step 2.
 *
 * The copy is transcribed verbatim from the outgoing
 * `components/enrollment/policies-form.tsx` so the wording a student agrees to is
 * unchanged by the redesign. Section 3 (Attendance) is intentionally absent: it is
 * commented out in that file, so it is not currently live policy text.
 *
 * Radix Dialog gives the focus trap, Escape-to-close and scroll lock.
 */

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import Link from "next/link"

const SECTIONS = [
  {
    number: "1",
    title: "Enrollment Terms",
    intro: "By enrolling in Banafix courses, you agree to:",
    points: [
      "Attend all scheduled sessions punctually",
      "Complete assigned practice tasks and homework",
      "Respect course materials and intellectual property",
      "Provide accurate information during enrollment",
    ],
    footnote:
      "Course materials and platform access are provided for the duration of your enrollment and remain property of Banafix.",
  },
  {
    number: "2",
    title: "Payment Policy",
    intro: "Payment terms:",
    points: [
      "Full payment required before course commencement",
      "Installment plans available for courses above ₦50,000",
      "Late payment fee of ₦2,000 applies for overdue installments",
      "Payment methods: Card, Bank Transfer, USSD, PayPal",
    ],
    footnote: "All fees are in Nigerian Naira (₦) unless otherwise stated.",
  },
  {
    number: "4",
    title: "Refund Policy",
    intro: "Refund schedule:",
    points: [
      "100% refund: within 7 days of enrollment with no sessions attended",
      "75% refund: within the first 2 weeks with 2 or fewer sessions attended",
      "50% refund: within the first month with 25% or less of the course completed",
      "No refund: after 25% course completion or 1 month, whichever comes first",
    ],
    footnote: "Refunds are processed within 7 to 14 business days to the original payment method.",
  },
  {
    number: "5",
    title: "Code of Conduct",
    intro: "Expected behaviour:",
    points: [
      "Maintain respectful behaviour towards instructors and fellow students",
      "Use appropriate language during sessions",
      "Respect others' learning environment",
      "Follow safety guidelines for instruments and equipment",
    ],
    footnote:
      "Disruptive behaviour may result in warnings, suspension, or course termination without refund.",
  },
  {
    number: "6",
    title: "Privacy Policy",
    intro: "Data collection:",
    points: [
      "Personal information used for course administration only",
      "Payment data processed securely through certified providers",
      "Session recordings may be used for quality improvement",
      "Marketing communications only with explicit consent",
    ],
    footnote: "The full privacy policy is available on our policies page.",
  },
] as const

export function PolicyDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (next: boolean) => void
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-2xl gap-0 overflow-hidden rounded-[24px] border-bfx-border-6 bg-bfx-surface p-0">
        <DialogHeader className="border-b border-bfx-hair px-6 py-5 text-left sm:px-8">
          <DialogTitle className="font-display text-[26px] font-normal tracking-[-0.02em] text-bfx-ink">
            Lesson and refund policy
          </DialogTitle>
          <DialogDescription className="text-[14.5px] text-bfx-muted">
            The terms you are agreeing to before payment.
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[60vh] overflow-y-auto px-6 py-6 sm:px-8">
          <div className="flex flex-col gap-7">
            {SECTIONS.map((section) => (
              <section key={section.number}>
                <div className="mb-3 flex items-center gap-3">
                  <span
                    aria-hidden
                    className="grid h-7 w-7 flex-none place-items-center rounded-full bg-bfx-ink text-[12px] font-bold text-bfx-amber"
                  >
                    {section.number}
                  </span>
                  <h3 className="text-[16px] font-bold text-bfx-ink">{section.title}</h3>
                </div>
                <p className="mb-2 text-[14.5px] font-semibold text-bfx-label">{section.intro}</p>
                <ul className="mb-2 flex flex-col gap-1.5">
                  {section.points.map((point) => (
                    <li
                      key={point}
                      className="flex gap-2.5 text-[14.5px] leading-[1.6] text-bfx-body"
                    >
                      <span aria-hidden className="text-bfx-amber">
                        ·
                      </span>
                      {point}
                    </li>
                  ))}
                </ul>
                <p className="text-[13.5px] leading-[1.6] text-bfx-muted">{section.footnote}</p>
              </section>
            ))}
          </div>
        </div>

        <div className="border-t border-bfx-hair px-6 py-4 text-[13.5px] text-bfx-muted sm:px-8">
          The complete set of policies lives on the{" "}
          <Link
            href="/policies"
            className="font-semibold text-bfx-bronze underline underline-offset-2 hover:text-bfx-ink"
          >
            policies page
          </Link>
          .
        </div>
      </DialogContent>
    </Dialog>
  )
}
