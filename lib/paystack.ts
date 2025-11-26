/**
 * Paystack HTTP API utilities for payment processing
 * Using direct HTTP calls instead of SDK for better control and lighter dependencies
 */

// Types for Paystack API responses
export interface PaystackInitializeResponse {
  status: boolean
  message: string
  data: {
    authorization_url: string
    access_code: string
    reference: string
  }
}

export interface PaystackVerifyResponse {
  status: boolean
  message: string
  data: {
    id: number
    domain: string
    status: 'success' | 'failed' | 'abandoned'
    reference: string
    amount: number
    message: string | null
    gateway_response: string
    paid_at: string | null
    created_at: string
    channel: string
    currency: string
    ip_address: string
    metadata: {
      custom_fields?: Array<{
        display_name: string
        variable_name: string
        value: string
      }>
    }
    log: {
      start_time: number
      time_spent: number
      attempts: number
      errors: number
      success: boolean
      mobile: boolean
      input: any[]
      history: Array<{
        type: string
        message: string
        time: number
      }>
    }
    fees: number
    fees_split: any
    authorization: {
      authorization_code: string
      bin: string
      last4: string
      exp_month: string
      exp_year: string
      channel: string
      card_type: string
      bank: string
      country_code: string
      brand: string
      reusable: boolean
      signature: string
      account_name: string | null
    }
    customer: {
      id: number
      first_name: string
      last_name: string
      email: string
      customer_code: string
      phone: string | null
      metadata: any
      risk_action: string
      international_format_phone: string | null
    }
    plan: any
    split: any
    order_id: any
    paidAt: string
    createdAt: string
    requested_amount: number
    pos_transaction_data: any
    source: any
    fees_breakdown: any
  }
}

export interface PaystackCustomer {
  email: string
  first_name: string
  last_name: string
  phone?: string
  metadata?: {
    enrollment_id?: string
    course_id?: string
    [key: string]: any
  }
}

export interface PaystackTransaction {
  email: string
  amount: number // Amount in kobo (multiply by 100)
  currency?: string
  reference?: string
  callback_url?: string
  metadata?: {
    enrollment_id?: string
    course_id?: string
    payment_type?: 'application_fee' | 'tuition'
    [key: string]: any
  }
  channels?: string[]
}

/**
 * Paystack API configuration
 */
const PAYSTACK_BASE_URL = 'https://api.paystack.co'
const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY
const PAYSTACK_PUBLIC_KEY = process.env.PAYSTACK_PUBLIC_KEY

if (!PAYSTACK_SECRET_KEY) {
  console.warn('PAYSTACK_SECRET_KEY not found in environment variables')
}

/**
 * Make authenticated request to Paystack API
 */
async function paystackRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${PAYSTACK_BASE_URL}${endpoint}`

  const response = await fetch(url, {
    ...options,
    headers: {
      'Authorization': `Bearer ${PAYSTACK_SECRET_KEY}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error(`Paystack API Error: ${data.message || 'Unknown error'}`)
  }

  return data
}

/**
 * Initialize a payment transaction
 */
export async function initializePayment(
  transactionData: PaystackTransaction
): Promise<PaystackInitializeResponse> {
  return paystackRequest<PaystackInitializeResponse>('/transaction/initialize', {
    method: 'POST',
    body: JSON.stringify({
      ...transactionData,
      amount: transactionData.amount * 100, // Convert to kobo
      currency: transactionData.currency || 'NGN',
    }),
  })
}

/**
 * Verify a payment transaction
 */
export async function verifyPayment(
  reference: string
): Promise<PaystackVerifyResponse> {
  return paystackRequest<PaystackVerifyResponse>(`/transaction/verify/${reference}`)
}

/**
 * Create a customer
 */
export async function createCustomer(
  customerData: PaystackCustomer
): Promise<any> {
  return paystackRequest('/customer', {
    method: 'POST',
    body: JSON.stringify(customerData),
  })
}

/**
 * Generate unique payment reference
 */
export function generatePaymentReference(prefix: string = 'banafix'): string {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 8)
  return `${prefix}_${timestamp}_${random}`
}

/**
 * Convert kobo to naira
 */
export function koboToNaira(kobo: number): number {
  return kobo / 100
}

/**
 * Convert naira to kobo
 */
export function nairaToKobo(naira: number): number {
  return naira * 100
}

/**
 * Format amount for display
 */
export function formatAmount(amount: number, currency: string = 'NGN'): string {
  if (currency === 'NGN') {
    return `₦${amount.toLocaleString()}`
  }
  return `${currency} ${amount.toLocaleString()}`
}

/**
 * Validate Paystack webhook signature
 */
export function validateWebhookSignature(
  payload: string,
  signature: string
): boolean {
  const crypto = require('crypto')
  const hash = crypto
    .createHmac('sha512', PAYSTACK_SECRET_KEY)
    .update(payload, 'utf8')
    .digest('hex')

  return hash === signature
}

/**
 * Get Paystack public key for frontend
 */
export function getPaystackPublicKey(): string | undefined {
  return PAYSTACK_PUBLIC_KEY
}

/**
 * Create application fee payment data (location-based pricing)
 */
export function createApplicationFeePayment(enrollmentData: {
  email: string
  firstName: string
  lastName: string
  enrollmentId: string
  courseId: string
  applicationFee: number // Amount in Naira
}): PaystackTransaction {
  return {
    email: enrollmentData.email,
    amount: enrollmentData.applicationFee, // Location-based application fee
    currency: 'NGN',
    reference: generatePaymentReference('app_fee'),
    callback_url: `${process.env.NEXT_PUBLIC_BASE_URL}/enroll/success`,
    metadata: {
      enrollment_id: enrollmentData.enrollmentId,
      course_id: enrollmentData.courseId,
      payment_type: 'application_fee',
      student_name: `${enrollmentData.firstName} ${enrollmentData.lastName}`,
    },
    channels: ['card', 'bank', 'ussd', 'bank_transfer'], // Paystack-supported channels only
  }
}