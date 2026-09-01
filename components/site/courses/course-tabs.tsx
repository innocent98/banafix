"use client"

/**
 * Course-detail tabs — "Banafix Redesign.dc.html", `isCourse`.
 *
 * Handoff spec: `display:flex;gap:4px;border-bottom:1px solid #E6DDCE`, each
 * tab 14px/20px, 15px/700, active in ink with a 2px amber underline drawn as
 * an inset box-shadow (see `tabStyle()` in styles.ts).
 *
 * Built on the Radix tabs primitive so roving focus, arrow keys and the
 * tab/panel ARIA wiring come for free. The panels are server-rendered and
 * passed in as props — this component only owns which one is showing.
 */
import * as React from "react"
import * as TabsPrimitive from "@radix-ui/react-tabs"

import { tabStyle } from "@/components/site/courses/styles"

export interface CourseTab {
  key: string
  label: string
  panel: React.ReactNode
}

export function CourseTabs({ tabs }: { tabs: CourseTab[] }) {
  const first = tabs[0]
  const [active, setActive] = React.useState(first ? first.key : "")

  if (!first) return null

  return (
    <TabsPrimitive.Root value={active} onValueChange={setActive}>
      <TabsPrimitive.List
        aria-label="Course information"
        className="mb-[34px] flex gap-1 overflow-x-auto border-b border-bfx-border-7"
      >
        {tabs.map((tab) => (
          <TabsPrimitive.Trigger key={tab.key} value={tab.key} className={tabStyle(active === tab.key)}>
            {tab.label}
          </TabsPrimitive.Trigger>
        ))}
      </TabsPrimitive.List>

      {tabs.map((tab) => (
        <TabsPrimitive.Content key={tab.key} value={tab.key} className="outline-none">
          {tab.panel}
        </TabsPrimitive.Content>
      ))}
    </TabsPrimitive.Root>
  )
}
