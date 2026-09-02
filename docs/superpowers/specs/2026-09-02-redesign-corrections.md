# UI redesign — round 2 corrections

Amends `2026-09-01-ui-redesign-contract.md`. Everything in the original contract still
applies (tokens, frozen shared components, "real data only"). These are the changes on top.

## Verified facts about the live data — build against these, do not re-derive

`DeliveryMode` table, all active, in `order`:
`On-site` (1) · `One-on-One` (2) · `Online` (3) · `Home Training` (4). **There is no
description field on the model.**

Five published courses, all `location: "Lagos"`, all offering all four modes, all priced
`{Online: 20000, "On-site": 25000, "One-on-One": 30000, "Home Training": 35000}`:

| id | title | instrument | level | image | outcomes | equipment | curriculum | faqs | instructor |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `sample-guitar-course` | Guitar For Beginners | Guitar | Beginner | **yes** | 6 | 4 | 5 | **3** | **John Adebayo** |
| `saxophone-beginner` | Saxophone for Beginners | Saxophone | Beginner | null | 4 | 4 | 12 | 0 | none |
| `saxophone-intermediate` | Saxophone for Intermediate Students | Saxophone | Intermediate | null | 4 | 4 | 12 | 0 | none |
| `violin-beginner` | Violin for Beginners | Violin | Beginner | null | 4 | 4 | 12 | 0 | none |
| `violin-intermediate` | Violin for Intermediate Students | Violin | Intermediate | null | 4 | 4 | 12 | 0 | none |

Prisma models in full: `admin, deliveryMode, course, instructor, curriculumModule, courseFAQ,
student, parent, birthdayEmailLog, auditLog, enrollment, applicationPayment, tuitionPayment,
systemSetting`.

**There is no review model and no per-course policy model.** Do not build UI that implies
either exists.

The registration fee is real config: `calculateApplicationFee(course.location)` in
`lib/application-fee.ts` returns ₦5,000 for Lagos/Abuja/Online, ₦8,000 diaspora, ₦2,000
elsewhere. Always derive it. Never hardcode it.

## Correction 1 — no "free trial", anywhere

Banafix does not run free trial lessons. The handoff's CTA was wrong for this business.

- The site CTA is now `ENROL_LABEL` ("Enrol now") pointing at `ENROL_HREF` (`/courses`), both
  exported from `lib/site.ts`. `TRIAL_HREF` is **deleted** — any import of it must be updated.
- **The phrase "free trial" must not appear anywhere in user-visible copy**, and neither must
  its paraphrases: "trial lesson", "your first lesson is free", "no card required",
  "free 30-minute", "thirty minutes with a tutor".
- That means rewriting, not just relabelling: the home hero sub-copy, the home CTA band, the
  course-detail secondary button, the contact enquiry-subject option, the contact FAQ entry
  "Is the trial lesson really free?", page metadata descriptions, and the empty states that
  offer a trial. Replace the offer with something true: browse courses, talk to us on
  WhatsApp, ask about a course.
- Where a second CTA is needed beside "Enrol now", use `/contact` ("Talk to us", "Ask about
  this course").

## Correction 2 — no em or en dashes in copy

Neither `—` (em) nor `–` (en) may appear in **user-visible text**: JSX text nodes, string
literals that render, `metadata` title/description, `aria-label`, `alt`, placeholders, and
option labels.

Rewrite rather than swap in a hyphen where the sentence allows it:

- Parenthetical: `Tolu — a tutor — teaches` → `Tolu, a tutor, teaches`, or split the sentence.
- Ranges: `Weeks 1–3` → `Weeks 1-3`; `Mon–Fri 9am–8pm` → `Mon to Fri 9am to 8pm`.
- Trailing clause: `no card required — just turn up` → `no card required. Just turn up`.

Code comments are out of scope; leave them. Do not add a runtime sanitiser, and do not strip
dashes out of database content at render time. If DB text contains one, that is the admin's to
edit.

## Correction 3 — course images

`lib/course-photo.ts` is new. Use it wherever a course photo renders (home featured cards,
courses list cards, course detail hero):

```ts
import { coursePhotoSrc } from "@/lib/course-photo"
<MediaSlot src={coursePhotoSrc(course)} alt={course.title} glyph="note" />
```

`coursePhotoSrc` returns `course.image` when the admin uploaded one, else a **verified**
stock photograph of that instrument (piano, guitar, violin, drums, vocals, saxophone), else
null so `MediaSlot`'s empty state shows. Every photo in that map was checked by looking at the
image. Do not add entries without doing the same.

## Correction 4 — delivery formats must come from the backend

- The home "How you learn" section currently hardcodes **three** formats under invented names
  ("At the studio", "Online", "Home training"). That is wrong twice over: the names are not
  the canonical ones, and `One-on-One` is missing entirely. Drive it from the real
  `DeliveryMode` table (active, ordered), with the "from" price computed as the minimum
  `course.pricing[mode]` across published courses offering that mode.
- `MODE_NOTES` in `components/site/courses/course-data.ts` is invented copy describing each
  mode. **Delete it and its `modeNote()` helper**, and remove the note line from the format
  rows. Show the real mode name and its real price, nothing else.
- The per-format blurbs and bullet lists on the home section have no backing field either.
  Keep the section's design, but it must not assert specifics that no field supports
  ("recorded so you can review", "family and sibling discounts", "practice rooms before
  class"). Either cut them or reduce them to what the data actually shows.

## Correction 5 — exact copy replacement

On the course detail Overview panel, replace:

> No instrument yet? We rent for ₦8,000 a term, or you can use ours in the studio at no cost.

with exactly:

> No worries! We offer instrument rental services and starter kits for beginners. Contact our support team to learn more about equipment options.

Link "support team" to `/contact`.

## Correction 6 — coverage audit

Confirm and report, per course, that the detail page surfaces everything the backend holds:
`outcomes`, `equipment`, `curriculum`, `faqs`, `instructor`. A tab must appear whenever its
data exists and be hidden when it does not.

Reviews and per-course policies have no model. Do not add tabs for them. Site-wide policies
live at `/policies`; a plain link there from the aside is the correct treatment.

## Verify

`npx tsc --noEmit` must be clean, and:

```bash
grep -rniE 'free trial|trial lesson|no card required|first lesson is free' <files you touched>
grep -rnE '[—–]' <files you touched>   # must not match inside user-visible strings
```

Paste the real output of all three in your report.
