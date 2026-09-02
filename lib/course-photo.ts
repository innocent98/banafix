/**
 * Fallback course photography, keyed by instrument.
 *
 * `Course.image` is null for four of the five published courses, so without a
 * fallback almost every card renders the designed gradient empty state. These
 * fill that gap with a real photograph of the actual instrument.
 *
 * An admin-uploaded `course.image` ALWAYS wins. This is only the fallback.
 *
 * Every entry below was verified by downloading the file and looking at it,
 * not by trusting the id. That check mattered: the id originally earmarked for
 * saxophone turned out to be a photograph of a trumpet, and is now filed
 * correctly under `trumpet`.
 *
 * Instruments with no verified photograph are deliberately absent. They fall
 * through to `MediaSlot`'s gradient-and-glyph empty state, which is a designed
 * state, rather than borrowing a picture of the wrong instrument.
 */

export interface CoursePhoto {
  src: string
  /** Attribution, per the Unsplash licence. */
  credit: string
  creditHref: string
}

function unsplash(id: string, photographer: string, handle: string): CoursePhoto {
  return {
    src: `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1400&q=70`,
    credit: `Photo by ${photographer} on Unsplash`,
    creditHref: `https://unsplash.com/@${handle}`,
  }
}

/** Keys are lowercased `Course.instrument` values. */
const INSTRUMENT_PHOTOS: Record<string, CoursePhoto> = {
  piano: unsplash("photo-1552422535-c45813c61732", "Jordan Whitfield", "whitfieldjordan"),
  guitar: unsplash("photo-1593697972672-b1c1902219e4", "Soundtrap", "soundtrap"),
  violin: unsplash("photo-1465847899084-d164df4dedc6", "Larisa Birta", "larisabirta"),
  drums: unsplash("photo-1461784121038-f088ca1e7714", "Gabriel Barletta", "gabebarletta"),
  vocals: unsplash("photo-1415886541506-6efc5e4b1786", "aiden marples", "aidenmarples"),
  saxophone: unsplash("photo-1484712548363-bad7b2ff3878", "Zachary Nelson", "zacharytnelson"),
  // Trumpet: a verified trumpet photograph exists at
  // photo-1573871669414-010dbf73ca84, but its photographer could not be
  // confirmed, so it is left out rather than shipped with invented
  // attribution. No trumpet course exists today.
}

/** The verified stock photograph for an instrument, or null if there isn't one. */
export function instrumentPhoto(instrument: string | null | undefined): CoursePhoto | null {
  if (!instrument) return null
  return INSTRUMENT_PHOTOS[instrument.trim().toLowerCase()] ?? null
}

/**
 * The image to render for a course: the admin's upload if there is one,
 * otherwise the verified stock photo for its instrument, otherwise null so the
 * caller falls back to `MediaSlot`'s empty state.
 */
export function coursePhotoSrc(course: {
  image?: string | null
  instrument?: string | null
}): string | null {
  if (course.image) return course.image
  return instrumentPhoto(course.instrument)?.src ?? null
}
