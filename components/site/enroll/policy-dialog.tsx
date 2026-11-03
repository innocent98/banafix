"use client"

/**
 * Full policy text, kept reachable from the two consent rows on step 2.
 *
 * Rewritten for the assessment-first flow: the amount paid at this step is a
 * non-refundable assessment fee, not enrolment, and tuition is agreed per class
 * after the assessment. Where the academy has made no business decision (tuition
 * refunds, cancelling or rescheduling lessons, a missed assessment, late arrival,
 * materials) the wording is deliberately neutral ("case by case"). Those points
 * are listed for John in docs/john-review/policy-changes.md. Do not add numbers
 * or fee amounts here until he decides.
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
    title: "Applying and Enrolment",
    intro: "By applying for an assessment, you agree to:",
    points: [
      "Provide accurate information in your application",
      "Attend your assessment at the time we agree with you, at home, at the centre or online",
      "For a home assessment, give a correct address and landmark. We confirm that we cover your area and we confirm the time with you",
      "Respect course materials and intellectual property",
    ],
    footnote:
      "Paying the assessment fee does not enrol you. Enrolment follows your assessment and a plan you agree with Banafix. Course materials and content remain the property of Banafix.",
  },
  {
    number: "2",
    title: "Payment Policy",
    intro: "Payment terms:",
    points: [
      "The assessment fee is paid when you apply. The amount depends on the location and is shown at checkout",
      "The assessment fee is charged once per student. If you have paid it before, you are not charged it again for a later application",
      "Tuition is not charged until after your assessment, once a plan is agreed. It is charged per class. The rate depends on the location, the format and the class length (45 or 60 minutes)",
      "Your plan sets the classes per week and the number of planned classes. The per-class rate is fixed when the plan is agreed",
      "You can pay online through Paystack (card, bank, USSD or bank transfer). The academy can also record payments made in cash, by bank transfer or by POS, including part payments",
    ],
    footnote:
      "All amounts are in Nigerian Naira (₦). Applicants abroad pay the Naira fee shown at checkout. When tuition payments are due is confirmed with you when your plan is agreed.",
  },
  {
    number: "3",
    title: "Refund Policy",
    intro: "Refunds:",
    points: [
      "The assessment fee is non-refundable. It covers your assessment, and paying it does not enrol you",
      "Tuition refund requests are considered case by case, taking into account how much of your plan has been delivered",
      "If you miss or cancel your assessment, contact us and we will handle it case by case",
      "If a refund is approved, we will tell you how and when it will be paid",
    ],
    footnote: "To ask about a refund, contact us through the contact page.",
  },
  {
    number: "4",
    title: "Attendance",
    intro: "Once you are enrolled, we ask that you:",
    points: [
      "Attend your lessons punctually",
      "Tell us as early as you can if you cannot make a lesson",
      "Complete assigned practice tasks and homework",
    ],
    footnote:
      "Cancelling or rescheduling a lesson, and arriving late, are handled case by case. Please contact us.",
  },
  {
    number: "5",
    title: "Code of Conduct",
    intro: "Expected behaviour:",
    points: [
      "Maintain respectful behaviour towards instructors and fellow students",
      "Use appropriate language during assessments and lessons",
      "Respect others' learning environment",
      "Follow safety guidelines for instruments and equipment",
    ],
    footnote:
      "Disruptive behaviour may result in warnings, suspension, or the end of your lessons.",
  },
  {
    number: "6",
    title: "Privacy Policy",
    intro: "Data collection:",
    points: [
      "Personal information is used to handle your application, assessment, lessons and payments",
      "Assessment details such as your preferred date, home address and landmark are used to arrange your assessment",
      "Payment data is processed securely through certified providers",
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
