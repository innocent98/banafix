/**
 * "TRUSTED BY" strip — handoff `isHome`, second <section>.
 *
 * The four organisation names are static marketing copy; there is no partner
 * or client model in Prisma.
 */

/** Static marketing copy. */
const PARTNERS = [
  "Lagos State Schools Board",
  "Harmony Baptist Church",
  "The Dorchester School",
  "Eti-Osa Youth Orchestra",
] as const

export function TrustedBy() {
  return (
    <section className="bfx-shell pt-[14px] pb-[90px]">
      <div className="flex flex-wrap items-center gap-7 rounded-[20px] bg-bfx-cream-2 px-[30px] py-5">
        <span className="text-xs font-bold tracking-[0.1em] whitespace-nowrap text-[#8C7A5F]">
          TRUSTED BY
        </span>
        <div className="flex flex-wrap gap-x-[34px] gap-y-3 text-[14.5px] font-semibold text-[#5A6474]">
          {PARTNERS.map((name) => (
            <span key={name}>{name}</span>
          ))}
        </div>
      </div>
    </section>
  )
}
