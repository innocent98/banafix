/**
 * Receipt generation utilities for Banafix enrollment system
 * Handles PDF generation and email delivery for assessment fees (DB name: application fee) and tuition payments
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
  paymentType?: string // 'full' | 'partial' | 'completed' — shown as a label on the receipt
  /** Per-class ledger breakdown (Stream 5). Absent for legacy enrollments, which keep the old layout. */
  ledger?: TuitionReceiptLedger
}

export interface TuitionReceiptLine {
  kind: 'CLASSES' | 'MATERIAL'
  description: string
  quantity: number
  unitPrice: number
  amount: number
}

export interface TuitionReceiptLedger {
  lines: TuitionReceiptLine[]
  materialsTotal: number
  totalCharged: number
  classesPurchased: number
  classesCovered: number
  /** Paid beyond what is owed, as of this payment. */
  credit: number
}

/**
 * Generate Assessment Fee Receipt PDF
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
  doc.text('ASSESSMENT FEE RECEIPT', 20, 55)

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
  doc.text('Assessment Fee (Non-refundable):', 25, 235)
  doc.setFontSize(14)
  doc.text(`₦${data.payment.amount.toLocaleString()}`, 150, 235)

  // Footer
  doc.setTextColor(primaryColor)
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.text('This receipt confirms payment of your assessment fee.', 20, 260)
  doc.text('Please keep this receipt for your records. Contact support@banafix.com for any inquiries.', 20, 267)
  doc.text('Banafix Music Academy - Building Musical Excellence', 20, 274)

  // Convert to buffer
  return Buffer.from(doc.output('arraybuffer'))
}

/** Lowest y (mm) content may reach on an A4 page before a new page is added. */
const PDF_CONTENT_LIMIT_Y = 270

/**
 * Per-class ledger section of the tuition receipt: charges table, totals and
 * classes covered. Flows from y=190 and adds pages rather than overflowing.
 */
function renderLedgerSection(
  doc: jsPDF,
  data: TuitionReceiptData,
  ledger: TuitionReceiptLedger,
  colors: { primaryColor: string; accentColor: string; lightGray: string }
): void {
  const { primaryColor, accentColor, lightGray } = colors
  let y = 190

  const ensureSpace = (needed: number) => {
    if (y + needed > PDF_CONTENT_LIMIT_Y) {
      doc.addPage()
      y = 20
    }
  }

  // Charges table
  doc.setTextColor(primaryColor)
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text('CHARGES', 20, y)
  y += 6

  const drawTableHead = () => {
    doc.setFillColor(lightGray)
    doc.rect(20, y - 4.5, 170, 7, 'F')
    doc.setTextColor(primaryColor)
    doc.setFontSize(9)
    doc.setFont('helvetica', 'bold')
    doc.text('Description', 22, y)
    doc.text('Qty x Rate', 125, y)
    doc.text('Amount', 188, y, { align: 'right' })
    y += 7
  }
  drawTableHead()

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  for (const line of ledger.lines) {
    const descLines: string[] = doc.splitTextToSize(line.description, 98)
    const rowHeight = descLines.length * 4.5 + 2
    if (y + rowHeight > PDF_CONTENT_LIMIT_Y) {
      doc.addPage()
      y = 20
      drawTableHead()
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(9)
    }
    doc.setTextColor(primaryColor)
    doc.text(descLines, 22, y)
    doc.text(`${line.quantity} x ${formatCurrency(line.unitPrice)}`, 125, y)
    doc.text(formatCurrency(line.amount), 188, y, { align: 'right' })
    y += rowHeight
  }

  // Totals block
  const balance = data.remainingBalance ?? 0
  const hasCredit = ledger.credit > 0
  const paymentTypeLabel = data.paymentType === 'completed' ? 'Paid in full' : 'Part payment'
  const rows: Array<[string, string, boolean]> = [
    ['Total charged', formatCurrency(ledger.totalCharged), false],
    ['Amount paid', formatCurrency(data.payment.amount), true],
    ['Total paid to date', formatCurrency(data.totalPaid), false],
    hasCredit
      ? ['Credit', formatCurrency(ledger.credit), false]
      : ['Balance remaining', formatCurrency(balance), false],
    ['Classes covered', `${ledger.classesCovered} of ${ledger.classesPurchased}`, false],
  ]
  const blockHeight = 14 + (rows.length + (data.payment.description ? 1 : 0)) * 7 + 7 + 4
  y += 4
  ensureSpace(blockHeight)

  doc.setFillColor(accentColor)
  doc.rect(20, y, 170, blockHeight, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12)
  doc.text('PAYMENT DETAILS', 25, y + 8)
  let ty = y + 16

  doc.setFontSize(10)
  if (data.payment.description) {
    doc.setFont('helvetica', 'normal')
    const descText: string[] = doc.splitTextToSize(`Description: ${data.payment.description}`, 160)
    doc.text(descText[0], 25, ty)
    ty += 7
  }
  for (const [label, value, emphasise] of rows) {
    doc.setFont('helvetica', emphasise ? 'bold' : 'normal')
    doc.setFontSize(emphasise ? 12 : 10)
    doc.text(label, 25, ty)
    doc.text(value, 185, ty, { align: 'right' })
    ty += 7
  }
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.text('Status', 25, ty)
  doc.text(paymentTypeLabel, 185, ty, { align: 'right' })
  y += blockHeight

  // Footer
  y += 8
  ensureSpace(20)
  doc.setTextColor(primaryColor)
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.text('This receipt confirms your tuition payment. Thank you for choosing Banafix Music Academy.', 20, y)
  doc.text('Contact support@banafix.com for any inquiries about your payment or course.', 20, y + 7)
  doc.text('Banafix Music Academy - Building Musical Excellence', 20, y + 14)
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

  if (data.ledger) {
    renderLedgerSection(doc, data, data.ledger, { primaryColor, accentColor, lightGray })
    return Buffer.from(doc.output('arraybuffer'))
  }

  // Payment Details
  doc.setFillColor(accentColor)
  doc.rect(20, 190, 170, 54, 'F')

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

  // Payment type (Full / Part) and remaining balance
  doc.setFontSize(10)
  const paymentTypeLabel = data.paymentType === 'partial' ? 'Part payment' : 'Full payment'
  doc.text('Payment Type:', 25, 231)
  doc.text(paymentTypeLabel, 130, 231)

  if (data.remainingBalance !== undefined) {
    doc.text('Balance Remaining:', 25, 238)
    doc.setFontSize(12)
    doc.text(`₦${data.remainingBalance.toLocaleString()}`, 130, 238)
  }

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