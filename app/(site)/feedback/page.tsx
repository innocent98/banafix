/**
 * /feedback — the public feedback form. No login. Posts to `POST /api/feedback`.
 * `FEEDBACK_EMAIL` (when set) is shown as the alternative route: feedback emailed there reaches the
 * admin team, who add it under /admin/feedback.
 */
import type { Metadata } from "next"

import { FeedbackForm } from "@/components/site/feedback/feedback-form"
import { Display, Eyebrow } from "@/components/site/primitives"

export const metadata: Metadata = {
  title: "Share your feedback | Banafix",
  description: "Tell us how learning at Banafix is going. Parents, students and visitors are all welcome.",
}

export const dynamic = "force-dynamic"

export default function FeedbackPage() {
  const feedbackEmail = process.env.FEEDBACK_EMAIL?.trim() || ""

  return (
    <section className="bfx-shell grid grid-cols-[repeat(auto-fit,minmax(min(400px,100%),1fr))] items-start gap-16 pt-16 pb-[90px]">
      <div>
        <Eyebrow>FEEDBACK</Eyebrow>
        <Display as="h1" className="mb-4 text-[clamp(36px,4.6vw,58px)] leading-none text-bfx-ink">
          How is it
          <br />
          going?
        </Display>
        <p className="bfx-pretty mb-5 max-w-[440px] text-[18px] leading-[1.6] text-bfx-body">
          We read every message. Tell us what is working, what is not, and what you would like us to do
          better. It takes about two minutes.
        </p>
        {feedbackEmail ? (
          <p className="max-w-[440px] text-[15px] leading-[1.6] text-bfx-body">
            Prefer email? Write to{" "}
            <a className="font-semibold text-bfx-ink underline" href={`mailto:${feedbackEmail}`}>
              {feedbackEmail}
            </a>
            . If you are happy for us to quote your words on our website, say so in your message.
          </p>
        ) : null}
      </div>

      <FeedbackForm />
    </section>
  )
}
