/**
 * Email service for sending receipts and notifications
 * Using Resend for reliable email delivery
 */

import { Resend } from 'resend'
import { ApplicationFeeReceiptData, TuitionReceiptData, TuitionReceiptLedger } from './receipt'

const resend = new Resend(process.env.RESEND_API_KEY)

// Email configuration
const FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@banafix.com'
const SUPPORT_EMAIL = process.env.SUPPORT_EMAIL || 'support@banafix.com'
// Internal inbox for admin enrollment notifications. Falls back to the support
// address so notifications still land even if ADMIN_EMAIL is not set.
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || SUPPORT_EMAIL
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'

/**
 * Send assessment fee receipt email
 */
export async function sendApplicationFeeReceipt(
  data: ApplicationFeeReceiptData,
  receiptPDF: Buffer
): Promise<boolean> {
  try {
    const { enrollment, course, payment } = data

    const emailResult = await resend.emails.send({
      from: FROM_EMAIL,
      to: enrollment.email,
      subject: `Assessment Fee Receipt - ${course.title}`,
      html: generateApplicationFeeEmailHTML(data),
      attachments: [
        {
          filename: `assessment-fee-receipt-${data.receiptNumber}.pdf`,
          content: receiptPDF,
          contentType: 'application/pdf',
        },
      ],
    })

    if (emailResult.error) {
      console.error('Failed to send assessment fee receipt email:', emailResult.error)
      return false
    }

    console.log('Assessment fee receipt email sent successfully:', emailResult.data?.id)
    return true

  } catch (error) {
    console.error('Error sending assessment fee receipt email:', error)
    return false
  }
}

/**
 * Send tuition payment receipt email
 */
export async function sendTuitionReceipt(
  data: TuitionReceiptData,
  receiptPDF: Buffer
): Promise<boolean> {
  try {
    const { enrollment, course, payment } = data

    // TODO(S7): route this send through the communications outbox
    const emailResult = await resend.emails.send({
      from: FROM_EMAIL,
      to: enrollment.email,
      subject: `Tuition Payment Receipt - ${course.title}`,
      html: generateTuitionEmailHTML(data),
      attachments: [
        {
          filename: `tuition-receipt-${data.receiptNumber}.pdf`,
          content: receiptPDF,
          contentType: 'application/pdf',
        },
      ],
    })

    if (emailResult.error) {
      console.error('Failed to send tuition receipt email:', emailResult.error)
      return false
    }

    console.log('Tuition receipt email sent successfully:', emailResult.data?.id)

    // Best-effort admin copy of the same receipt (separate send, not a cc — the
    // student never sees the admin address). A failure here must not affect the
    // student send's success result.
    try {
      // TODO(S7): route this send through the communications outbox
      const adminCopy = await resend.emails.send({
        from: FROM_EMAIL,
        to: ADMIN_EMAIL,
        subject: `[Admin copy] Tuition Payment Receipt - ${course.title} (${enrollment.firstName} ${enrollment.lastName})`,
        html: generateTuitionEmailHTML(data),
        attachments: [
          {
            filename: `tuition-receipt-${data.receiptNumber}.pdf`,
            content: receiptPDF,
            contentType: 'application/pdf',
          },
        ],
      })
      if (adminCopy.error) {
        console.error('Failed to send admin copy of tuition receipt:', adminCopy.error)
      }
    } catch (adminError) {
      console.error('Error sending admin copy of tuition receipt:', adminError)
    }

    return true

  } catch (error) {
    console.error('Error sending tuition receipt email:', error)
    return false
  }
}

/**
 * Generate HTML email template for assessment fee receipt
 */
