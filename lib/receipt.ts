/**
 * Receipt generation utilities for Banafix enrollment system
 * Handles PDF generation and email delivery for application fees and tuition payments
 */

import jsPDF from 'jspdf'

// Types for receipt data
export interface ApplicationFeeReceiptData {
  receiptNumber: string
  enrollment: {
    id: string
    firstName: string
    lastName: string
    email: string
    phone?: string
    createdAt: string
  }
  course: {
    title: string
    instrument: string
    level: string
    duration: string
    instructor?: string
    sessionStartDate?: string
  }
  payment: {
    amount: number
    paidAt: string
    reference: string
    paymentMethod: string
  }
}

export interface TuitionReceiptData {
  receiptNumber: string
  enrollment: {
    id: string
    firstName: string
    lastName: string
    email: string
    phone?: string
  }
  course: {
    title: string
    instrument: string
    level: string
    instructor?: string
  }
  payment: {
    amount: number
    paidAt: string
    description?: string
    paymentMethod: string
  }
  totalPaid: number
  remainingBalance?: number
}

/**
 * Generate Application Fee Receipt PDF
 */
export function generateApplicationFeeReceiptPDF(data: ApplicationFeeReceiptData): Buffer {
  const doc = new jsPDF()

  // Colors
  const primaryColor = '#1e293b' // slate-800
  const accentColor = '#f59e0b' // amber-500
  const lightGray = '#f1f5f9' // slate-100

  // Header - Company Info
  doc.setFillColor(primaryColor)
  doc.rect(0, 0, 210, 40, 'F')

  doc.setTextColor(255, 255, 255)
  doc.setFontSize(24)
  doc.setFont('helvetica', 'bold')
  doc.text('BANAFIX', 20, 25)

  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text('Music Academy & Training Center', 20, 32)

  // Receipt Title
  doc.setTextColor(primaryColor)
  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  doc.text('APPLICATION FEE RECEIPT', 20, 55)

  // Receipt Info Box
  doc.setFillColor(lightGray)
  doc.rect(20, 65, 170, 25, 'F')

  doc.setTextColor(primaryColor)
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.text('Receipt Number:', 25, 75)
  doc.text('Date Issued:', 25, 82)

  doc.setFont('helvetica', 'normal')
  doc.text(data.receiptNumber, 70, 75)
  doc.text(new Date(data.payment.paidAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }), 70, 82)

  doc.setFont('helvetica', 'bold')
  doc.text('Payment Reference:', 120, 75)
  doc.text('Payment Method:', 120, 82)

  doc.setFont('helvetica', 'normal')
  doc.text(data.payment.reference, 165, 75)
  doc.text(data.payment.paymentMethod.toUpperCase(), 165, 82)

  // Student Information
  doc.setTextColor(primaryColor)
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text('STUDENT INFORMATION', 20, 105)

  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text(`Name: ${data.enrollment.firstName} ${data.enrollment.lastName}`, 20, 115)
  doc.text(`Email: ${data.enrollment.email}`, 20, 122)
  if (data.enrollment.phone) {
    doc.text(`Phone: ${data.enrollment.phone}`, 20, 129)
  }
  doc.text(`Enrollment ID: ${data.enrollment.id}`, 20, 136)

  // Course Information
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text('COURSE INFORMATION', 20, 155)

  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text(`Course: ${data.course.title}`, 20, 165)
  doc.text(`Instrument: ${data.course.instrument}`, 20, 172)
  doc.text(`Level: ${data.course.level}`, 20, 179)
  doc.text(`Duration: ${data.course.duration}`, 20, 186)
  if (data.course.instructor) {
    doc.text(`Instructor: ${data.course.instructor}`, 20, 193)
  }
  if (data.course.sessionStartDate) {
    doc.text(`Session Start: ${new Date(data.course.sessionStartDate).toLocaleDateString()}`, 20, 200)
  }

  // Payment Summary
  doc.setFillColor(accentColor)
  doc.rect(20, 215, 170, 30, 'F')

  doc.setTextColor(255, 255, 255)
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text('PAYMENT SUMMARY', 25, 227)

  doc.setFontSize(10)
  doc.text('Application Fee (Non-refundable):', 25, 235)
  doc.setFontSize(14)
  doc.text(`₦${data.payment.amount.toLocaleString()}`, 150, 235)

  // Footer
  doc.setTextColor(primaryColor)
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.text('This receipt confirms payment of your application fee for course enrollment.', 20, 260)
  doc.text('Please keep this receipt for your records. Contact support@banafix.com for any inquiries.', 20, 267)
  doc.text('Banafix Music Academy - Building Musical Excellence', 20, 274)

  // Convert to buffer
  return Buffer.from(doc.output('arraybuffer'))
}

