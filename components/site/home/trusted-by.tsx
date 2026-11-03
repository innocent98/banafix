/**
 * "TRUSTED BY" strip — handoff `isHome`, second <section>.
 *
 * Partners are admin-managed (`TrustedPartner`). With none published the strip
 * is omitted entirely: an empty "trusted by" band would be worse than none.
 */
import type { PublicPartner } from "@/lib/site-content-queries"

function PartnerMark({ partner }: { partner: PublicPartner }) {
  const mark = partner.logoUrl ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={partner.logoUrl} alt={partner.name} className="h-8 w-auto max-w-[140px] object-contain" />
  ) : (
    <span>{partner.name}</span>
  )
  return partner.linkUrl ? (
    <a href={partner.linkUrl} target="_blank" rel="noopener noreferrer" className="hover:text-bfx-ink">
      {mark}
    </a>
  ) : (
    mark
  )
}

export function TrustedBy({ partners }: { partners: PublicPartner[] }) {
  if (partners.length === 0) return null

  return (
    <section className="bfx-shell pt-[14px] pb-[90px]">
      <div className="flex flex-wrap items-center gap-7 rounded-[20px] bg-bfx-cream-2 px-[30px] py-5">
        <span className="text-xs font-bold tracking-[0.1em] whitespace-nowrap text-[#8C7A5F]">
          TRUSTED BY
        </span>
        <div className="flex flex-wrap items-center gap-x-[34px] gap-y-3 text-[14.5px] font-semibold text-[#5A6474]">
          {partners.map((partner) => (
            <PartnerMark key={partner.id} partner={partner} />
          ))}
        </div>
      </div>
    </section>
  )
}
