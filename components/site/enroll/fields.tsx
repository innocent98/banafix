"use client"

/**
 * Form atoms for the enrolment wizard, transcribed from the handoff's inline
 * styles (`isEnroll`, lines 440–562) and its `row(active)` helper.
 *
 * The handoff's buttons here are 12px-radius rectangles, not pills, so these do
 * not use `PillButton` from components/site/primitives.tsx.
 */

import * as React from "react"

import { cn } from "@/lib/utils"

/* -------------------------------------------------------------------------- */
/*  Text + select fields                                                       */
/* -------------------------------------------------------------------------- */

const controlBase =
  "w-full rounded-xl border-[1.5px] border-bfx-border-2 bg-bfx-field px-[15px] py-[14px] text-[15px] text-bfx-ink outline-none transition-colors placeholder:text-bfx-muted-2 focus:border-bfx-amber focus:bg-white"

export function FieldLabel({
  htmlFor,
  children,
  hint,
}: {
  htmlFor: string
  children: React.ReactNode
  hint?: string
}) {
  return (
    <label
      htmlFor={htmlFor}
      className="mb-[7px] flex items-baseline justify-between gap-3 text-[13px] font-bold text-bfx-label"
    >
      <span>{children}</span>
      {hint ? <span className="text-[12px] font-semibold text-bfx-muted-2">{hint}</span> : null}
    </label>
  )
}

export interface TextFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  id: string
  label: string
  hint?: string
  error?: string
}

export function TextField({ id, label, hint, error, className, ...props }: TextFieldProps) {
  const errorId = `${id}-error`
  return (
    <div className="block">
      <FieldLabel htmlFor={id} hint={hint}>
        {label}
      </FieldLabel>
      <input
        id={id}
        className={cn(controlBase, error && "border-red-400 focus:border-red-500", className)}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        {...props}
      />
      {error ? (
        <p id={errorId} className="mt-[6px] text-[12.5px] font-semibold text-red-600">
          {error}
        </p>
      ) : null}
    </div>
  )
}

export interface SelectFieldProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  id: string
  label: string
  hint?: string
  placeholder: string
  options: readonly { readonly value: string; readonly label: string }[]
}

