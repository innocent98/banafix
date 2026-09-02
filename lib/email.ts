/**
 * Email service for sending receipts and notifications
 * Using Resend for reliable email delivery
 */

import { Resend } from 'resend'
import { ApplicationFeeReceiptData, TuitionReceiptData } from './receipt'

const resend = new Resend(process.env.RESEND_API_KEY)

// Email configuration
const FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@banafix.com'
const SUPPORT_EMAIL = process.env.SUPPORT_EMAIL || 'support@banafix.com'
// Internal inbox for admin enrollment notifications. Falls back to the support
// address so notifications still land even if ADMIN_EMAIL is not set.
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || SUPPORT_EMAIL
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'

/**
 * Send application fee receipt email
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
      subject: `Application Fee Receipt - ${course.title}`,
      html: generateApplicationFeeEmailHTML(data),
      attachments: [
        {
          filename: `application-fee-receipt-${data.receiptNumber}.pdf`,
          content: receiptPDF,
          contentType: 'application/pdf',
        },
      ],
    })

    if (emailResult.error) {
      console.error('Failed to send application fee receipt email:', emailResult.error)
      return false
    }

    console.log('Application fee receipt email sent successfully:', emailResult.data?.id)
    return true

  } catch (error) {
    console.error('Error sending application fee receipt email:', error)
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
 * Generate HTML email template for application fee receipt
 */
function generateApplicationFeeEmailHTML(data: ApplicationFeeReceiptData): string {
  const { enrollment, course, payment } = data

  return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Application Fee Receipt</title>
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
                <h2>Application Fee Receipt</h2>
                <p>Dear ${enrollment.firstName} ${enrollment.lastName},</p>
                <p>Thank you for your application fee payment! Your enrollment application has been successfully processed.</p>

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
                    <h3>Application Fee Paid</h3>
                    <div class="amount">₦${payment.amount.toLocaleString()}</div>
                    <p style="margin: 10px 0 0; opacity: 0.9;">Non-refundable enrollment fee</p>
                </div>

                <h3>What's Next?</h3>
                <p>Your application has been confirmed! Our admissions team will contact you within 24-48 hours with:</p>
                <ul>
                    <li>Course schedule and session details</li>
                    <li>Tuition payment information</li>
                    <li>Pre-course preparation materials</li>
                    <li>Contact information for your instructor</li>
                </ul>

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

/**
 * Generate HTML email template for tuition payment receipt
 */
function generateTuitionEmailHTML(data: TuitionReceiptData): string {
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
      subject: `Enrollment Application Received - ${enrollmentData.courseName}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <title>Enrollment Application Received</title>
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
                    <h2>Enrollment Application Received</h2>
                    <p>Dear ${enrollmentData.firstName} ${enrollmentData.lastName},</p>
                    <p>Thank you for applying to <strong>${enrollmentData.courseName}</strong>!</p>
                    <p>Your application has been received. ${enrollmentData.applicationFee
                        ? `To secure your place, please complete the registration fee payment of <strong>₦${enrollmentData.applicationFee.toLocaleString()}</strong> on the secure payment page that opened when you submitted your application.`
                        : 'To secure your place, please complete the registration fee payment on the secure payment page that opened when you submitted your application.'}</p>
                    <p>Once your payment is confirmed we'll email you a receipt and our admissions team will follow up with your schedule details.</p>
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
 * Notify the admin/support inbox that a student has paid the registration fee
 * and enrolled. Sent from the Paystack webhook alongside the student receipt.
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
      subject: `New paid enrollment: ${course.title} (${enrollment.firstName} ${enrollment.lastName})`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <title>New Paid Enrollment</title>
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
                    <p>New Paid Enrollment</p>
                </div>
                <div class="content">
                    <p>A student has completed their registration payment and is now enrolled.</p>
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