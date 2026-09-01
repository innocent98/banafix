/**
 * /enroll — the handoff's `isEnroll` screen.
 *
 * A Server Component whose only job is the Suspense boundary that
 * `useSearchParams()` needs inside <EnrollWizard>; the wizard itself is the
 * client island. The site header and footer come from app/(site)/layout.tsx.
 */

import { Suspense } from "react"

import { EnrollWizard } from "@/components/site/enroll/enroll-wizard"
import { EnrollSkeleton } from "@/components/site/enroll/enroll-states"

export default function EnrollPage() {
  return (
    <Suspense fallback={<EnrollSkeleton />}>
      <EnrollWizard />
    </Suspense>
  )
}
