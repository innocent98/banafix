"use client"

/**
 * Step 3, "Pay the registration fee" (handoff.html:519-535).
 *
 * The handoff renders Card / Bank transfer / USSD as selectable rows. They are
 * rendered here as an informational list instead. `lib/paystack.ts:280` asks for
 * `channels: ['card', 'bank', 'ussd', 'bank_transfer']`, but the student picks
 * one on Paystack's own page and the server overwrites `paymentMethod` with
 * 'pending' either way, so a control here would be a false affordance.
 *
 * Round-2 audit: the per-channel notes ("Confirmed within minutes", card brands)
 * were dropped. Nothing in the codebase supports a settlement time, and the card
 * brands are Paystack account configuration this app never reads.
 */

import Link from "next/link"

import { ENROL_HREF, formatNaira } from "@/lib/site"
import { InfoRow, NoteBlock, StepHeading, SubHeading, TextField } from "./fields"
import { PAYSTACK_CHANNELS, type EnrollFormData } from "./types"

export function StepPayment({
  form,
  applicationFee,
  paymentError,
  paymentRetryable,
  onChange,
  onRetry,
}: {
  form: EnrollFormData
  applicationFee: number
  paymentError: string
  /** False when the server refused on a precondition a retry cannot change. */
  paymentRetryable: boolean
  onChange: <K extends keyof EnrollFormData>(field: K, value: EnrollFormData[K]) => void
  onRetry: () => void
}) {
  return (
    <div>
      <StepHeading
        title="Pay the registration fee"
        sub={`${formatNaira(applicationFee)} today. This is the only amount charged on this page.`}
      />

      <div className="mb-6">
        <SubHeading
          title="Ways to pay"
          sub="Choose one of these on Paystack's page after you continue."
        />
        <ul className="flex flex-col gap-[11px]">
          {PAYSTACK_CHANNELS.map((channel) => (
            <InfoRow key={channel} name={channel} />
          ))}
        </ul>
      </div>

      <div className="mb-6">
        <TextField
          id="couponCode"
          label="Coupon code"
          hint="Optional"
          placeholder="Enter a code"
          value={form.couponCode}
          onChange={(event) => onChange("couponCode", event.target.value)}
        />
        <p className="mt-[6px] text-[12.5px] text-bfx-muted">
          Codes are recorded against your enrolment. They do not change today's registration fee.
        </p>
      </div>

      <NoteBlock tone="green">
        Paid through Paystack over an encrypted connection. Banafix never stores your card details.
      </NoteBlock>

      {paymentError ? (
        <div
          role="alert"
          className="mt-4 rounded-[14px] border border-red-200 bg-red-50 px-5 py-[18px]"
        >
          <p className="text-[15px] font-bold text-red-900">
            {paymentRetryable ? "We couldn't start your payment" : "We couldn't complete your enrolment"}
          </p>
          <p className="mt-1 text-[14.5px] leading-[1.6] text-red-700">{paymentError}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {paymentRetryable ? (
              <button
                type="button"
                onClick={onRetry}
                className="rounded-xl border-[1.5px] border-red-300 px-4 py-2.5 text-[14px] font-bold text-red-900 transition-colors hover:border-red-500 hover:bg-white"
              >
                Try again
              </button>
            ) : (
              <Link
                href={ENROL_HREF}
                className="rounded-xl border-[1.5px] border-red-300 px-4 py-2.5 text-[14px] font-bold text-red-900 transition-colors hover:border-red-500 hover:bg-white"
              >
                Browse courses
              </Link>
            )}
            <Link
              href="/contact"
              className="rounded-xl border-[1.5px] border-red-300 px-4 py-2.5 text-[14px] font-bold text-red-900 transition-colors hover:border-red-500 hover:bg-white"
            >
              Talk to us
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  )
}
