import type { TemplateKey } from './events'

export interface TemplateCopy {
  subject: string
  body: string
  /** Shorter text for SMS/WhatsApp (falls back to `body`). Keep it GSM-safe: no naira sign. */
  shortBody?: string
}

const SIGN_OFF = 'Warm regards,\nThe {{academyName}} Team'

/** Default copy per template. A row in `message_templates` overrides it; "Reset to default" restores it. */
export const DEFAULT_TEMPLATES: Record<TemplateKey, TemplateCopy> = {
  application_received: {
    subject: 'Assessment application received - {{courseTitle}}',
    body: `Dear {{firstName}},

Thank you for applying to {{courseTitle}} at {{academyName}}. Your application has been received.

To book your assessment, please pay {{assessmentFee}} on the secure payment page that opened when you submitted your application.

Once your payment is confirmed we will send you a receipt and our admissions team will be in touch to arrange your assessment.

Application reference: {{enrollmentId}}

If you did not finish the payment or have any questions, reply to this email or contact {{supportEmail}}.

${SIGN_OFF}`,
    shortBody:
      'Banafix: we received your application for {{courseTitle}}. Please complete the assessment fee payment to book your assessment.',
  },
  application_covered: {
    subject: 'Application received: {{courseTitle}}',
    body: `Hi {{firstName}},

We have received an application for {{courseTitle}} using this email address.

Our team will confirm it with you before anything else happens. If you have paid the assessment fee before, you will not be charged for it again. If this was not you, please contact us at {{supportEmail}}.`,
    shortBody: 'Banafix: we received an application for {{courseTitle}}. Our team will confirm it with you. No new assessment fee is due if you have paid before.',
  },
  assessment_paid: {
    subject: 'Assessment fee received - {{courseTitle}}',
    body: `Dear {{firstName}},

We have received your assessment fee for {{courseTitle}}. Our admissions team will contact you shortly to arrange your assessment.

${SIGN_OFF}`,
    shortBody: 'Banafix: we received your assessment fee for {{courseTitle}}. We will contact you to arrange your assessment.',
  },
  assessment_scheduled: {
    subject: 'Your assessment is scheduled - {{courseTitle}}',
    body: `Dear {{firstName}},

Your assessment for {{courseTitle}} is scheduled for {{assessmentDate}} at {{assessmentTime}}, {{assessmentArrangement}}.

If this time does not work for you, reply to this email or contact {{supportEmail}} as soon as you can.

${SIGN_OFF}`,
    shortBody:
      'Banafix: your assessment for {{courseTitle}} is on {{assessmentDate}} at {{assessmentTime}}, {{assessmentArrangement}}.',
  },
  assessed: {
    subject: 'Your assessment is complete - {{courseTitle}}',
    body: `Dear {{firstName}},

Thank you for completing your assessment for {{courseTitle}}. Our team will now be in touch to agree your learning plan: the format, class length and schedule that suit you best.

${SIGN_OFF}`,
    shortBody: 'Banafix: your assessment for {{courseTitle}} is complete. We will contact you to agree your learning plan.',
  },
  plan_agreed: {
    subject: 'Your learning plan is agreed - {{courseTitle}}',
    body: `Dear {{firstName}},

Your learning plan for {{courseTitle}} is agreed: {{planSummary}}.

We will confirm your enrolment as soon as your tuition payment is recorded. If anything above looks wrong, reply to this email or contact {{supportEmail}}.

${SIGN_OFF}`,
    shortBody: 'Banafix: your learning plan for {{courseTitle}} is agreed ({{planSummary}}). We will confirm enrolment once tuition is recorded.',
  },
  enrolled: {
    subject: 'Welcome to {{academyName}}: you are enrolled in {{courseTitle}}',
    body: `Dear {{firstName}},

Welcome to {{academyName}}! Your enrolment in {{courseTitle}} is confirmed. We are glad to have you learning with us.

Our team will share your class schedule shortly. If you need anything in the meantime, contact {{supportEmail}}.

${SIGN_OFF}`,
    shortBody: 'Banafix: welcome! Your enrolment in {{courseTitle}} is confirmed. We will share your class schedule shortly.',
  },
  feedback_request: {
    subject: 'How is it going at {{academyName}}?',
    body: `Dear {{firstName}},

You have been learning with us for a month now and we would love to hear how it is going. It takes two minutes: {{feedbackUrl}}

Prefer email? Write to {{feedbackEmail}}. If you are happy for us to quote your words on our website, just say so.

Thank you for helping us improve.

${SIGN_OFF}`,
    shortBody: 'Banafix: how is it going? Share your feedback in two minutes: {{feedbackUrl}}',
  },
  birthday_student: {
    subject: 'Happy Birthday, {{firstName}}! 🎉',
    body: `Dear {{fullName}},

Today we celebrate you! Keep making music and chasing your goals. We are so glad to have you learning with us. May your new year be full of growth, creativity and happy melodies.

${SIGN_OFF}`,
    shortBody: 'Happy Birthday, {{firstName}}! Wishing you a year full of music and joy. From all of us at Banafix.',
  },
  birthday_parent: {
    subject: 'Happy Birthday, {{firstName}}! 🎉',
    body: `Dear {{fullName}},

Thank you for being part of the {{academyName}} family. On your special day we celebrate you and the support you give to your children's musical journey. May your year ahead be filled with joy, music and beautiful moments.

${SIGN_OFF}`,
    shortBody: 'Happy Birthday, {{firstName}}! Thank you for being part of the Banafix family. Warmest wishes from all of us.',
  },
  new_month: {
    subject: 'A new month at {{academyName}}: {{monthName}} {{year}}',
    body: `Dear {{firstName}},

Welcome to {{monthName}}! Thank you for being part of the {{academyName}} family. Keep practising, keep playing, and if you need anything, reach us at {{supportEmail}}.

${SIGN_OFF}`,
    shortBody: 'Banafix: welcome to {{monthName}}! Thank you for being part of our family. Keep practising.',
  },
  feedback_admin_notice: {
    subject: 'New feedback from {{authorName}}',
    body: `{{authorName}} ({{relationship}}) left feedback via {{source}}.

Rating: {{rating}}
May be quoted publicly: {{allowTestimonial}}

{{feedbackText}}

Review it in the admin area: {{adminUrl}}`,
  },
  class_scheduled: {
    subject: 'Your class is scheduled - {{courseTitle}}',
    body: `Dear {{firstName}},

Your {{courseTitle}} class with {{instructorName}} is scheduled for {{classDate}} at {{classTime}}.

${SIGN_OFF}`,
    shortBody: 'Banafix: your {{courseTitle}} class with {{instructorName}} is on {{classDate}} at {{classTime}}.',
  },
  class_reminder: {
    subject: 'Reminder: your class is coming up - {{courseTitle}}',
    body: `Dear {{firstName}},

A reminder that your {{courseTitle}} class with {{instructorName}} is on {{classDate}} at {{classTime}}.

${SIGN_OFF}`,
    shortBody: 'Banafix reminder: your {{courseTitle}} class is on {{classDate}} at {{classTime}}.',
  },
}