/**
 * Generate Tuition Payment Receipt PDF
 */
export function generateTuitionReceiptPDF(data: TuitionReceiptData): Buffer {
  const doc = new jsPDF()

  // Colors
  const primaryColor = '#1e293b' // slate-800
  const accentColor = '#10b981' // emerald-500
  const lightGray = '#f1f5f9' // slate-100

  // Header - Company Info
  doc.setFillColor(primaryColor)
  doc.rect(0, 0, 210, 40, 'F')

  doc.setTextColor(255, 255, 255)
  doc.setFontSize(24)
  doc.setFont('helvetica', 'bold')
  doc.text('BANAFIX', 20, 25)

  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text('Music Academy & Training Center', 20, 32)

  // Receipt Title
  doc.setTextColor(primaryColor)
  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  doc.text('TUITION PAYMENT RECEIPT', 20, 55)

  // Receipt Info Box
  doc.setFillColor(lightGray)
  doc.rect(20, 65, 170, 25, 'F')

  doc.setTextColor(primaryColor)
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.text('Receipt Number:', 25, 75)
  doc.text('Date Issued:', 25, 82)

  doc.setFont('helvetica', 'normal')
  doc.text(data.receiptNumber, 70, 75)
  doc.text(new Date(data.payment.paidAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }), 70, 82)

  doc.setFont('helvetica', 'bold')
  doc.text('Payment Method:', 120, 75)
  doc.text('Enrollment ID:', 120, 82)

  doc.setFont('helvetica', 'normal')
  doc.text(data.payment.paymentMethod.toUpperCase(), 165, 75)
  doc.text(data.enrollment.id.slice(-8), 165, 82)

  // Student Information
  doc.setTextColor(primaryColor)
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text('STUDENT INFORMATION', 20, 105)

  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text(`Name: ${data.enrollment.firstName} ${data.enrollment.lastName}`, 20, 115)
  doc.text(`Email: ${data.enrollment.email}`, 20, 122)
  if (data.enrollment.phone) {
    doc.text(`Phone: ${data.enrollment.phone}`, 20, 129)
  }

  // Course Information
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text('COURSE INFORMATION', 20, 145)

  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text(`Course: ${data.course.title}`, 20, 155)
  doc.text(`Instrument: ${data.course.instrument}`, 20, 162)
  doc.text(`Level: ${data.course.level}`, 20, 169)
  if (data.course.instructor) {
    doc.text(`Instructor: ${data.course.instructor}`, 20, 176)
  }

  // Payment Details
  doc.setFillColor(accentColor)
  doc.rect(20, 190, 170, 40, 'F')

  doc.setTextColor(255, 255, 255)
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text('PAYMENT DETAILS', 25, 202)

  doc.setFontSize(10)
  if (data.payment.description) {
    doc.text(`Description: ${data.payment.description}`, 25, 210)
  }
  doc.text('Amount Paid:', 25, 217)
  doc.setFontSize(14)
  doc.text(`₦${data.payment.amount.toLocaleString()}`, 130, 217)

  doc.setFontSize(10)
  doc.text('Total Paid to Date:', 25, 224)
  doc.setFontSize(12)
  doc.text(`₦${data.totalPaid.toLocaleString()}`, 130, 224)

  // Footer
  doc.setTextColor(primaryColor)
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.text('This receipt confirms your tuition payment. Thank you for choosing Banafix Music Academy.', 20, 250)
  doc.text('Contact support@banafix.com for any inquiries about your payment or course.', 20, 257)
  doc.text('Banafix Music Academy - Building Musical Excellence', 20, 264)

  // Convert to buffer
  return Buffer.from(doc.output('arraybuffer'))
}

/**
 * Generate unique receipt number
 */
export function generateReceiptNumber(type: 'APP' | 'TUI'): string {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 6).toUpperCase()
  return `${type}-${timestamp}-${random}`
}

/**
 * Format currency for display
 */
export function formatCurrency(amount: number): string {
  return `₦${amount.toLocaleString()}`
}