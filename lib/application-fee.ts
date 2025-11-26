/**
 * Application Fee Calculator
 * Calculates application fees based on course location
 */

export interface ApplicationFeeResult {
  amount: number
  currency: string
  location: string
}

/**
 * Calculate application fee based on course location
 * 
 * Fee Structure:
 * - Lagos, Abuja, or Online: ₦5,000
 * - Other locations (Ondo, Akure, etc.): ₦2,000
 * - Diaspora/International: ₦8,000 (converted from $5 USD)
 * 
 * @param courseLocation - The location where the course is held
 * @returns ApplicationFeeResult with amount in Naira and currency
 */
export function calculateApplicationFee(courseLocation: string): ApplicationFeeResult {
  const location = courseLocation.toLowerCase().trim()
  
  // Lagos, Abuja, or Online courses
  if (location === 'lagos' || location === 'abuja' || location === 'online') {
    return {
      amount: 5000,
      currency: 'NGN',
      location: courseLocation,
    }
  }
  
  // Diaspora/International courses
  if (location === 'diaspora' || location === 'international') {
    return {
      amount: 8000, // ₦8,000 (converted from $5 USD)
      currency: 'NGN',
      location: courseLocation,
    }
  }
  
  // All other locations (Ondo, Akure, etc.)
  return {
    amount: 2000,
    currency: 'NGN',
    location: courseLocation,
  }
}

/**
 * Format application fee for display
 * @param amount - Amount in Naira
 * @returns Formatted string with currency symbol
 */
export function formatApplicationFee(amount: number): string {
  return `₦${amount.toLocaleString()}`
}

/**
 * Get application fee description based on location
 * @param courseLocation - The location where the course is held
 * @returns Description string
 */
export function getApplicationFeeDescription(courseLocation: string): string {
  const { amount } = calculateApplicationFee(courseLocation)
  const location = courseLocation.toLowerCase().trim()
  
  if (location === 'lagos' || location === 'abuja' || location === 'online') {
    return `Application fee for ${courseLocation} courses: ${formatApplicationFee(amount)}`
  }
  
  if (location === 'diaspora' || location === 'international') {
    return `Application fee for international students: ${formatApplicationFee(amount)}`
  }
  
  return `Application fee: ${formatApplicationFee(amount)}`
}