export function SelectField({
  id,
  label,
  hint,
  placeholder,
  options,
  className,
  ...props
}: SelectFieldProps) {
  return (
    <div className="block">
      <FieldLabel htmlFor={id} hint={hint}>
        {label}
      </FieldLabel>
      <select id={id} className={cn(controlBase, "appearance-none pr-9", className)} {...props}>
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*  Selectable / informational rows — the handoff's `row(active)` helper        */
/* -------------------------------------------------------------------------- */

/**
 * `row(active)`:
 *   padding 15px 17px · radius 14px · gap 14px
 *   background #FBF5EA when active, #FCFAF7 otherwise
 *   inset ring 1.5px #F5A524 when active, 1px #EAE1D3 otherwise
 */
export function rowClass(active: boolean) {
  return cn(
    "flex w-full items-center justify-between gap-[14px] rounded-[14px] px-[17px] py-[15px] text-left transition-colors",
    active
      ? "bg-bfx-note-bg shadow-[inset_0_0_0_1.5px_var(--bfx-amber)]"
      : "bg-bfx-field shadow-[inset_0_0_0_1px_var(--bfx-border)]",
  )
}

export function SelectableRow({
  active,
  name,
  note,
  trailing,
  onSelect,
}: {
  active: boolean
  name: string
  note?: string
  trailing?: React.ReactNode
  onSelect: () => void
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={active}
      onClick={onSelect}
      className={cn(
        rowClass(active),
        "cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bfx-amber focus-visible:ring-offset-2 focus-visible:ring-offset-bfx-surface",
        !active && "hover:shadow-[inset_0_0_0_1px_var(--bfx-border-2)]",
      )}
    >
      <span className="min-w-0">
        <span className="block text-[16px] font-bold text-bfx-ink">{name}</span>
        {note ? (
          <span className="block text-[13px] font-semibold text-bfx-muted">{note}</span>
        ) : null}
      </span>
      {trailing ? <span className="flex-none text-[16px] font-extrabold text-bfx-ink">{trailing}</span> : null}
    </button>
  )
}

/** Same visual weight as a row, but explicitly not a control. */
export function InfoRow({ name, note }: { name: string; note?: string }) {
  return (
    <li className={rowClass(false)}>
      <span className="min-w-0">
        <span className="block text-[16px] font-bold text-bfx-ink">{name}</span>
        {note ? (
          <span className="block text-[13px] font-semibold text-bfx-muted">{note}</span>
        ) : null}
      </span>
    </li>
  )
}

/* -------------------------------------------------------------------------- */
/*  Checkbox rows                                                              */
/* -------------------------------------------------------------------------- */

export function ConsentRow({
  id,
  checked,
  onChange,
  children,
  required = false,
}: {
  id: string
  checked: boolean
  onChange: (next: boolean) => void
  children: React.ReactNode
  required?: boolean
}) {
  return (
    <label
      htmlFor={id}
      className="flex cursor-pointer items-start gap-3 rounded-[14px] border border-bfx-border-5 bg-bfx-field px-5 py-[18px] transition-colors hover:border-bfx-border-2 has-[:focus-visible]:border-bfx-amber"
    >
      <input
        id={id}
        type="checkbox"
        checked={checked}
        required={required}
        onChange={(event) => onChange(event.target.checked)}
        className="mt-0.5 h-[18px] w-[18px] flex-none accent-[var(--bfx-amber)]"
      />
      <span className="text-[14.5px] leading-[1.55] text-bfx-label">{children}</span>
    </label>
  )
}

/** Small day chip used by the home-training block. */
export function DayChip({
  day,
  checked,
  onChange,
}: {
  day: string
  checked: boolean
  onChange: (next: boolean) => void
}) {
  const id = `day-${day.toLowerCase()}`
  return (
    <label
      htmlFor={id}
      className={cn(
        "flex min-h-[44px] cursor-pointer items-center gap-2 rounded-xl px-3 py-2 text-[13.5px] font-semibold transition-colors",
        checked
          ? "bg-bfx-note-bg text-bfx-ink shadow-[inset_0_0_0_1.5px_var(--bfx-amber)]"
          : "bg-bfx-field text-bfx-body shadow-[inset_0_0_0_1px_var(--bfx-border)]",
      )}
    >
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="h-4 w-4 flex-none accent-[var(--bfx-amber)]"
      />
      {day}
    </label>
  )
}

/* -------------------------------------------------------------------------- */
/*  Notes                                                                      */
/* -------------------------------------------------------------------------- */

export function NoteBlock({
  tone = "amber",
  children,
}: {
  tone?: "amber" | "green"
  children: React.ReactNode
}) {
  return (
    <div
      className={cn(
        "rounded-[14px] border px-5 py-[18px] text-[14.5px] leading-[1.6]",
        tone === "amber"
          ? "border-bfx-note-border bg-bfx-note-bg text-bfx-note-text"
          : "border-bfx-ok-border bg-bfx-ok-bg text-bfx-ok-text",
      )}
    >
      {children}
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*  Step heading + section divider                                             */
/* -------------------------------------------------------------------------- */

export function StepHeading({ title, sub }: { title: string; sub: string }) {
  return (
    <>
      <h2 className="mb-1.5 text-[23px] font-bold tracking-[-0.015em] text-bfx-ink">{title}</h2>
      <p className="mb-[26px] text-[15px] text-bfx-muted">{sub}</p>
    </>
  )
}

export function SubHeading({ title, sub }: { title: string; sub?: string }) {
  return (
    <div className="mb-4">
      <h3 className="text-[15px] font-bold text-bfx-ink">{title}</h3>
      {sub ? <p className="mt-1 text-[13.5px] text-bfx-muted">{sub}</p> : null}
    </div>
  )
}
