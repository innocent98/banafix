# Policy copy changes for John to review

Banafix now works like this: a student applies, pays a non-refundable assessment fee, is assessed, and only then agrees a plan and tuition with us. The old policy text still described the earlier flow (pay and enrol straight away, refund schedule, student dashboard, PayPal, instalments, late fees). We have rewritten it so it matches what the site actually does.

Two files changed: the pop-up students read before paying (`components/site/enroll/policy-dialog.tsx`) and the `/policies` page (`components/site/policies/policies.ts`). Every changed passage is shown below as Before and After, with the numbers of the contradictions it fixes (from the list of 20 in the earlier review notes, sections A to F). Where you have not yet decided anything, the new text says "handled case by case, contact us" and uses no numbers. Those points are collected in "Decisions John must make" near the end. Please answer them and we will tighten the wording.

Two things apply to every section: every "Last updated" date on the `/policies` page is now "November 3, 2026" (it said December 15, 2024), and the old text had no mention of the assessment fee at all.

Gap tags used below: **E1** assessment fee is non-refundable and what it covers, **E2** tuition is set after the assessment, **E3** home assessment terms, **E4** missed or cancelled assessment, **E5** currency, **E6** last updated dates.

---

## Part 1. The pop-up before payment (`policy-dialog.tsx`)

Sections are now numbered 1 to 6 (the old pop-up skipped number 3). The two consent boxes on the pay step still link here: "Terms & Conditions, Privacy Policy and Code of Conduct" and "refund schedule and the attendance requirements". The Refund Policy section now opens with the non-refundable fee, and there is a new Attendance section.

### Section 1

Before:

> **Enrollment Terms.** By enrolling in Banafix courses, you agree to:
> - Attend all scheduled sessions punctually
> - Complete assigned practice tasks and homework
> - Respect course materials and intellectual property
> - Provide accurate information during enrollment
> *Course materials and platform access are provided for the duration of your enrollment and remain property of Banafix.*

After:

> **Applying and Enrolment.** By applying for an assessment, you agree to:
> - Provide accurate information in your application
> - Attend your assessment at the time we agree with you, at home, at the centre or online
> - For a home assessment, give a correct address and landmark. We confirm that we cover your area and we confirm the time with you
> - Respect course materials and intellectual property
> *Paying the assessment fee does not enrol you. Enrolment follows your assessment and a plan you agree with Banafix. Course materials and content remain the property of Banafix.*

Resolves: 14, 15, 20, E1, E3

### Section 2

Before:

> **Payment Policy.** Payment terms:
> - Full payment required before course commencement
> - Installment plans available for courses above ₦50,000
> - Late payment fee of ₦2,000 applies for overdue installments
> - Payment methods: Card, Bank Transfer, USSD, PayPal
> *All fees are in Nigerian Naira (₦) unless otherwise stated.*

After:

> **Payment Policy.** Payment terms:
> - The assessment fee is paid when you apply. The amount depends on the location and is shown at checkout
> - The assessment fee is charged once per student. If you have paid it before, you are not charged it again for a later application
> - Tuition is not charged until after your assessment, once a plan is agreed. It is charged per class. The rate depends on the location, the format and the class length (45 or 60 minutes)
> - Your plan sets the classes per week and the number of planned classes. The per-class rate is fixed when the plan is agreed
> - You can pay online through Paystack (card, bank, USSD or bank transfer). The academy can also record payments made in cash, by bank transfer or by POS, including part payments
> *All amounts are in Nigerian Naira (₦). Applicants abroad pay the Naira fee shown at checkout. When tuition payments are due is confirmed with you when your plan is agreed.*

Resolves: 10, 11, 12, 13, E1, E2, E5

### Section 3

Before:

> **Refund Policy.** Refund schedule:
> - 100% refund: within 7 days of enrollment with no sessions attended
> - 75% refund: within the first 2 weeks with 2 or fewer sessions attended
> - 50% refund: within the first month with 25% or less of the course completed
> - No refund: after 25% course completion or 1 month, whichever comes first
> *Refunds are processed within 7 to 14 business days to the original payment method.*

After:

> **Refund Policy.** Refunds:
> - The assessment fee is non-refundable. It covers your assessment, and paying it does not enrol you
> - Tuition refund requests are considered case by case, taking into account how much of your plan has been delivered
> - If you miss or cancel your assessment, contact us and we will handle it case by case
> - If a refund is approved, we will tell you how and when it will be paid
> *To ask about a refund, contact us through the contact page.*

Resolves: 1, 2, 3, 6, E1, E4

### Section 4 (new)

Before: this section did not exist. Its attendance points sat under "Enrollment Terms".

After:

> **Attendance.** Once you are enrolled, we ask that you:
> - Attend your lessons punctually
> - Tell us as early as you can if you cannot make a lesson
> - Complete assigned practice tasks and homework
> *Cancelling or rescheduling a lesson, and arriving late, are handled case by case. Please contact us.*

Resolves: 6, 20

### Section 5

Before:

> **Code of Conduct.** Expected behaviour:
> - Maintain respectful behaviour towards instructors and fellow students
> - Use appropriate language during sessions
> - Respect others' learning environment
> - Follow safety guidelines for instruments and equipment
> *Disruptive behaviour may result in warnings, suspension, or course termination without refund.*

After:

> **Code of Conduct.** Expected behaviour:
> - Maintain respectful behaviour towards instructors and fellow students
> - Use appropriate language during assessments and lessons
> - Respect others' learning environment
> - Follow safety guidelines for instruments and equipment
> *Disruptive behaviour may result in warnings, suspension, or the end of your lessons.*

Resolves: 19, 20

### Section 6

Before:

> **Privacy Policy.** Data collection:
> - Personal information used for course administration only
> - Payment data processed securely through certified providers
> - Session recordings may be used for quality improvement
> - Marketing communications only with explicit consent
> *The full privacy policy is available on our policies page.*

After:

> **Privacy Policy.** Data collection:
> - Personal information is used to handle your application, assessment, lessons and payments
> - Assessment details such as your preferred date, home address and landmark are used to arrange your assessment
> - Payment data is processed securely through certified providers
> - Session recordings may be used for quality improvement
> - Marketing communications only with explicit consent
> *The full privacy policy is available on our policies page.*

Resolves: 18, E3

---

## Part 2. The `/policies` page (`policies.ts`)

### Privacy Policy

**Information We Collect** (resolves 18, E3)

Before:

> **Information We Collect.** We collect information you provide directly to us, such as when you create an account, enroll in courses, or contact us for support. This includes your name, email address, phone number, payment information, and learning preferences.

After:

> **Information We Collect.** We collect information you give us when you apply, book an assessment, enrol, pay, or contact us. This includes your name, email address, phone number, payment records and learning preferences. For an assessment we also collect your preferred date and time of day. For a home assessment or home lessons we collect your home address and a nearby landmark. Banafix students do not have accounts, so there is no student login or password.

**How We Use Your Information** (resolves 18, E2)

Before:

> **How We Use Your Information.** We use the information we collect to provide, maintain, and improve our services, process transactions, send you technical notices and support messages, and communicate with you about courses, instructors, and promotional offers.

After:

> **How We Use Your Information.** We use the information we collect to provide, maintain, and improve our services, arrange and carry out your assessment, agree your plan, process payments, send you support messages, and communicate with you about courses and instructors. With your consent, we also send promotional offers.

**Information Sharing** (resolves 19)

Before:

> **Information Sharing.** We do not sell, trade, or otherwise transfer your personal information to third parties without your consent, except as described in this policy. We may share information with instructors for course delivery and with service providers who assist us in operating our platform.

After:

> **Information Sharing.** We do not sell, trade, or otherwise transfer your personal information to third parties without your consent, except as described in this policy. We may share information with the instructors who assess and teach you, and with service providers, such as our payment provider, who assist us in operating our services.

**Data Security (unchanged)** (resolves none, shown for completeness)

Before:

> **Data Security.** We implement appropriate security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. However, no method of transmission over the internet is 100% secure.

After:

> **Data Security.** We implement appropriate security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. However, no method of transmission over the internet is 100% secure.

### Terms & Conditions

**Acceptance of Terms** (resolves 14, E1)

Before:

> **Acceptance of Terms.** By accessing and using Banafix services, you accept and agree to be bound by the terms and provision of this agreement. These terms apply to all users of the platform, including students, instructors, and visitors.

After:

> **Acceptance of Terms.** By using Banafix services, including applying for an assessment, you accept and agree to be bound by the terms of this agreement. These terms apply to all users of our services, including students, instructors, and visitors.

**Course Enrollment replaced by four blocks. First block** (resolves 14, 16, E1, E4)

Before:

> **Course Enrollment.** Course enrollment is subject to availability and instructor approval. Payment must be completed before course access is granted. Course materials and content are for personal use only and may not be shared or redistributed.

After:

> **Applying and Assessment.** To join Banafix you apply and pay a non-refundable assessment fee. The amount depends on the location and is shown at checkout. The fee is charged once per student: a student who has paid it before is not charged again for a later application. You are then assessed at home, at the centre or online. Paying the fee does not enrol you.

**Second block (new)** (resolves 16, E3)

Before: no such block.

After:

> **Home Assessments and Home Lessons.** Home assessments and home lessons need your address and a landmark. We confirm that we cover your area, and we confirm the time with you.

**Third block (new)** (resolves 11, 16, E2)

Before: no such block.

After:

> **Plan, Tuition and Enrolment.** Enrolment follows your assessment and a plan you agree with Banafix. The plan sets the classes per week and the number of planned classes. Tuition is charged per class. The rate depends on the location, the format and the class length (45 or 60 minutes), and it is fixed when the plan is agreed. The rates on a course page are the rates that apply at that location and format.

**Fourth block (new)** (resolves 10, 11, 12, 13, E5)

Before: no such block.

After:

> **Payment.** You can pay online through Paystack by card, bank, USSD or bank transfer. The academy can also record payments made in cash, by bank transfer or by POS, including part payments. All amounts are in Nigerian Naira. Applicants abroad pay the Naira assessment fee shown at checkout. When tuition payments are due is confirmed with you when your plan is agreed.

**User Responsibilities** (resolves 17, 20)

Before:

> **User Responsibilities.** Users are responsible for maintaining the confidentiality of their account information, attending scheduled sessions, and following our community guidelines. Inappropriate behavior may result in account suspension or termination.

After:

> **User Responsibilities.** Students are responsible for giving accurate information, attending their assessment and lessons, and following our Code of Conduct. Inappropriate behavior may result in suspension or the end of your lessons.

**Intellectual Property** (resolves 15, 16 (the "personal use only" sentence moved here from Course Enrollment))

Before:

> **Intellectual Property.** All course content, materials, and platform features are the intellectual property of Banafix or our instructors. Users may not reproduce, distribute, or create derivative works without explicit permission.

After:

> **Intellectual Property.** All course content and materials, and the content of our website, are the intellectual property of Banafix or our instructors. Course materials and content are for personal use only and may not be shared or redistributed. Users may not reproduce, distribute, or create derivative works without explicit permission.

### Refund Policy

**14-Day Money-Back Guarantee replaced by the assessment fee block** (resolves 1, 2, 4, 5, 7, E1)

Before:

> **14-Day Money-Back Guarantee.** We offer a full refund within 14 days of course enrollment if you are not completely satisfied. To be eligible, you must have attended fewer than 25% of scheduled sessions and request the refund through your student dashboard or by contacting support.

