# SMS and WhatsApp provider research (Banafix, Lagos)

Research date and retrieval date for every source: **2026-11-03**. Tags like `[S3]` resolve to the URL in the Sources table at the bottom, all retrieved 2026-11-03. Anything not verified is marked **UNCONFIRMED** with the reason. Third-party figures are labelled as such and are not used in the cost model.

## 1. Bottom line

- **Primary:** Africa's Talking for SMS (published NGN rates, free sender ID, sandbox, Node SDK), Twilio for WhatsApp (Meta's rate plus a flat per-message fee, no monthly fee found), Resend for email. Build behind a provider-agnostic outbox so vendors can be swapped.
- **Fallback:** Termii as a single Nigerian vendor for SMS and WhatsApp, once sales gives a rate card (none is public). 360dialog is the WhatsApp fallback if volume grows (flat monthly fee, no message markup).
- Twilio SMS to Nigeria (about NGN 520 per segment) is roughly 85x to 100x the Africa's Talking rate (NGN 5 to 6) (section 3). Do not use Twilio for SMS.

## 2. Meta WhatsApp pricing (the base for every BSP)

| Fact | Value | Source |
|---|---|---|
| Pricing model | Per delivered business-to-user message since 2025-07-01 (replaced conversation pricing); rate depends on category and recipient country code | [S1] |
| Categories | Marketing, utility, authentication (templates, any time); service (free-form, only inside a 24h window after the user writes) | [S1] |
| Service messages | 1,000 free per phone number per month; charged beyond that from 2026-10-01 | [S1][S2] |
| Utility template inside an open service window | Was free from 2025-07-01; charged from 2026-10-01 | [S2] |
| Billing currency | Rate card has 16 currencies; **NGN is not one of them**, so Nigerian traffic is billed in USD (or another listed currency) | [S2] |
| Rate changes | Only on the first day of a quarter, with one month notice | [S2] |

