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
                    <p>Your application has been received and is being processed. To complete your enrollment, please proceed with the application fee payment of <strong>₦2,000</strong>.</p>
                    <p>Enrollment ID: <strong>${enrollmentData.enrollmentId}</strong></p>
                    <a href="${BASE_URL}/enroll/payment/${enrollmentData.enrollmentId}" class="btn">Complete Payment</a>
                    <p>If you have any questions, please contact us at ${SUPPORT_EMAIL}</p>
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