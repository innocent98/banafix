"use client"

/**
 * The handoff's three-segment progress header (`steps` helper, handoff.html:812).
 *
 *   dot   34px circle · ink + amber text when i <= step, #EDE5D8 + #8B96A6 otherwise
 *   label 14px/700    · ink when i <= step, #8B96A6 otherwise
 *   bar   3px pill    · amber when i <= step, #EDE5D8 otherwise
 */

import { cn } from "@/lib/utils"

export function StepProgress({ step, names }: { step: number; names: readonly string[] }) {
  return (
    <ol
      className="mb-[34px] flex items-center gap-[14px]"
      aria-label={`Enrolment progress: step ${step + 1} of ${names.length}`}
    >
      {names.map((name, index) => {
        const reached = index <= step
        return (
          <li
            key={name}
            // `min-w-0` is load-bearing: without it a flex item will not shrink
            // below its content, and the three segments overflowed the viewport
            // by 6px at 375px, scrolling the whole page sideways.
            className="flex min-w-0 flex-1 items-center gap-[14px]"
            aria-current={index === step ? "step" : undefined}
          >
            <span
              aria-hidden
              className={cn(
                "grid h-[34px] w-[34px] flex-none place-items-center rounded-full text-sm font-bold",
                reached ? "bg-bfx-ink text-bfx-amber" : "bg-bfx-border-5 text-bfx-muted-2",
              )}
            >
              {index + 1}
            </span>
            <span className="min-w-0 flex-1">
              <span
                className={cn(
                  "block truncate text-sm font-bold",
                  reached ? "text-bfx-ink" : "text-bfx-muted-2",
                )}
              >
                <span className="sr-only">{`Step ${index + 1}: `}</span>
                {name}
              </span>
              <span
                aria-hidden
                className={cn(
                  "mt-[9px] block h-[3px] rounded-full",
                  reached ? "bg-bfx-amber" : "bg-bfx-border-5",
                )}
              />
            </span>
          </li>
        )
      })}
    </ol>
  )
}
