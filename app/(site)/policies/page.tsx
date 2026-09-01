import type { Metadata } from "next"

import { PolicyNav } from "@/components/site/policies/policy-nav"
import { POLICIES } from "@/components/site/policies/policies"
import { Display, Eyebrow, PillAnchor, PillLink } from "@/components/site/primitives"
import { SITE_EMAIL, SITE_EMAIL_MAILTO } from "@/lib/site"

export const metadata: Metadata = {
  title: "Policies & terms | Banafix",
  description:
    "Banafix privacy policy, terms and conditions, refund policy, code of conduct and legal information.",
}

/**
 * /policies — every policy stacked with a real `#id` anchor, plus a sticky
 * table of contents.
 *
 * The old page was a `useState` tab switcher that rendered one policy at a
 * time and emitted no ids, so the footer's /policies#privacy and
 * /policies#terms links both dumped you at the top of the page showing
 * whichever tab happened to be default. Stacking the sections makes those
 * anchors work, makes the page Ctrl-F-able and printable, and drops all the
 * page's state — only the TOC highlight is client-side now.
 *
 * The "Download PDF" and "Download All PDFs" buttons were removed: there are
 * no PDFs anywhere in the repo and neither button had a handler.
 */
export default function PoliciesPage() {
  const navItems = POLICIES.map(({ id, navLabel }) => ({ id, navLabel }))

  return (
    <div className="bfx-rise">
      <section className="bfx-shell pt-16 pb-11">
        <div className="max-w-[640px]">
          <Eyebrow>POLICIES</Eyebrow>
          <Display as="h1" className="mb-4 text-[clamp(38px,5vw,62px)] leading-none">
            The small print,
            <br />
            in plain sight
          </Display>
          <p className="bfx-pretty text-[18px] leading-[1.6] text-bfx-body">
            How we handle your data, what you agree to when you enrol, and how refunds work. All of
            it on one page — nothing hidden behind a tab.
          </p>
        </div>
      </section>

      <section className="bfx-shell grid items-start gap-12 pb-24 lg:grid-cols-[minmax(0,268px)_minmax(0,1fr)]">
        <PolicyNav items={navItems} />

        <div className="flex flex-col gap-6">
          {POLICIES.map((policy) => (
            <section
              key={policy.id}
              id={policy.id}
              /* 104px clears the 76px sticky header when a #hash lands here. */
              className="scroll-mt-[104px] rounded-[24px] border border-bfx-border-6 bg-bfx-surface px-7 py-8 sm:px-9 sm:py-10"
            >
              <Display as="h2" className="mb-1.5 text-[clamp(26px,3vw,34px)] leading-[1.08]">
                {policy.title}
              </Display>
              <p className="mb-8 text-[13.5px] font-semibold text-bfx-muted">
                Last updated: {policy.lastUpdated}
              </p>

              <div className="flex flex-col gap-7">
                {policy.blocks.map((block) => (
                  <div key={block.heading}>
                    <h3 className="mb-2.5 text-[18px] font-bold tracking-[-0.01em] text-bfx-ink">
                      {block.heading}
                    </h3>
                    <p className="bfx-pretty m-0 text-[15.5px] leading-[1.65] text-bfx-body-2">
                      {block.text}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          ))}

          {/* Escalation — the old "Contact Legal Team" button had no href. */}
          <div className="rounded-[20px] border border-bfx-note-border bg-bfx-note-bg px-7 py-7 sm:px-9">
            <h2 className="mb-2 text-[19px] font-bold tracking-[-0.01em] text-bfx-note-text">
              Questions about any of this?
            </h2>
            <p className="bfx-pretty mb-6 max-w-[560px] text-[14.5px] leading-[1.65] text-bfx-note-text">
              If something here is unclear — especially around refunds or how we hold your data —
              ask before you enrol. We&apos;d rather answer it twice than have you guess.
            </p>
            <div className="flex flex-wrap gap-3">
              <PillLink variant="ink" size="md" href="/contact">
                Contact us
              </PillLink>
              <PillAnchor variant="outlineSoft" size="md" href={SITE_EMAIL_MAILTO}>
                {SITE_EMAIL}
              </PillAnchor>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
