/**
 * Staff-review switch. While `SITE_NOINDEX=true` the whole site (public pages,
 * /admin and /api) tells search engines not to index or follow it: a
 * `robots` meta tag, an `X-Robots-Tag` header and a disallow-all robots.txt.
 * Unset it at launch. Read at build time, so changing it needs a redeploy.
 *
 * Only an explicit "true" or "1" turns it on; anything else leaves the site
 * indexable, so a typo can never hide the live site.
 */
export function isNoindex(value: string | undefined = process.env.SITE_NOINDEX): boolean {
  const v = (value ?? "").trim().toLowerCase()
  return v === "true" || v === "1"
}
