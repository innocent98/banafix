/**
 * Policy copy for /policies.
 *
 * STATIC LEGAL COPY. There is no CMS or Prisma model behind it. Rewritten for the
 * assessment-first flow (apply, pay a non-refundable assessment fee, be assessed,
 * agree a plan, then enrol). Where the academy has made no business decision
 * (tuition refunds, cancelling or rescheduling lessons, a missed assessment, late
 * arrival, materials) the wording is deliberately neutral ("case by case"); those
 * points are listed for John in docs/john-review/policy-changes.md. Do not add
 * numbers or fee amounts until he decides.
 *
 * `id` is load-bearing: components/site/site-footer.tsx links to
 * `/policies#privacy` and `/policies#terms`, so those two ids must exist as
 * anchors on the rendered page.
 */

export interface PolicyBlock {
  heading: string
  text: string
}

export interface Policy {
  id: string
  title: string
  /** Short label for the table of contents. */
  navLabel: string
  lastUpdated: string
  blocks: PolicyBlock[]
}

export const POLICIES: Policy[] = [
  {
    id: "privacy",
    title: "Privacy Policy",
    navLabel: "Privacy Policy",
    lastUpdated: "November 3, 2026",
    blocks: [
      {
        heading: "Information We Collect",
        text: "We collect information you give us when you apply, book an assessment, enrol, pay, or contact us. This includes your name, email address, phone number, payment records and learning preferences. For an assessment we also collect your preferred date and time of day. For a home assessment or home lessons we collect your home address and a nearby landmark. Banafix students do not have accounts, so there is no student login or password.",
      },
      {
        heading: "How We Use Your Information",
        text: "We use the information we collect to provide, maintain, and improve our services, arrange and carry out your assessment, agree your plan, process payments, send you support messages, and communicate with you about courses and instructors. With your consent, we also send promotional offers.",
      },
      {
        heading: "Information Sharing",
        text: "We do not sell, trade, or otherwise transfer your personal information to third parties without your consent, except as described in this policy. We may share information with the instructors who assess and teach you, and with service providers, such as our payment provider, who assist us in operating our services.",
      },
      {
        heading: "Data Security",
        text: "We implement appropriate security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. However, no method of transmission over the internet is 100% secure.",
      },
    ],
  },
  {
    id: "terms",
    title: "Terms & Conditions",
    navLabel: "Terms & Conditions",
    lastUpdated: "November 3, 2026",
    blocks: [
      {
        heading: "Acceptance of Terms",
        text: "By using Banafix services, including applying for an assessment, you accept and agree to be bound by the terms of this agreement. These terms apply to all users of our services, including students, instructors, and visitors.",
      },
      {
        heading: "Applying and Assessment",
        text: "To join Banafix you apply and pay a non-refundable assessment fee. The amount depends on the location and is shown at checkout. The fee is charged once per student: a student who has paid it before is not charged again for a later application. You are then assessed at home, at the centre or online. Paying the fee does not enrol you.",
      },
      {
        heading: "Home Assessments and Home Lessons",
        text: "Home assessments and home lessons need your address and a landmark. We confirm that we cover your area, and we confirm the time with you.",
      },
      {
        heading: "Plan, Tuition and Enrolment",
        text: "Enrolment follows your assessment and a plan you agree with Banafix. The plan sets the classes per week and the number of planned classes. Tuition is charged per class. The rate depends on the location, the format and the class length (45 or 60 minutes), and it is fixed when the plan is agreed. The rates on a course page are the rates that apply at that location and format.",
      },
      {
        heading: "Payment",
        text: "You can pay online through Paystack by card, bank, USSD or bank transfer. The academy can also record payments made in cash, by bank transfer or by POS, including part payments. All amounts are in Nigerian Naira. Applicants abroad pay the Naira assessment fee shown at checkout. When tuition payments are due is confirmed with you when your plan is agreed.",
      },
      {
        heading: "User Responsibilities",
        text: "Students are responsible for giving accurate information, attending their assessment and lessons, and following our Code of Conduct. Inappropriate behavior may result in suspension or the end of your lessons.",
      },
      {
        heading: "Intellectual Property",
        text: "All course content and materials, and the content of our website, are the intellectual property of Banafix or our instructors. Course materials and content are for personal use only and may not be shared or redistributed. Users may not reproduce, distribute, or create derivative works without explicit permission.",
      },
    ],
  },
  {
    id: "refunds",
    title: "Refund Policy",
    navLabel: "Refund Policy",
    lastUpdated: "November 3, 2026",
    blocks: [
      {
        heading: "The Assessment Fee Is Non-Refundable",
        text: "The assessment fee is non-refundable. It covers your assessment. Paying it does not enrol you.",
      },
      {
        heading: "Missed or Cancelled Assessments",
        text: "If you miss or cancel your assessment, please contact us. We handle each case individually.",
      },
      {
        heading: "Tuition Refunds",
        text: "Tuition is agreed after your assessment, as part of your plan. Requests for a tuition refund are considered case by case, taking into account how much of your plan has been delivered. To ask, contact us through the contact page.",
      },
      {
        heading: "Course Materials",
        text: "If you have a question about a refund for course materials, please contact us. We handle each case individually.",
      },
      {
        heading: "If a Refund Is Approved",
        text: "If we approve a refund, we will tell you how and when it will be paid.",
      },
    ],
  },
  {
    id: "conduct",
    title: "Code of Conduct",
    navLabel: "Code of Conduct",
    lastUpdated: "November 3, 2026",
    blocks: [
      {
        heading: "Respectful Communication",
        text: "All interactions between students, instructors, and staff must be respectful and professional. Harassment, discrimination, or inappropriate behavior of any kind will not be tolerated and may result in immediate suspension or the end of your lessons.",
      },
      {
        heading: "Session Etiquette",
        text: "Students are expected to arrive on time for assessments and lessons, come prepared with necessary materials, and maintain a distraction-free learning environment. For online assessments and lessons, ensure a stable internet connection and appropriate lighting. For home assessments and lessons, please be ready at the address you gave us.",
      },
      {
        heading: "Academic Integrity",
        text: "Students must be honest about their experience at assessment, and complete assigned work honestly and independently unless collaboration is explicitly permitted. Serious or repeated dishonesty may affect your place with us.",
      },
      {
        heading: "Website Usage",
        text: "Users must not attempt to hack, disrupt, or misuse our website or systems in any way. Accessing unauthorized areas or other people's personal information is strictly prohibited and may result in legal action.",
      },
    ],
  },
  {
    id: "legal",
    title: "Legal Information",
    navLabel: "Legal Information",
    lastUpdated: "November 3, 2026",
    blocks: [
      {
        heading: "Governing Law",
        text: "These terms and conditions are governed by and construed in accordance with the laws of Nigeria. Any disputes arising from the use of our services will be subject to the exclusive jurisdiction of Nigerian courts.",
      },
      {
        heading: "Limitation of Liability",
        text: "Banafix shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of our services. Our total liability shall not exceed the amount paid for the specific course or service in question.",
      },
      {
        heading: "Force Majeure",
        text: "We shall not be liable for any failure or delay in performance due to circumstances beyond our reasonable control, including but not limited to acts of God, natural disasters, government actions, or technical failures.",
      },
      {
        heading: "Modifications",
        text: "We reserve the right to modify these terms at any time. Users will be notified of significant changes via email or a notice on our website. Continued use of our services after modifications constitutes acceptance of the updated terms.",
      },
    ],
  },
]