**Nigeria (+234) list rates, USD per message, effective 2026-10-01** (Meta's official USD CSV, read directly) [S3]:

| Marketing | Utility | Authentication | Authentication-international | Service |
|---|---|---|---|---|
| 0.0516 | 0.0067 | 0.0067 | 0.075 | 0.0067 |

Volume tiers exist for utility and authentication only [S2]; Nigeria tier thresholds were not read (UNCONFIRMED: tier values are in a separate CSV). At this academy's volumes tiers are irrelevant.

Warning: several third-party pages show different Nigeria numbers (one lists 0.0593 marketing and 0.0077 utility [S12]; another quotes naira figures that it admits are India rates [S13]). They are stale or wrong. Only [S3] was used.

## 3. Provider comparison

| | Termii | Twilio | Africa's Talking | 360dialog (WhatsApp only) |
|---|---|---|---|---|
| **SMS to NG, price** | **UNCONFIRMED**: pricing page says rates "vary by destination and channel", talk to sales [S4] | **USD 0.3868 per segment**, outbound, alphanumeric sender (about NGN 520 at NGN 1,346/USD); USD 0.001 fee on failed messages [S5] | **NGN 5.00 to 6.00 per SMS** (Basic plan, under NGN 100k spend), by telco; falls to NGN 4.60 to 5.60 at NGN 500k to 1M spend [S6] | n/a |
| Route types | `generic` (promotional, skips DND numbers) and `dnd` (transactional, reaches DND, needs activation); `whatsapp` and `voice` channels [S7] | No DND/route choice exposed; promotional content cannot be registered [S14] | Separate "Promotional" and "Transactional" rate rows per telco (MTN, Airtel, Glo, T2) [S6] | n/a |
| AT rate detail | n/a | n/a | Transactional: MTN 5.80, Airtel 6.00, Glo 5.50, T2 5.64. Promotional: MTN 5.40, Airtel 5.50, Glo 5.00, T2 5.56 (NGN) [S6] | n/a |
| **WhatsApp fees on top of Meta** | WABA fee USD 50 per month per account [S4]; per-message WhatsApp rate **UNCONFIRMED** (sales) [S4]. Engage plans: Free (SMS only), Starter NGN 75,000/mo (SMS, email, WhatsApp campaigns), Essential NGN 300,000/mo [S4] | USD 0.005 per message, inbound or outbound, on top of Meta's fee; no monthly fee seen on the pricing page [S8] | Set-up USD 85, USD 50 per month, and its own per-message table: Nigeria marketing 0.072, utility 0.012, authentication 0.012, service 0.002 [S9]. Higher than Meta's 0.0516/0.0067 [S3]; the AT page may predate 2026-10-01 rates (UNCONFIRMED) | EUR 49 (Regular), 99 (Premium) or 500 (Scale) per number per month; states no markup on Meta fees [S10] |
| **KYC / onboarding** | Account manager reviews; WhatsApp template flow **UNCONFIRMED** (docs page for templates returned 404, and the documented `whatsapp` channel is a plain-text "conversational" send, not clearly the Cloud API) [S7] | WhatsApp: needs Meta Business Portfolio admin access; business verification required before production if the portfolio is new or unverified; can take several weeks; a Nigerian number that can receive SMS or voice is allowed [S15] | SMS: contact-persons form, ID, certificate of incorporation, telco letters [S16]. WhatsApp onboarding steps **UNCONFIRMED** (page lists fees only) | Meta onboarding steps **UNCONFIRMED** (docs pages fetched did not cover it) |
| **Sender ID** | Request via API or dashboard with a sample message and company name; admin team reviews; status active/pending/blocked; fee and lead time **UNCONFIRMED** [S17]. DND route needs the sender ID approved for DND by support [S18] | Registration required; unregistered IDs sent best-effort. Lead time: international about 3 weeks, domestic 2 to 3 weeks. Fee: alphanumeric IDs are free [S14][S5] | **Free to raise.** Promotional ID needs contact form, ID, certificate of incorporation, Airtel request letter; transactional needs the same plus letters to all four telcos. Lead time **UNCONFIRMED** [S16][S6] | n/a |
| **API** | REST JSON, `api_key` in the body (not a header), no official SDK (raw examples incl. Node), webhook with HMAC-SHA512 `X-Termii-Signature`, delivery statuses include DND/Rejected, no sandbox documented [S7][S19] | REST with API key and secret, per-message `StatusCallback`, WhatsApp shared sandbox, official `twilio` Node SDK [S20] | REST; Node SDK `africastalking` and a `sandbox` username are described in community docs, not read on the official docs (JS-only, 403) [S21]; delivery-report callback URL set in the dashboard [S21]. Official WhatsApp page advertises delivery reports and templates [S9] | Direct API: generate API key, set webhook URL [S22]; header name and sandbox **UNCONFIRMED** |

Not usable or not checked: **Infobip** (pricing pages list no Nigeria rates or fees, sales quote needed [S23]; sender ID needs CAC certificate plus signed letters for four networks [S24]) is a possible enterprise fallback but not costed. **Meta Cloud API direct** has no markup (rates in section 2) but the academy would own template, webhook and verification plumbing, which the client ruled out. **Africa's Talking WhatsApp** is costed but ranks behind Twilio because of its fixed USD 50 per month.

## 4. Meta-side requirements (any BSP)

| Item | Finding | Source |
|---|---|---|
| Template review | Automatic, can take up to 24h; only `APPROVED` templates send | [S25] |
| Starting send limit | New business portfolio: **250 unique recipients per rolling 24h**. Reaches 2,000 via business verification, partner verification, or 2,000 delivered template messages in 30 days | [S26] |
| New portfolio phone numbers | Capped at 2 until verified (20 after) | [S27] |
| Phone number | Must be owned, mobile recommended, must receive SMS or voice OTP, cannot also be used in the WhatsApp app | [S27] |
| Documents Meta accepts for business verification (CAC etc.) | **UNCONFIRMED**: Meta Help Centre page returned only its title; Twilio says only that verification "can take several weeks" | [S15] |

## 5. Nigerian DND and NCC, and what it means for Banafix

| Point | Finding | Source |
|---|---|---|
| DND mechanism | Subscribers text STOP to 2442 (full) or a category digit (partial); NCC describes it as covering promotional and commercial messages and does not list exemptions or hours on its page | [S28] |
| Transactional bypass | Transactional traffic (OTP, payment confirmations, account alerts) can reach DND numbers on a transactional route and approved sender ID; promotional cannot. Source is vendor content, not the NCC | [S29] |
| Promotional hours | Vendors say 8:00 to 20:00 WAT under NCC directives; other vendors say it is only a recommendation. **UNCONFIRMED against an NCC primary document** | [S29][S30] |
| Misclassification | One sender name cannot serve both promotional and transactional traffic; adding promotion to a transactional message risks reclassification, filtering, or sender suspension | [S29][S24] |
| Silent failure | A platform can show "sent" while the operator filters it; track delivery receipts, not send acknowledgements | [S29] |
| Consent | Nigeria Data Protection Act 2023 needs a lawful basis (usually consent) for marketing messages; DND compliance does not replace it | [S29] |
| Twilio notes | OTP/notification to DND-active numbers can still fail via telco filtering; promotional content cannot be registered | [S14] |

**Practical impact for Banafix:**

| Message | Class | Channel advice |
|---|---|---|
| Payment confirmation, enrolment notice, monthly notice (fees/schedule) | Transactional | SMS on a transactional sender ID, plus WhatsApp utility template |
| Birthday wishes | Promotional-ish | WhatsApp (likely marketing category, USD 0.0516) or email; SMS on promo route will miss DND numbers |
| Announcements | Promotional unless tied to a student's class | WhatsApp or email; keep out of the transactional sender ID |
| Feedback requests | Promotional-ish | WhatsApp or email |

Use two sender IDs (one transactional, one promotional) and capture opt-in at enrolment.

## 6. Assumptions and exchange rate

- **FX: NGN 1,346 per USD**, the official NFEM rate of about NGN 1,346.05 on 2026-10-29 (secondary news source quoting the market, not the CBN portal; parallel market near 1,385) [S11]. Treat as indicative; every USD price moves with the naira.
- Per student per month: 1 monthly notice and 1 utility notice to the student, 0.1 birthday to the student; per reachable parent (1.2): 1 monthly notice and 0.1 birthday. Total **3.42 messages**: 3.2 utility-type and 0.22 birthday messages.
- WhatsApp: monthly and utility notices as **utility** (USD 0.0067), birthdays as **marketing** (USD 0.0516). If Meta accepts birthdays as utility the cost falls slightly; all sends are business-initiated so none are free-window.
- SMS: every message fits one 160-character segment. Table uses AT's Basic-plan band.
- Email: 3.42 emails per student, every student and parent has an email.

Per-student monthly unit cost: AT SMS NGN 17.10 to 20.52; Twilio WhatsApp USD 0.049892 (NGN 67.15); Meta list-only USD 0.032792 (NGN 44.14); Twilio SMS NGN 1,780.56.

## 7. Cost model (NGN per month)

| Channel and provider | 100 students (342 msgs) | 300 (1,026 msgs) | 1,000 (3,420 msgs) | Fixed fee not included |
|---|---|---|---|---|
| **SMS, Africa's Talking** at NGN 5.00 | 1,710 | 5,130 | 17,100 | none found |
| SMS, Africa's Talking at NGN 6.00 (worst listed) | 2,052 | 6,156 | 20,520 | none found |
| SMS, Twilio (USD 0.3868 per segment) | 178,056 | 534,169 | 1,780,564 | none found |
| SMS, Termii | 342 x `[PLACEHOLDER: Termii NGN/SMS, ask sales]` | 1,026 x same | 3,420 x same | none known |
| **WhatsApp, Twilio** (Meta + USD 0.005) | 6,715 | 20,146 | 67,155 | none found on page |
| WhatsApp, 360dialog (Meta rate, no markup) | 4,414 + fee | 13,241 + fee | 44,138 + fee | EUR 49 per number per month, convert at `[PLACEHOLDER: EUR/NGN, not sourced]` |
| WhatsApp, Africa's Talking own table | 7,301 + fee | 21,902 + fee | 73,007 + fee | USD 50/mo = NGN 67,300, plus USD 85 set-up = NGN 114,410 |
| WhatsApp, Termii | Meta + `[PLACEHOLDER: Termii per-message rate]` | same | same | USD 50/mo WABA = NGN 67,300; Engage Starter NGN 75,000/mo only if its campaign tools are wanted |
| **Email, Resend Free** (3,000/mo, 100/day cap) | 0 | 0 on volume (1,026) but see note | exceeds 3,000 limit | none |
| **Email, Resend Pro** (USD 20/mo, 50,000 emails) | 26,920 | 26,920 | 26,920 | included |

Derivations: SMS = messages x NGN rate. Twilio SMS = messages x 0.3868 x 1,346. WhatsApp = (3.2 x 0.0067 + 0.22 x 0.0516 [+ 3.42 x 0.005 for Twilio]) x students x 1,346. Resend Pro = 20 x 1,346 [S31]. Sources: SMS [S5][S6]; WhatsApp [S3][S8][S9][S10][S4]; email [S31].

Notes that change decisions:
- **Email free-tier trap:** the Free plan allows 3,000/month **but only 100/day** [S31]. A monthly notice to 100 students plus 120 parents is 220 emails and cannot go in one day on Free; spread it over days or pay USD 20. At 1,000 students (3,420 per month) Free is exceeded outright.
- **Fixed fees dominate small volumes:** at 100 students a USD 50 WABA or 360dialog fee (about NGN 67,300 or more) costs about 15x the Meta message charges. That is why Twilio (no monthly fee found) wins at this scale.
- **360dialog break-even vs Twilio:** monthly fee / USD 0.005 messages. At 3,420 messages (1,000 students) the Twilio fee is only about USD 17, below a EUR 49 fee at any plausible EUR/USD rate.
- **SMS is cheaper than WhatsApp per message** (NGN 5 to 6, against about NGN 9 for a Meta-only utility message, about NGN 16 for utility via Twilio, and about NGN 76 for a marketing message via Twilio), but SMS cannot reliably carry birthdays and announcements through DND.
- **Hybrid estimate (AT SMS for the 3.2 utility-type messages, Twilio WhatsApp for the 0.22 birthday messages):** 3.2 x NGN 6.00 = NGN 19.20, plus 0.22 x (0.0516 + 0.005) x 1,346 = NGN 16.76, so about **NGN 36 per student per month** (about NGN 3,596 / 10,788 / 35,960 at 100 / 300 / 1,000). This is the cheapest option that still sends birthdays reliably.

## 8. Risks and gotchas

1. **250-recipient start limit** on WhatsApp [S26]: a 1,000-student monthly blast needs several days or Meta business verification first. Start verification in week 1.
2. **Sender ID lead time** gates SMS go-live: Twilio 2 to 3 weeks (domestic) [S14]; AT, Termii unstated. Third-party estimate of 3 to 5 business days (promotional) and 10 to 15 (transactional) is a vendor blog, not the provider [S32]. Plan 3 weeks.
3. **USD billing:** Meta and Twilio price in USD, no NGN card option on the pages read; naira swings move WhatsApp cost. Billing-card acceptance for Nigerian cards is **UNCONFIRMED**.
4. **Termii's WhatsApp** channel as documented is single-recipient plain text (bulk endpoint lists only `dnd`/`generic`) [S7]; confirm it supports approved Meta templates before relying on it.
5. Delivery receipts must feed the outbox state machine; "sent" is not "delivered" [S29].

## 9. UNCONFIRMED register

| Item | Why |
|---|---|
| Termii SMS price per message (NGN/USD), generic vs DND | Pricing page defers to sales [S4] |
| Termii WhatsApp per-message rate, template support, onboarding docs | Same; templates doc 404 [S4][S7] |
| Sender ID lead time at Termii and Africa's Talking | Not stated in provider docs [S16][S17] |
| Termii sender ID fee | Not stated [S17] |
| Africa's Talking WhatsApp onboarding and whether its table reflects the 2026-10-01 Meta card | Page lists fees only [S9] |
| AT official API details (endpoint, sandbox URL, callback payload) | Docs are JS-only/403; only community docs read [S21] |
| 360dialog onboarding steps, API header, sandbox | Docs pages returned no such content [S22] |
| Meta business-verification accepted documents (CAC etc.) | Help Centre page did not render [S15] |
| Nigeria volume-tier thresholds on Meta rate card | Separate CSV not read |
| NCC primary document for 8:00 to 20:00 promotional window and DND scope | NCC consumer page silent on hours and exemptions [S28][S29] |
| Infobip Nigeria SMS and WhatsApp prices | Sales-quote only [S23] |
| Twilio WhatsApp monthly fee (none found, absence not proof) | Pricing page silent [S8] |
| Nigerian card acceptance for USD billers | Not checked |
| EUR/NGN rate (for 360dialog fee) | Not sourced |

## 10. Sources (all retrieved 2026-11-03)

| ID | URL |
|---|---|
| S1 | https://developers.facebook.com/docs/whatsapp/pricing |
| S2 | https://developers.facebook.com/documentation/business-messaging/whatsapp/pricing.md |
| S3 | Meta "USD list rates" file linked from https://developers.facebook.com/docs/whatsapp/pricing (header: "Cost per message in USD ... effective October 1, 2026"; Nigeria row) |
| S4 | https://termii.com/pricing |
| S5 | https://www.twilio.com/en-us/sms/pricing/ng |
| S6 | https://africastalking.com/pricing (Bulk SMS tab, Nigeria) |
| S7 | https://developers.termii.com/messaging-api |
| S8 | https://www.twilio.com/en-us/whatsapp/pricing |
| S9 | https://africastalking.com/chat/whatsapp |
| S10 | https://360dialog.com/pricing |
| S11 | https://www.opinionnigeria.com/dollar-to-naira-exchange-rate-today-october-29-2026/ |
| S12 | https://docs.gallabox.com/pricing-and-billing/whatsapp-pricing/rate-card.md (third party, disagrees with S3) |
| S13 | https://www.go4whatsup.com/nigeria/whatsapp-business-api-pricing/ (third party, India rates) |
| S14 | https://www.twilio.com/en-us/guidelines/ng/sms |
| S15 | https://www.twilio.com/docs/whatsapp/self-sign-up |
| S16 | https://help.africastalking.com/en/articles/2257657-how-do-i-get-a-sender-id-in-nigeria |
| S17 | https://developers.termii.com/sender-id |
| S18 | https://developers.termii.com/campaign |
| S19 | https://developers.termii.com/events-and-reports |
| S20 | https://www.twilio.com/docs/whatsapp/api |
| S21 | https://blog.africastalking.com/how-to-send-data-and-receive-reports-using-africas-talking-apis-512720fe4d80 and https://docs.communityhealthtoolkit.org/building/guides/messaging/gateways/africas-talking (community docs) |
| S22 | https://docs.360dialog.com/docs/hub/getting-started.md |
| S23 | https://www.infobip.com/pricing |
| S24 | https://www.infobip.com/docs/essentials/africa-registration/nigeria-letter-of-authorization-loa-guidelines |
| S25 | https://developers.facebook.com/documentation/business-messaging/whatsapp/templates/overview.md |
| S26 | https://developers.facebook.com/documentation/business-messaging/whatsapp/messaging-limits.md |
| S27 | https://developers.facebook.com/documentation/business-messaging/whatsapp/business-phone-numbers/phone-numbers.md |
| S28 | https://consumer.ncc.gov.ng/articles/67-understanding-dnd |
| S29 | https://www.telerivet.com/blog/nigeria-sms-sender-id-dnd-compliance (vendor blog, not legal advice) |
| S30 | https://www.clickatell.com/sms-country-regulations/nigeria (reported by search summary only; not fetched) |
| S31 | https://resend.com/pricing |
| S32 | https://yournotify.com/blog/sms-sender-id-in-nigeria-the-complete-guide-for-businesses/ (vendor estimate) |
