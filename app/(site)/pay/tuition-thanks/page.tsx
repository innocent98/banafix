/**
 * /pay/tuition-thanks - the page Paystack returns to after an online tuition payment (T14).
 *
 * Deliberately static: it reads no database, takes no action and renders no query parameters.
 * Money is only ever settled by the Paystack webhook, never by someone landing here.
 */

import type { Metadata } from "next"

import { Display, PillLink } from "@/components/site/primitives"

export const metadata: Metadata = {
  title: "Thank you | Banafix",
  robots: { index: false, follow: false },
}

export default function TuitionThanksPage() {
  return (
    <section className="mx-auto w-full max-w-[720px] px-[clamp(20px,4vw,40px)] pb-[100px] pt-14">
      <div className="rounded-[24px] border border-bfx-border-6 bg-bfx-surface p-8 text-center sm:p-[42px]">
        <span
          aria-hidden
          className="mx-auto mb-5 grid h-16 w-16 place-items-center rounded-full bg-bfx-ok-bg text-[28px] leading-none text-bfx-ok-text"
        >
          ✓
        </span>
        <Display as="h1" className="mb-3 text-[clamp(28px,4vw,38px)] leading-[1.08] text-bfx-ink">
          Thank you
        </Display>
        <p className="text-[15.5px] leading-[1.65] text-bfx-body">
          Thank you. Your payment is being confirmed. A receipt will be emailed to you shortly.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <PillLink href="/" variant="ink" size="md">
            Back to home
          </PillLink>
          <PillLink href="/contact" variant="outlineSoft" size="md">
            Contact us
          </PillLink>
        </div>
      </div>
    </section>
  )
}
