"use client"

/**
 * Step 3 — "Pay the registration fee" (handoff.html:519–535).
 *
 * The handoff renders Card / Bank transfer / USSD as selectable rows. They are
 * rendered here as an informational list instead: the app does not choose a
 * Paystack channel (`lib/paystack.ts` sends none, and the server overwrites
 * `paymentMethod` with 'pending'), so a selectable control would be a fake one —
 * a student who picked USSD and landed on a card form would be right to feel lied
 * to. Same row treatment, no false affordance.
 */

import { formatNaira } from "@/lib/site"
import { InfoRow, NoteBlock, StepHeading, SubHeading, TextField } from "./fields"
import { PAYSTACK_CHANNELS, type EnrollFormData } from "./types"

export function StepPayment({
  form,
  applicationFee,
  paymentError,
  onChange,
  onRetry,
}: {
  form: EnrollFormData
  applicationFee: number
  paymentError: string
  onChange: <K extends keyof EnrollFormData>(field: K, value: EnrollFormData[K]) => void
  onRetry: () => void
}) {
  return (
    <div>
      <StepHeading
        title="Pay the registration fee"
        sub={`${formatNaira(applicationFee)} today. The course fee is billed separately before classes begin.`}
      />

      <div className="mb-6">
        <SubHeading
          title="Ways to pay"
          sub="Choose one of these on Paystack's page after you continue."
        />
        <ul className="flex flex-col gap-[11px]">
          {PAYSTACK_CHANNELS.map((channel) => (
            <InfoRow key={channel.name} name={channel.name} note={channel.note} />
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
          <p className="text-[15px] font-bold text-red-900">We couldn't start your payment</p>
          <p className="mt-1 text-[14.5px] leading-[1.6] text-red-700">{paymentError}</p>
          <button
            type="button"
            onClick={onRetry}
            className="mt-3 rounded-xl border-[1.5px] border-red-300 px-4 py-2.5 text-[14px] font-bold text-red-900 transition-colors hover:border-red-500 hover:bg-white"
          >
            Try again
          </button>
        </div>
      ) : null}
    </div>
  )
}
