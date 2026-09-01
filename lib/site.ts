/**
 * Single source of truth for the public site's chrome: navigation, contact
 * channels and the shared CTA target.
 *
 * Contact details are transcribed from the "Banafix Redesign.dc.html" handoff,
 * which matches what the previous footer already shipped.
 */

export const SITE_PHONE_DISPLAY = "0903 856 3822"
export const SITE_PHONE_E164 = "+2349038563822"
export const SITE_PHONE_TEL = `tel:${SITE_PHONE_E164}`
export const SITE_WHATSAPP = "https://wa.me/2349038563822"

export const SITE_EMAIL = "info@banafix.com"
export const SITE_EMAIL_MAILTO = `mailto:${SITE_EMAIL}`

export const SITE_ADDRESS_LINES = [
  "32 Road 8, Greenland Estate,",
  "Olokonla Bus Stop, Eti-Osa, Lekki",
] as const

export const SITE_HOURS = "Mon–Fri 9am–8pm · Sat 8am–6pm"

/**
 * The header/footer "Book a free trial" CTA. There is no trial booking flow in
 * the app, so it lands on the contact form with the enquiry subject preset —
 * `subject=trial` is read by the contact form to preselect "Booking a free
 * trial", which is one of the options the handoff's own dropdown lists.
 */
export const TRIAL_HREF = "/contact?subject=trial"

/** The handoff's four-item primary nav, in order. */
export const PRIMARY_NAV = [
  { label: "Home", href: "/" },
  { label: "Courses", href: "/courses" },
  { label: "Tutors", href: "/tutors" },
  { label: "Contact", href: "/contact" },
] as const

/** Footer "POPULAR" column — deep-links into the courses filter. */
export const POPULAR_INSTRUMENTS = ["Piano", "Guitar", "Saxophone", "Violin"] as const

export const SOCIAL_LINKS = [
  { label: "f", href: "https://facebook.com", name: "Facebook" },
  { label: "ig", href: "https://instagram.com", name: "Instagram" },
  { label: "x", href: "https://twitter.com", name: "X" },
  { label: "yt", href: "https://youtube.com", name: "YouTube" },
] as const

/** ₦ formatting, matching the handoff's `NGN()` helper exactly. */
export function formatNaira(amount: number): string {
  return "₦" + Math.round(amount).toLocaleString("en-NG")
}