After:

> **The Assessment Fee Is Non-Refundable.** The assessment fee is non-refundable. It covers your assessment. Paying it does not enrol you.

**Missed or cancelled assessments (new)** (resolves E4)

Before: no such block.

After:

> **Missed or Cancelled Assessments.** If you miss or cancel your assessment, please contact us. We handle each case individually.

**Partial Refunds replaced by tuition refunds** (resolves 7, 9, E2)

Before:

> **Partial Refunds.** After the 14-day period, partial refunds may be available for unused sessions due to exceptional circumstances such as medical emergencies or relocation. Each case is reviewed individually by our support team.

After:

> **Tuition Refunds.** Tuition is agreed after your assessment, as part of your plan. Requests for a tuition refund are considered case by case, taking into account how much of your plan has been delivered. To ask, contact us through the contact page.

**Non-Refundable Items replaced by course materials** (resolves 5)

Before:

> **Non-Refundable Items.** Course materials, digital downloads, and completed sessions are non-refundable. Promotional discounts and gift certificates cannot be refunded for cash value.

After:

> **Course Materials.** If you have a question about a refund for course materials, please contact us. We handle each case individually.

**Processing Time replaced by what happens if a refund is approved** (resolves 3, 8)

Before:

> **Processing Time.** Approved refunds are processed within 5-7 business days. Refunds are issued to the original payment method used for enrollment. Bank transfer refunds may take additional time depending on your financial institution.

After:

> **If a Refund Is Approved.** If we approve a refund, we will tell you how and when it will be paid.

### Code of Conduct

**Respectful Communication** (resolves 19)

Before:

> **Respectful Communication.** All interactions between students, instructors, and staff must be respectful and professional. Harassment, discrimination, or inappropriate behavior of any kind will not be tolerated and may result in immediate account termination.

After:

> **Respectful Communication.** All interactions between students, instructors, and staff must be respectful and professional. Harassment, discrimination, or inappropriate behavior of any kind will not be tolerated and may result in immediate suspension or the end of your lessons.

**Session Etiquette** (resolves 20, E3)

Before:

> **Session Etiquette.** Students are expected to arrive on time for sessions, come prepared with necessary materials, and maintain a distraction-free learning environment. For online sessions, ensure stable internet connection and appropriate lighting.

After:

> **Session Etiquette.** Students are expected to arrive on time for assessments and lessons, come prepared with necessary materials, and maintain a distraction-free learning environment. For online assessments and lessons, ensure a stable internet connection and appropriate lighting. For home assessments and lessons, please be ready at the address you gave us.

**Academic Integrity** (resolves 19)

Before:

> **Academic Integrity.** Students must complete assignments and assessments honestly and independently unless collaboration is explicitly permitted. Plagiarism or cheating will result in course failure and potential account suspension.

After:

> **Academic Integrity.** Students must be honest about their experience at assessment, and complete assigned work honestly and independently unless collaboration is explicitly permitted. Serious or repeated dishonesty may affect your place with us.

**Platform Usage renamed Website Usage** (resolves 19)

Before:

> **Platform Usage.** Users must not attempt to hack, disrupt, or misuse the platform in any way. Sharing account credentials or accessing unauthorized areas is strictly prohibited and may result in legal action.

After:

> **Website Usage.** Users must not attempt to hack, disrupt, or misuse our website or systems in any way. Accessing unauthorized areas or other people's personal information is strictly prohibited and may result in legal action.

### Legal Information

**Modifications** (resolves 19)

Before:

> **Modifications.** We reserve the right to modify these terms at any time. Users will be notified of significant changes via email or platform notifications. Continued use of our services after modifications constitutes acceptance of the updated terms.

After:

> **Modifications.** We reserve the right to modify these terms at any time. Users will be notified of significant changes via email or a notice on our website. Continued use of our services after modifications constitutes acceptance of the updated terms.