function generateApplicationFeeEmailHTML(data: ApplicationFeeReceiptData): string {
  const { enrollment, course, payment } = data

  return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Assessment Fee Receipt</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 20px; background-color: #f9fafb; }
            .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
            .header { background: #1e293b; color: white; padding: 30px; text-align: center; }
            .header h1 { margin: 0; font-size: 28px; font-weight: bold; }
            .header p { margin: 5px 0 0; opacity: 0.9; }
            .content { padding: 30px; }
            .receipt-info { background: #f1f5f9; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .receipt-info h3 { margin: 0 0 15px; color: #1e293b; }
            .info-row { display: flex; justify-content: space-between; margin: 8px 0; }
            .info-label { font-weight: bold; color: #64748b; }
            .amount-box { background: #f59e0b; color: white; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0; }
            .amount-box h3 { margin: 0 0 10px; font-size: 18px; }
            .amount-box .amount { font-size: 24px; font-weight: bold; }
            .footer { background: #f8fafc; padding: 20px; text-align: center; color: #64748b; font-size: 14px; }
            .btn { display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 10px 0; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>BANAFIX</h1>
                <p>Music Academy & Training Center</p>
            </div>

            <div class="content">
                <h2>Assessment Fee Receipt</h2>
                <p>Dear ${enrollment.firstName} ${enrollment.lastName},</p>
                <p>Thank you for paying your assessment fee! Your application has been received.</p>

                <div class="receipt-info">
                    <h3>Receipt Details</h3>
                    <div class="info-row">
                        <span class="info-label">Receipt Number:</span>
                        <span>${data.receiptNumber}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Payment Date:</span>
                        <span>${new Date(payment.paidAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Payment Reference:</span>
                        <span>${payment.reference}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Payment Method:</span>
                        <span>${payment.paymentMethod.toUpperCase()}</span>
                    </div>
                </div>

                <div class="receipt-info">
                    <h3>Course Information</h3>
                    <div class="info-row">
                        <span class="info-label">Course:</span>
                        <span>${course.title}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Instrument:</span>
                        <span>${course.instrument}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Level:</span>
                        <span>${course.level}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Duration:</span>
                        <span>${course.duration}</span>
                    </div>
                    ${course.instructor ? `
                    <div class="info-row">
                        <span class="info-label">Instructor:</span>
                        <span>${course.instructor}</span>
                    </div>
                    ` : ''}
                </div>

                <div class="amount-box">
                    <h3>Assessment Fee Paid</h3>
                    <div class="amount">₦${payment.amount.toLocaleString()}</div>
                    <p style="margin: 10px 0 0; opacity: 0.9;">Non-refundable assessment fee</p>
                </div>

                <h3>What's Next?</h3>
                <p>Your assessment fee is confirmed. Our admissions team will contact you within 24-48 hours to arrange your assessment. After the assessment we will agree your plan and tuition with you, and confirm your enrolment.</p>

                <p>Please keep this receipt for your records. A PDF copy is attached to this email.</p>

                <a href="${BASE_URL}/enroll/status/${enrollment.id}" class="btn">View Enrollment Status</a>
            </div>

            <div class="footer">
                <p>Questions? Contact us at ${SUPPORT_EMAIL}</p>
                <p>Banafix Music Academy - Building Musical Excellence</p>
            </div>
        </div>
    </body>
    </html>
  `
}

function naira(amount: number): string {
  return `₦${amount.toLocaleString()}`
}

/**
 * Per-class tuition receipt email (ledger enrollments). Every interpolated
 * string is HTML-escaped.
 */
function generateLedgerTuitionEmailHTML(data: TuitionReceiptData, ledger: TuitionReceiptLedger): string {
  const { enrollment, course, payment } = data
  const balance = data.remainingBalance ?? 0
  const paidInFull = data.paymentType === 'completed'
  const dateText = new Date(payment.paidAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })

  const lineRows = ledger.lines
    .map(
      (line) => `
                        <tr>
                            <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${escapeHtml(line.description)}</td>
                            <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; white-space: nowrap;">${line.quantity} x ${naira(line.unitPrice)}</td>
                            <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; text-align: right; white-space: nowrap;">${naira(line.amount)}</td>
                        </tr>`
    )
    .join('')

  return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Tuition Payment Receipt</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 20px; background-color: #f9fafb; }
            .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
            .header { background: #1e293b; color: white; padding: 30px; text-align: center; }
            .header h1 { margin: 0; font-size: 28px; font-weight: bold; }
            .header p { margin: 5px 0 0; opacity: 0.9; }
            .content { padding: 30px; }
            .receipt-info { background: #f1f5f9; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .receipt-info h3 { margin: 0 0 15px; color: #1e293b; }
            .info-row { display: flex; justify-content: space-between; margin: 8px 0; }
            .info-label { font-weight: bold; color: #64748b; }
            .charges { width: 100%; border-collapse: collapse; font-size: 14px; margin: 10px 0; }
            .charges th { text-align: left; padding: 8px; background: #f1f5f9; color: #1e293b; }
            .amount-box { background: #10b981; color: white; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0; }
            .amount-box h3 { margin: 0 0 10px; font-size: 18px; }
            .amount-box .amount { font-size: 24px; font-weight: bold; }
            .footer { background: #f8fafc; padding: 20px; text-align: center; color: #64748b; font-size: 14px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>BANAFIX</h1>
                <p>Music Academy & Training Center</p>
            </div>

            <div class="content">
                <h2>Tuition Payment Receipt</h2>
                <p>Dear ${escapeHtml(enrollment.firstName)} ${escapeHtml(enrollment.lastName)},</p>
                <p>Thank you for your tuition payment! This receipt confirms your payment for the ${escapeHtml(course.title)} course.</p>

                <div class="receipt-info">
                    <h3>Receipt Details</h3>
                    <div class="info-row">
                        <span class="info-label">Receipt Number:</span>
                        <span>${escapeHtml(data.receiptNumber)}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Payment Date:</span>
                        <span>${dateText}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Payment Method:</span>
                        <span>${escapeHtml(payment.paymentMethod.toUpperCase())}</span>
                    </div>
                    ${payment.description ? `
                    <div class="info-row">
                        <span class="info-label">Description:</span>
                        <span>${escapeHtml(payment.description)}</span>
                    </div>
                    ` : ''}
                </div>

                <div class="receipt-info">
                    <h3>Charges</h3>
                    <table class="charges">
                        <tr><th>Description</th><th>Qty x Rate</th><th style="text-align: right;">Amount</th></tr>${lineRows}
                    </table>
                    <div class="info-row">
                        <span class="info-label">Total charged:</span>
                        <span><strong>${naira(ledger.totalCharged)}</strong></span>
                    </div>
                </div>

                <div class="amount-box">
                    <h3>Amount Paid</h3>
                    <div class="amount">${naira(payment.amount)}</div>
                </div>

                <div class="receipt-info">
                    <h3>Payment Summary</h3>
                    <div class="info-row">
                        <span class="info-label">Status:</span>
                        <span><strong>${paidInFull ? 'Paid in full' : 'Part payment'}</strong></span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Total paid to date:</span>
                        <span><strong>${naira(data.totalPaid)}</strong></span>
                    </div>
                    ${ledger.credit > 0 ? `
                    <div class="info-row">
                        <span class="info-label">Credit:</span>
                        <span><strong>${naira(ledger.credit)}</strong></span>
                    </div>
                    ` : `
                    <div class="info-row">
                        <span class="info-label">Balance remaining:</span>
                        <span><strong>${naira(balance)}</strong></span>
                    </div>
                    `}
                    <div class="info-row">
                        <span class="info-label">Classes covered:</span>
                        <span><strong>${ledger.classesCovered} of ${ledger.classesPurchased}</strong></span>
                    </div>
                </div>

                <p>Your payment has been recorded successfully. Continue practicing and we look forward to seeing your progress!</p>

                <p>Please keep this receipt for your records. A PDF copy is attached to this email.</p>
            </div>

            <div class="footer">
                <p>Questions? Contact us at ${escapeHtml(SUPPORT_EMAIL)}</p>
                <p>Banafix Music Academy - Building Musical Excellence</p>
            </div>
        </div>
    </body>
    </html>
  `
}

/**
 * Generate HTML email template for tuition payment receipt
 */
export function generateTuitionEmailHTML(data: TuitionReceiptData): string {
  if (data.ledger) return generateLedgerTuitionEmailHTML(data, data.ledger)

  const { enrollment, course, payment } = data

  return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Tuition Payment Receipt</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 20px; background-color: #f9fafb; }
            .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
            .header { background: #1e293b; color: white; padding: 30px; text-align: center; }
            .header h1 { margin: 0; font-size: 28px; font-weight: bold; }
            .header p { margin: 5px 0 0; opacity: 0.9; }
            .content { padding: 30px; }
            .receipt-info { background: #f1f5f9; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .receipt-info h3 { margin: 0 0 15px; color: #1e293b; }
            .info-row { display: flex; justify-content: space-between; margin: 8px 0; }
            .info-label { font-weight: bold; color: #64748b; }
            .amount-box { background: #10b981; color: white; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0; }
            .amount-box h3 { margin: 0 0 10px; font-size: 18px; }
            .amount-box .amount { font-size: 24px; font-weight: bold; }
            .footer { background: #f8fafc; padding: 20px; text-align: center; color: #64748b; font-size: 14px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>BANAFIX</h1>
                <p>Music Academy & Training Center</p>
            </div>

            <div class="content">
                <h2>Tuition Payment Receipt</h2>
                <p>Dear ${enrollment.firstName} ${enrollment.lastName},</p>
                <p>Thank you for your tuition payment! This receipt confirms your payment for the ${course.title} course.</p>

                <div class="receipt-info">
                    <h3>Receipt Details</h3>
                    <div class="info-row">
                        <span class="info-label">Receipt Number:</span>
                        <span>${data.receiptNumber}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Payment Date:</span>
                        <span>${new Date(payment.paidAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Payment Method:</span>
                        <span>${payment.paymentMethod.toUpperCase()}</span>
                    </div>
                    ${payment.description ? `
                    <div class="info-row">
                        <span class="info-label">Description:</span>
                        <span>${payment.description}</span>
                    </div>
                    ` : ''}
                </div>

                <div class="amount-box">
                    <h3>Payment Amount</h3>
                    <div class="amount">₦${payment.amount.toLocaleString()}</div>
                </div>

                <div class="receipt-info">
                    <h3>Payment Summary</h3>
                    <div class="info-row">
                        <span class="info-label">Payment Type:</span>
                        <span><strong>${data.paymentType === 'partial' ? 'Part payment' : 'Full payment'}</strong></span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Total Paid to Date:</span>
                        <span><strong>₦${data.totalPaid.toLocaleString()}</strong></span>
                    </div>
                    ${data.remainingBalance !== undefined ? `
                    <div class="info-row">
                        <span class="info-label">Remaining Balance:</span>
                        <span><strong>₦${data.remainingBalance.toLocaleString()}</strong></span>
                    </div>
                    ` : ''}
                </div>

                <p>Your payment has been recorded successfully. Continue practicing and we look forward to seeing your progress!</p>

                <p>Please keep this receipt for your records. A PDF copy is attached to this email.</p>
            </div>

            <div class="footer">
                <p>Questions? Contact us at ${SUPPORT_EMAIL}</p>
                <p>Banafix Music Academy - Building Musical Excellence</p>
            </div>
        </div>
    </body>
    </html>
  `
}

/**
 * Send enrollment confirmation email (without payment)
 */
export async function sendEnrollmentConfirmation(
  enrollmentData: {
    firstName: string
    lastName: string
    email: string
    courseName: string
    enrollmentId: string
    applicationFee?: number
  }
): Promise<boolean> {
  try {
    const emailResult = await resend.emails.send({
      from: FROM_EMAIL,
      to: enrollmentData.email,
      subject: `Assessment Application Received - ${enrollmentData.courseName}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <title>Assessment Application Received</title>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: #1e293b; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
                .content { background: white; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px; }
                .btn { display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 10px 0; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>BANAFIX</h1>
                    <p>Music Academy & Training Center</p>
                </div>
                <div class="content">
                    <h2>Assessment Application Received</h2>
                    <p>Dear ${enrollmentData.firstName} ${enrollmentData.lastName},</p>
                    <p>Thank you for applying to <strong>${enrollmentData.courseName}</strong>!</p>
                    <p>Your application has been received. ${enrollmentData.applicationFee
                        ? `To book your assessment, please complete the assessment fee payment of <strong>₦${enrollmentData.applicationFee.toLocaleString()}</strong> on the secure payment page that opened when you submitted your application.`
                        : 'To book your assessment, please complete the assessment fee payment on the secure payment page that opened when you submitted your application.'}</p>
                    <p>Once your payment is confirmed we'll email you a receipt and our admissions team will contact you to arrange your assessment.</p>
                    <p>Enrollment ID: <strong>${enrollmentData.enrollmentId}</strong></p>
                    <p>If you didn't finish the payment or have any questions, just reply to this email or contact us at ${SUPPORT_EMAIL}.</p>
                </div>
            </div>
        </body>
        </html>
      `,
    })

    return !emailResult.error

  } catch (error) {
    console.error('Error sending enrollment confirmation email:', error)
    return false
  }
}

/**
 * Notify the admin/support inbox that a student has paid the assessment fee
 * (a new paid assessment application). Sent from the Paystack webhook alongside the student receipt.
 */
export async function sendAdminEnrollmentNotification(
  data: {
    enrollment: {
      id: string
      firstName: string
      lastName: string
      email: string
      phone?: string
      selectedMode?: string
    }
    course: {
      title: string
      instrument?: string
      level?: string
    }
    payment: {
      amount: number
      reference: string
      paidAt: string
      paymentMethod: string
    }
  }
): Promise<boolean> {
  try {
    const { enrollment, course, payment } = data

    const emailResult = await resend.emails.send({
      from: FROM_EMAIL,
      to: ADMIN_EMAIL,
      replyTo: enrollment.email,
      subject: `New paid assessment application: ${course.title} (${enrollment.firstName} ${enrollment.lastName})`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <title>New Paid Assessment Application</title>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: #1e293b; color: white; padding: 24px; text-align: center; border-radius: 8px 8px 0 0; }
                .content { background: white; padding: 24px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px; }
                .info-row { display: flex; justify-content: space-between; margin: 6px 0; border-bottom: 1px solid #f1f5f9; padding-bottom: 6px; }
                .info-label { font-weight: bold; color: #64748b; }
                .amount { color: #10b981; font-weight: bold; }
                .btn { display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 16px 0 0; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>BANAFIX</h1>
                    <p>New Paid Assessment Application</p>
                </div>
                <div class="content">
                    <p>A student has paid the assessment fee. Arrange their assessment from the admin dashboard.</p>
                    <div class="info-row"><span class="info-label">Student:</span><span>${enrollment.firstName} ${enrollment.lastName}</span></div>
                    <div class="info-row"><span class="info-label">Email:</span><span>${enrollment.email}</span></div>
                    ${enrollment.phone ? `<div class="info-row"><span class="info-label">Phone:</span><span>${enrollment.phone}</span></div>` : ''}
                    <div class="info-row"><span class="info-label">Course:</span><span>${course.title}</span></div>
                    ${course.instrument ? `<div class="info-row"><span class="info-label">Instrument:</span><span>${course.instrument}</span></div>` : ''}
                    ${course.level ? `<div class="info-row"><span class="info-label">Level:</span><span>${course.level}</span></div>` : ''}
                    ${enrollment.selectedMode ? `<div class="info-row"><span class="info-label">Delivery Mode:</span><span>${enrollment.selectedMode}</span></div>` : ''}
                    <div class="info-row"><span class="info-label">Amount Paid:</span><span class="amount">₦${payment.amount.toLocaleString()}</span></div>
                    <div class="info-row"><span class="info-label">Payment Method:</span><span>${payment.paymentMethod.toUpperCase()}</span></div>
                    <div class="info-row"><span class="info-label">Reference:</span><span>${payment.reference}</span></div>
                    <div class="info-row"><span class="info-label">Paid At:</span><span>${new Date(payment.paidAt).toLocaleString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span></div>
                    <a href="${BASE_URL}/admin/enrollments" class="btn">View in Admin Dashboard</a>
                </div>
            </div>
        </body>
        </html>
      `,
    })

    if (emailResult.error) {
      console.error('Failed to send admin enrollment notification:', emailResult.error)
      return false
    }

    return true

  } catch (error) {
    console.error('Error sending admin enrollment notification:', error)
    return false
  }
}

/**
 * Send a professional "happy birthday" email to a student or parent.
 * Best-effort — returns whether the send succeeded so the caller can decide
 * whether to record it (we only log successful sends, so failures retry).
 */
export async function sendBirthdayEmail(recipient: {
  name: string
  email: string
  type: 'student' | 'parent'
}): Promise<boolean> {
  try {
    const firstName = recipient.name.trim().split(/\s+/)[0] || recipient.name
    const emailResult = await resend.emails.send({
      from: FROM_EMAIL,
      to: recipient.email,
      subject: `Happy Birthday, ${firstName}! 🎉`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Happy Birthday from Banafix</title>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 20px; background-color: #f9fafb; }
                .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
                .header { background: linear-gradient(135deg, #f59e0b, #d98a1f); color: white; padding: 40px 30px; text-align: center; }
                .header h1 { margin: 0; font-size: 30px; }
                .content { padding: 30px; text-align: center; }
                .content h2 { color: #1e293b; }
                .footer { background: #f8fafc; padding: 20px; text-align: center; color: #64748b; font-size: 14px; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🎉 Happy Birthday, ${firstName}! 🎂</h1>
                    <p>From all of us at Banafix Music Academy</p>
                </div>
                <div class="content">
                    <h2>Wishing you a wonderful day</h2>
                    <p>Dear ${recipient.name},</p>
                    ${
                      recipient.type === 'parent'
                        ? `<p>Thank you for being part of the Banafix family. On your special day, we celebrate you and the support you give to your children's musical journey. May your year ahead be filled with joy, music, and beautiful moments.</p>`
                        : `<p>Today we celebrate you! Keep making music and chasing your goals. We're so glad to have you learning with us. May your new year be full of growth, creativity, and happy melodies.</p>`
                    }
                    <p style="margin-top: 24px; font-weight: bold; color: #d98a1f;">Warmest wishes,<br/>The Banafix Team</p>
                </div>
                <div class="footer">
                    <p>Banafix Music Academy, Building Musical Excellence</p>
                    <p>Questions? Contact us at ${SUPPORT_EMAIL}</p>
                </div>
            </div>
        </body>
        </html>
      `,
    })

    if (emailResult.error) {
      console.error('Failed to send birthday email:', emailResult.error)
      return false
    }
    return true
  } catch (error) {
    console.error('Error sending birthday email:', error)
    return false
  }
}
/**
 * Best-effort notice to the admin inbox: money arrived for an assessment fee the student had already
 * paid (or that a cash payment superseded). The refund is done by hand in the Paystack dashboard,
 * then recorded in admin ("Mark refunded").
 */
// Escape interpolated values: the covered-fee email goes to an address typed into a public form.
const escapeHtml = (value: string) =>
  value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;')

export async function sendAdminDuplicatePaymentNotice(data: {
  studentName: string
  studentEmail: string
  amount: number
  reference: string | null
  enrollmentId: string
  reason: 'already_covered' | 'superseded'
}): Promise<boolean> {
  try {
    const why =
      data.reason === 'superseded'
        ? 'a cash/offline fee was recorded for this application first'
        : 'the student had already paid the assessment fee'
    const emailResult = await resend.emails.send({
      from: FROM_EMAIL,
      to: ADMIN_EMAIL,
      subject: `Refund needed: duplicate assessment fee (${data.studentName.replace(/[\r\n]+/g, ' ')})`,
      html: `
        <p><strong>A duplicate assessment fee payment needs a refund.</strong></p>
        <p>${escapeHtml(data.studentName)} (${escapeHtml(data.studentEmail)}) paid ₦${data.amount.toLocaleString()} (Paystack reference ${escapeHtml(data.reference ?? 'n/a')}), but ${why}. The application was not changed.</p>
        <p>Refund it by hand in the Paystack dashboard, then open the enrollment in admin and choose Mark refunded.</p>
        <p>Enrollment: ${escapeHtml(data.enrollmentId)}</p>
      `,
    })
    if (emailResult.error) {
      console.error('Failed to send duplicate-payment notice:', emailResult.error)
      return false
    }
    return true
  } catch (error) {
    console.error('Error sending duplicate-payment notice:', error)
    return false
  }
}

/**
 * "Application received, fee already covered": sent instead of a receipt when a student who has
 * already paid the (once per student, non-refundable) assessment fee applies again.
 */
export async function sendApplicationFeeCovered(data: {
  firstName: string
  email: string
  courseName: string
}): Promise<boolean> {
  try {
    const emailResult = await resend.emails.send({
      from: FROM_EMAIL,
      to: data.email,
      subject: `Application received: ${data.courseName.replace(/[\r\n]+/g, ' ')}`,
      html: `
        <p>Hi ${escapeHtml(data.firstName)},</p>
        <p>We have received your application for <strong>${escapeHtml(data.courseName)}</strong>. You have already paid the assessment fee, so there is nothing to pay now.</p>
        <p>We will be in touch to arrange your assessment. Questions? Contact us at ${SUPPORT_EMAIL}.</p>
      `,
    })
    if (emailResult.error) {
      console.error('Failed to send fee-covered email:', emailResult.error)
      return false
    }
    return true
  } catch (error) {
    console.error('Error sending fee-covered email:', error)
    return false
  }
}

/** Best-effort admin notice: a fee was paid on an application that had already been cancelled. */
export async function sendAdminCancelledPaymentNotice(data: {
  studentName: string
  studentEmail: string
  amount: number
  enrollmentId: string
}): Promise<boolean> {
  try {
    const emailResult = await resend.emails.send({
      from: FROM_EMAIL,
      to: ADMIN_EMAIL,
      subject: `Assessment fee paid on a cancelled application (${data.studentName.replace(/[\r\n]+/g, ' ')})`,
      html: `
        <p><strong>An assessment fee arrived for a cancelled application.</strong></p>
        <p>${escapeHtml(data.studentName)} (${escapeHtml(data.studentEmail)}) paid ₦${data.amount.toLocaleString()}. The payment is recorded and covers this student's fee, but the application stays cancelled and no receipt was sent.</p>
        <p>Open the student in admin to decide what to do (for example, register them again; the fee will not be charged twice). Enrollment: ${escapeHtml(data.enrollmentId)}</p>
      `,
    })
    if (emailResult.error) {
      console.error('Failed to send cancelled-payment notice:', emailResult.error)
      return false
    }
    return true
  } catch (error) {
    console.error('Error sending cancelled-payment notice:', error)
    return false
  }
}
