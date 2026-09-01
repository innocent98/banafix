/**
 * FAQ content for /faqs.
 *
 * STATIC MARKETING COPY — there is no FAQ model in Prisma. These six answers
 * are the ones the previous page actually rendered; eight more were commented
 * out in the old file and are not restored here.
 *
 * The category list is DERIVED from this array (see `faqCategories`) rather
 * than hardcoded. The old page shipped a hardcoded `categories` array claiming
 * 14 FAQs across six categories while rendering six across three — the counts
 * were wrong and the tab UI that displayed them was commented out.
 */

export type FaqCategoryId = "admissions" | "sessions" | "online-vs-home" | "payments" | "policies"

export interface Faq {
  id: number
  category: FaqCategoryId
  question: string
  answer: string
  /** Not rendered on the closed row — they widen the search match. */
  tags: string[]
}

/** Display names for every category id a FAQ may carry. */
export const FAQ_CATEGORY_LABELS: Record<FaqCategoryId, string> = {
  admissions: "Admissions",
  sessions: "Sessions",
  "online-vs-home": "Online vs Home",
  payments: "Payments",
  policies: "Policies",
}

export const FAQS: Faq[] = [
  {
    id: 1,
    category: "admissions",
    question: "Who can enroll?",
    answer: "Interested candidates: children, teenagers, and adults. Beginners are absolutely welcome.",
    tags: ["enroll", "age", "beginners"],
  },
  {
    id: 2,
    category: "admissions",
    question: "Do I need prior experience?",
    answer: "No. We specialize in discovering and developing raw musical potential.",
    tags: ["experience", "beginners"],
  },
  {
    id: 3,
    category: "sessions",
    question: "What learning options do you offer?",
    answer: "We offer flexible options: in-center classes, home lessons, and online sessions.",
    tags: ["in-center", "home", "online"],
  },
  {
    id: 4,
    category: "online-vs-home",
    question: "Are online classes effective?",
    answer: "Yes, our online classes are interactive, personalized, and results-driven.",
    tags: ["online", "effectiveness"],
  },
  {
    id: 5,
    category: "sessions",
    question: "How are classes scheduled?",
    answer: "Schedules are flexible and arranged to fit your availability.",
    tags: ["schedule", "flexibility"],
  },
  {
    id: 6,
    category: "admissions",
    question: "How do I enroll or get pricing?",
    answer: "Simply contact us via phone, WhatsApp, or the website to get started.",
    tags: ["enroll", "pricing", "contact"],
  },
]

export interface FaqCategory {
  id: "all" | FaqCategoryId
  name: string
  count: number
}

/**
 * Categories with a real count, derived from `FAQS`. A category with zero
 * entries never gets a chip, so the filter can't land on an empty list.
 */
export function faqCategories(faqs: Faq[]): FaqCategory[] {
  const counts = new Map<FaqCategoryId, number>()
  for (const faq of faqs) counts.set(faq.category, (counts.get(faq.category) ?? 0) + 1)

  const ordered = (Object.keys(FAQ_CATEGORY_LABELS) as FaqCategoryId[])
    .filter((id) => (counts.get(id) ?? 0) > 0)
    .map((id) => ({ id, name: FAQ_CATEGORY_LABELS[id], count: counts.get(id) ?? 0 }))

  return [{ id: "all" as const, name: "All FAQs", count: faqs.length }, ...ordered]
}