Governing Law, Limitation of Liability and Force Majeure were not changed in wording. Only the "Last updated" date on this section changed (E6).

---

## Decisions John must make

Each line says what the site says now. Write your answer on the blank line and we will update the wording.

- [ ] **Tuition refunds.** Now says: requests are considered case by case, taking into account how much of the plan has been delivered; contact us.
  John's answer: ______________________________
- [ ] **Cancelling or rescheduling a lesson.** Now says: handled case by case, contact us. Students are asked to tell us as early as they can.
  John's answer: ______________________________
- [ ] **Missed or cancelled assessment.** Now says: contact us and we handle each case individually. The fee itself stays non-refundable. No rescheduling rule is stated.
  John's answer: ______________________________
- [ ] **Late arrival.** Now says: handled case by case, contact us.
  John's answer: ______________________________
- [ ] **Instrument rental.** Now says: nothing. The old text did not mention rental either, and the 8,000 naira term rental is unconfirmed, so it is not in the policy.
  John's answer: ______________________________
- [ ] **Course materials (terms and refunds).** Now says: materials stay Banafix property, are for personal use, and refund questions about materials are handled case by case. Nothing is said about prices or how materials are supplied.
  John's answer: ______________________________
- [ ] **Sibling discounts.** Now says: nothing. The old text had no promise either.
  John's answer: ______________________________
- [ ] **When tuition is due.** Now says: confirmed with the student when the plan is agreed. The old "full payment before the course starts" is gone.
  John's answer: ______________________________
- [ ] **Part payments and instalments.** Now says: the academy records part payments. There is no online instalment plan and no late fee. If you want a formal instalment rule or a late fee, say so.
  John's answer: ______________________________
- [ ] **How and when an approved refund is paid.** Now says: we will tell the student how and when. The old text promised a fixed number of business days and the original payment method, and those are removed.
  John's answer: ______________________________
- [ ] **Refund when a student is removed for bad behaviour.** Now says: the end of lessons is possible; nothing about refunds. The old text said "without refund".
  John's answer: ______________________________
- [ ] **Home visits outside our area.** Now says: we confirm that we cover the area and confirm the time. It does not say what happens if we do not cover it.
  John's answer: ______________________________
- [ ] **Session recordings.** The privacy text still says recordings "may be used for quality improvement". That line was kept from the old text and has not been confirmed as true.
  John's answer: ______________________________

---

## Statements removed because they are unconfirmed or untrue

- 100%, 75% and 50% refund tiers, the 7 day, 2 week and one month windows, and the "25% of the course" cut-off.
- "Full refund within 14 days if you are not completely satisfied" and the "fewer than 25% of scheduled sessions" condition.
- Refund requests "through your student dashboard" (there is no student dashboard).
- Refunds "within 7 to 14 business days" and "within 5-7 business days", and refunds "to the original payment method".
- PayPal as a payment method.
- "Instalment plans available for courses above 50,000 naira" and "late payment fee of 2,000 naira for overdue instalments" (neither mechanism exists).
- "Full payment required before course commencement".
- "Course materials and platform access are provided for the duration of your enrollment".
- "Subject to availability" and "instructor approval" for enrolment, and "course access is granted" after payment (there are no seat limits and no student portal).
- Confidentiality of "account information", "account suspension", "account termination" and "sharing account credentials" (students have no accounts).
- "When you create an account" in the privacy text.
- "Course failure" for cheating (replaced with a neutral line about your place).
- "Digital downloads" and "gift certificates" as non-refundable items, and "promotional discounts cannot be refunded".
- "Notified via platform notifications" (replaced with a website notice).
- Not added because unconfirmed: written feedback every fourth lesson, an 8,000 naira term rental, a free makeup lesson each term.

Note: the heading text on the `/policies` page itself (not changed in this pass) still says "how refunds work" and the page metadata still mentions a refund policy. Both are still accurate because the Refund Policy section exists.
