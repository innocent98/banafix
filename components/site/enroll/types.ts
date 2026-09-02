/**
 * Types and option tables for the redesigned enrolment wizard.
 *
 * The option VALUES here are the contract with the server and the admin UI —
 * `Enrollment.priorLevel` and `Enrollment.schedulePreference` are stored raw and
 * rendered raw in /admin. Only the LABELS were softened to the handoff's voice.
 * Never change a value without changing the admin renderer too.
 */

/**
 * Shape of `GET /api/courses/[id]` → `course`, narrowed to what the wizard uses.
 *
 * Note the field name: the API maps Prisma's `Course.availableModes` to `modes`
 * (app/api/courses/[id]/route.ts:47). `modes` here IS `availableModes`, which is
 * what `POST /api/enrollments` validates `selectedMode` against.
 */
export interface EnrollCourse {
  id: string
  title: string
  instrument: string
  level: string
  duration: string
  location: string
  session: string | null
  sessionStartDate: string | null
  modes: string[]
  pricing: Record<string, number> | null
  price: number
  totalSeats: number
  seatsLeft: number
  unlimitedSeats: boolean
  image: string | null
  instructor: { name: string } | null
}

/**
 * The POST body for `/api/enrollments`, unchanged from the outgoing flow.
 * Every key the route destructures is present, including the ones no screen
 * collects (they were sent empty before this redesign too).
 */
export interface EnrollFormData {
  firstName: string
  lastName: string
  email: string
  phone: string
  dateOfBirth: string
  address: string
  landmark: string
  city: string
  state: string
  guardianName: string
  guardianPhone: string
  guardianEmail: string
  selectedMode: string
  priorLevel: string
  schedulePreference: string
  preferredDays: string[]
  musicExperience: string
  goals: string
  specialRequests: string
  couponCode: string
  consentToEmails: boolean
  paymentMethod: string
  installmentPlan: boolean
  billingAddress: string
  billingCity: string
  billingState: string
  billingCountry: string
  agreeToTerms: boolean
  agreeToRefundPolicy: boolean
  agreeToMarketing: boolean
  waitlistNotes: string
}

export const EMPTY_FORM: EnrollFormData = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  dateOfBirth: "",
  address: "",
  landmark: "",
  city: "",
  state: "",
  guardianName: "",
  guardianPhone: "",
  guardianEmail: "",
  selectedMode: "",
  priorLevel: "",
  schedulePreference: "",
  preferredDays: [],
  musicExperience: "",
  goals: "",
  specialRequests: "",
  couponCode: "",
  consentToEmails: false,
  // Card entry happens entirely on Paystack's hosted checkout; the server
  // overwrites this with 'pending' and fills it from the webhook.
  paymentMethod: "paystack",
  installmentPlan: false,
  billingAddress: "",
  billingCity: "",
  billingState: "",
  billingCountry: "Nigeria",
  agreeToTerms: false,
  agreeToRefundPolicy: false,
  agreeToMarketing: false,
  waitlistNotes: "",
}

/** `Enrollment.priorLevel`. Values are fixed; labels follow the handoff. */
export const PRIOR_LEVEL_OPTIONS = [
  { value: "complete-beginner", label: "Complete beginner" },
  { value: "some-experience", label: "Some experience (1-2 years)" },
  { value: "intermediate", label: "Intermediate (3-5 years)" },
  { value: "advanced", label: "Advanced (5+ years)" },
] as const

/** `Enrollment.schedulePreference`. All six values the admin UI can receive. */
export const SCHEDULE_OPTIONS = [
  { value: "weekday-morning", label: "Weekday mornings, 9am to 12pm" },
  { value: "weekday-afternoon", label: "Weekday afternoons, 1pm to 5pm" },
  { value: "weekday-evening", label: "Weekday evenings, 6pm to 9pm" },
  { value: "weekend-morning", label: "Weekend mornings, 9am to 12pm" },
  { value: "weekend-afternoon", label: "Weekend afternoons, 1pm to 5pm" },
  { value: "flexible", label: "Flexible" },
] as const

export const HOME_TRAINING_MODE = "Home Training"

export const WEEKDAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
] as const

/**
 * The payment channels this app actually asks Paystack to offer:
 * `lib/paystack.ts:280` sends `channels: ['card', 'bank', 'ussd', 'bank_transfer']`.
 * The student picks one on Paystack's hosted page, so this list is informational.
 * No settlement-time or card-brand claims: the code makes none.
 */
export const PAYSTACK_CHANNELS = ["Card", "Bank transfer", "USSD"] as const

export const STEP_NAMES = ["Your details", "Format", "Payment"] as const
