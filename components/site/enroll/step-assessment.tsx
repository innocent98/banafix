"use client"

/**
 * Step 1 — "Book your assessment".
 *
 * The student starts with an assessment, not a course purchase, so this step collects what the
 * assessment needs: where (location), which format, how they want it done (arrangement), and when
 * they would like it. The per-class rates shown here are information only: tuition is agreed after
 * the assessment, and nothing on this screen is charged.
 *
 * Locations and formats come from the course's offerable offerings, so a student can only pick
 * something that is genuinely open. Online-kind locations only offer the Online arrangement.
 */

import * as React from "react"

import {
  ARRANGEMENT_LABELS,
  ARRANGEMENTS,
  TIME_BAND_LABELS,
  TIME_BANDS,
  type Arrangement,
} from "@/lib/assessment-vocab"
import { fromRate } from "@/lib/offering-rates"
import { formatNaira } from "@/lib/site"
import { SelectableRow, SelectField, StepHeading, SubHeading, TextField } from "./fields"
import type { EnrollCourse, EnrollFormData } from "./types"

/** Arrangements a student may choose at a location of this kind. */
export function arrangementsFor(kind: "PHYSICAL" | "ONLINE"): readonly Arrangement[] {
  return kind === "ONLINE" ? ["ONLINE"] : ARRANGEMENTS
}

/** Default arrangement for a freshly chosen location. */
export function defaultArrangement(kind: "PHYSICAL" | "ONLINE"): Arrangement {
  return kind === "ONLINE" ? "ONLINE" : "CENTRE"
}

const TIME_BAND_OPTIONS = TIME_BANDS.map((band) => ({ value: band, label: TIME_BAND_LABELS[band] }))

function todayInputValue() {
  const now = new Date()
  const month = String(now.getMonth() + 1).padStart(2, "0")
  const day = String(now.getDate()).padStart(2, "0")
  return `${now.getFullYear()}-${month}-${day}`
}

export function StepAssessment({
  course,
  form,
  onChange,
  onSelectOffering,
}: {
  course: EnrollCourse
  form: EnrollFormData
  onChange: <K extends keyof EnrollFormData>(field: K, value: EnrollFormData[K]) => void
  /** Picks an offering (or clears it with "") and re-defaults the arrangement for its location. */
  onSelectOffering: (offeringId: string) => void
}) {
  const locations = React.useMemo(
    () => [
      ...new Map(course.offerings.map((offering) => [offering.location.id, offering.location])).values(),
    ],
    [course.offerings],
  )

  const selected = course.offerings.find((offering) => offering.id === form.offeringId) ?? null
  const [locationId, setLocationId] = React.useState(selected?.location.id ?? "")
  const location = locations.find((l) => l.id === locationId) ?? null
  const atLocation = course.offerings.filter((offering) => offering.location.id === locationId)

  const pickLocation = (id: string) => {
    setLocationId(id)
    const options = course.offerings.filter((offering) => offering.location.id === id)
    // One format there: choose it for them. Otherwise they must pick.
    onSelectOffering(options.length === 1 ? (options[0]?.id ?? "") : "")
  }

  const arrangements = location ? arrangementsFor(location.kind) : ARRANGEMENTS

  return (
    <div>
      <StepHeading
        title="Book your assessment"
        sub="Your first step is a short assessment so we can place you at the right level. Tuition is agreed with you afterwards."
      />

      <SubHeading title="Where will you learn?" />
      <div role="radiogroup" aria-label="Location" className="mb-6 flex flex-col gap-[11px]">
        {locations.map((l) => (
          <SelectableRow
            key={l.id}
            active={locationId === l.id}
            name={l.name}
            note={l.kind === "ONLINE" ? "Online" : undefined}
            onSelect={() => pickLocation(l.id)}
          />
        ))}
      </div>

      {location ? (
        <>
          <SubHeading
            title="Pick a format"
            sub="Rates are per class, shown for information. Nothing here is charged today."
          />
          <div role="radiogroup" aria-label="Format" className="mb-4 flex flex-col gap-[11px]">
            {atLocation.map((offering) => {
              const from = fromRate(offering.rates)
              return (
                <SelectableRow
                  key={offering.id}
                  active={form.offeringId === offering.id}
                  name={offering.format}
                  trailing={from === null ? undefined : `from ${formatNaira(from)}`}
                  onSelect={() => onSelectOffering(offering.id)}
                />
              )
            })}
          </div>

          {selected ? (
            <ul
              aria-label={`${selected.format} rates at ${selected.location.name}`}
              className="mb-6 flex flex-col gap-2 rounded-[14px] border border-bfx-border-5 bg-bfx-field px-5 py-4"
            >
              {selected.rates.map((rate) => (
                <li
                  key={rate.durationMins}
                  className="flex items-baseline justify-between gap-3 text-[14.5px] text-bfx-label"
                >
                  <span>
                    <strong className="font-extrabold text-bfx-ink">
                      {formatNaira(rate.pricePerClass)}
                    </strong>{" "}
                    per class
                  </span>
                  <span className="font-semibold text-bfx-muted">{rate.durationMins} min</span>
                </li>
              ))}
            </ul>
          ) : (
            <div className="mb-6" />
          )}
        </>
      ) : null}

      {selected ? (
        <>
          <SubHeading title="How should we do the assessment?" />
          <div role="radiogroup" aria-label="Assessment arrangement" className="mb-6 flex flex-col gap-[11px]">
            {arrangements.map((arrangement) => (
              <SelectableRow
                key={arrangement}
                active={form.arrangement === arrangement}
                name={ARRANGEMENT_LABELS[arrangement]}
                onSelect={() => onChange("arrangement", arrangement)}
              />
            ))}
          </div>

          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <TextField
              id="preferredDate"
              label="Preferred date"
              hint="Optional"
              type="date"
              min={todayInputValue()}
              value={form.preferredDate}
              onChange={(event) => onChange("preferredDate", event.target.value)}
            />
            <SelectField
              id="preferredTimeBand"
              label="Preferred time"
              placeholder="Select a time"
              options={TIME_BAND_OPTIONS}
              value={form.preferredTimeBand}
              onChange={(event) =>
                onChange("preferredTimeBand", event.target.value as EnrollFormData["preferredTimeBand"])
              }
            />
          </div>

          {form.arrangement === "HOME" ? (
            <div className="rounded-[14px] border border-bfx-border-5 bg-bfx-field p-5">
              <SubHeading
                title="Where should we come?"
                sub="We check that we cover your area and confirm the time with you before the visit."
              />
              <div className="mb-4">
                <TextField
                  id="address"
                  label="Full address"
                  placeholder="House number, street name, area"
                  autoComplete="street-address"
                  className="bg-white"
                  value={form.address}
                  onChange={(event) => onChange("address", event.target.value)}
                />
              </div>
              <TextField
                id="landmark"
                label="Nearest landmark"
                placeholder="e.g. Opposite First Bank"
                className="bg-white"
                value={form.landmark}
                onChange={(event) => onChange("landmark", event.target.value)}
              />
            </div>
          ) : null}
        </>
      ) : null}
    </div>
  )
}
