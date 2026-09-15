# Delivery: security, testing, operations, build order

- [Tenancy and row-level security](#tenancy-and-row-level-security)
- [Security](#security)
- [Privacy](#privacy)
- [Testing](#testing)
- [Operations](#operations)
- [Repository layout](#repository-layout)
- [Build order](#build-order)
- [Open questions](#open-questions)

---

## Tenancy and row-level security

Every creator's data sits in the same tables, separated by `studio_id`. A
forgotten `where studio_id = …` is the classic multi-tenant leak, so it isn't
left to each query:

- Each request runs in a transaction that sets `app.studio_id` (from the
  session) with `set local`.
- Every business table has an RLS policy `studio_id = current_setting('app.studio_id')::uuid`.
- The app connects as a role **without** `bypassrls`. Migrations and the worker
  (which must cross studios) use separate roles, and the worker sets the studio
  per job all the same.
- A test creates two studios and calls every Studio API endpoint as one with the
  other's ids: every response must be `404`.

Public and join routes resolve the studio from the handle first and then run
under the same policy.

## Security

| Area | Measure |
| ---- | ------- |
| Passwords | argon2id; breached-password check (k-anonymity) on sign-up |
| Sessions | httpOnly, `Secure`, `SameSite=Lax` cookie; server-side session rows, revocable; 30-day idle expiry |
| CSRF | SameSite plus a double-submit token on state-changing requests from the dashboard |
| Codes and tokens | 6-digit codes and member link tokens stored hashed; codes 10 min / 5 attempts |
| Payments | Card data never touches KlubYou (Stripe Checkout and customer portal); webhook signatures verified; access only from webhooks |
| Hosting links | Never sent to members except as the join redirect, after the checks |
| Paid video | Mux signed playback tokens, short-lived, per member |
| Uploads | Presigned uploads; server checks type by content (not extension), ≤ 5 MB, strips EXIF location; served from a separate domain |
| Input | JSON Schema validation on every route; URLs normalised; page `links` limited to http(s) and `mailto:` |
| Abuse | Rate limits on auth, handle checks, checkout creation, join links; Stripe Radar on payments |
| Secrets | Environment secrets manager; nothing in the repo |
| Audit | `audit_log` for settings, publishing, marking paid, marking attendance, refunds, token resets |

## Privacy

KlubYou holds members' names, emails, payment history and **attendance** — a
record of when named people attended classes, which is personal data under
UK GDPR / GDPR.

- **Roles**: the creator is the controller of their members' data; KlubYou is a
  processor for it (a data processing agreement in the creator terms), and a
  controller for creators' own accounts.
- **Lawful basis**: attendance tracking is necessary to deliver the service the
  member bought and to show the creator their register. Members are told, on
  the join page and at checkout, that using their link records attendance.
- **Retention**: attendance 24 months, then aggregated
  (counts per session, no names). Payment records as tax law requires (6 years
  UK). Join-link logs (with IP addresses) kept 30 days.
- **Rights**: a member can export (`GET /me/export`) or ask for erasure;
  erasure anonymises the member row and attendance (keeps counts), keeps
  payment records with the name removed.
- **Sub-processors**: Stripe, Mux, Postmark, the host, the object store — listed
  publicly.

## Testing

The frontend's testing culture carries over ([docs/testing.md](../testing.md)):
a rule gets a test, and a fix is broken once to prove the test catches it.

| Layer | What | How |
| ----- | ---- | --- |
| **Rules** | `packages/rules` — every function in today's `src/lib/` | The existing suites move with them and keep running for both apps. Add zone-explicit cases (see Phase 0) |
| **Database** | Constraints: one best seller, one attendance per person per session, handle format, exactly-one checks | Tests against a real Postgres (Testcontainers), not mocks |
| **Tenancy** | Every Studio API route across two studios | Generated from the OpenAPI document so a new route can't skip it |
| **API** | Each endpoint's happy path, each refusal and its sentence | Fastify `inject`, real database, Stripe mocked at the HTTP boundary |
| **Drafts** | No draft plan, bundle, benefit or programme through any public or member route | One test per public route, seeded with drafts |
| **Webhooks** | Recorded Stripe event fixtures replayed, twice (idempotency), and out of order | `webhook_events` fixtures |
| **Flows** | Checkout → access → renewal → failure → recovery; join link outcomes | Stripe test mode in CI nightly (not per commit) |
| **Time** | Occurrences, reminders and join windows across clock changes and in far-apart zones | Fixed `now` and zones passed in — the rules already accept `now` |
| **Load** | Join links at 7:00am: 2,000 clicks in 60 s across 200 studios | k6, before launch |

## Operations

- **Hosting**: one region near most creators to start (e.g. London). Containers
  for `api` and `worker` on a managed platform (Fly.io, Render, or AWS ECS);
  managed PostgreSQL with point-in-time recovery; managed Redis.
- **Environments**: `local` (Docker Compose: Postgres, Redis, Stripe CLI for
  webhooks, Mailpit), `staging` (Stripe test mode), `production`.
- **Migrations**: forward-only SQL files run before deploy; expand → migrate →
  contract for anything that renames.
- **Observability**: structured JSON logs with `request_id` and `studio_id`;
  OpenTelemetry traces; metrics and alerts for webhook lag, job failures, join
  link latency and error rate, payment failure rate, Stripe reconciliation drift.
- **Backups**: daily snapshots plus PITR; restore drill quarterly.
- **Status**: the join redirect has its own health check — if it's down,
  classes can't start, so it pages someone.

## Repository layout

A monorepo, so the rules are shared by import, not by copy:

```
klubyou/
├── apps/
│   ├── dashboard/        this repo's src/ (Vite + React)
│   ├── api/              Fastify: routes by module, OpenAPI
│   └── worker/           BullMQ processors and schedulers
├── packages/
│   ├── rules/            today's src/lib — pure, zone and now passed in
│   ├── db/               Drizzle schema, migrations, RLS policies
│   └── api-client/       generated from the OpenAPI document
└── docs/                 today's docs/, plus docs/backend
```

## Build order

Each phase ends with something a creator can use, and the prototype keeps
working throughout: the dashboard swaps one `AppDataContext` action at a time
from local state to the API.

### Phase 0 — Share the rules
*No backend yet. Makes everything after it possible.*

1. Move `src/lib/` to `packages/rules`; the dashboard imports it; all current
   test suites still pass.
2. **Remove the module-level locale.** `applyStudioLocale` is safe in one
   browser tab and unsafe in a server handling many studios at once. Every rule
   that reads the zone or currency takes it: `formatTime(iso, zone)`,
   `money(amount, currency)`, or a `ctx = { zone, currency, now }`. The dashboard
   builds `ctx` once from the studio; the server builds it per request.
3. Money in minor units inside the rules (`amount_minor`), with the dashboard
   converting at the edge until the API arrives.
4. Split member and purchase in the rules (`accessOf`, `stateOf` on a *purchase*),
   matching the data model, while still reading mock data.
5. Give the rules the two merged shapes: one class shape with `kind`
   (`lesson | oneoff | live | video`) read by `everyday.js`, `schedule.js`,
   `attendance.js` and `programme.js`; one membership shape with `type`
   (`studio | programme`) read by `membership.js`, `members.js` and `payments.js`.
   The mock data moves to those shapes first, so the API can hand them over as is.

### Phase 1 — Accounts and the studio
Auth (email + code, Google), studios and handles, Settings, My page (draft,
publish, every version kept, restore, images), the public page served from the
API. The dashboard gains a version history on My page (list, preview, restore). **Creators can sign up
and publish their page.**

### Phase 2 — Content
Programmes (both types, readiness, sections), classes of every kind (everyday
lessons, one-offs, programme classes, videos), the derived schedule, memberships
of both types without selling, membership items (bundles and benefits) in one order.
**Creators can build their whole studio.**

### Phase 3 — Selling
Stripe Connect onboarding, prices on publish, checkout for plans and offers,
members and purchases, webhooks, renewals, failures, stop / resume, gift days,
vouchers, manual payments, payouts, receipts. Members page, Payments page and
Overview on real data. **Creators take money.**

### Phase 4 — Live classes
Member link tokens, the join redirect on `join.klubyou.co`, attendance and the
register, reminders, "no room" alerts, the Attendance pages on real data.
Optional Zoom watch time. **Members can come to class and be counted.**

### Phase 5 — Recorded and the member side
Mux upload and signed playback, video progress, the member portal (what I have,
my sessions and links, billing portal), member sign-in by email link.
**Members have a home.**

### Later
Staff accounts, member-facing app, custom domains, multi-currency pricing,
analytics exports, public API for creators.

## Open questions

Decisions the backend needs from the product owner. Each has a proposed answer
so work isn't blocked, but none is decided. When one is answered, record it in
[decisions.md](../decisions.md) and update these pages.

| # | Question | Why it matters | Proposal |
| - | -------- | -------------- | -------- |
| 1 | **Changing currency after taking payments.** The Settings decision relabels prices without converting. Stripe can't change a live subscription's currency. | Otherwise existing subscribers would be charged in a currency nobody agreed to. | Allow while nothing has been sold; afterwards, refuse with an explanation, or apply to new prices only and leave existing subscriptions on the old currency |
| 2 | **Old page addresses.** Settings warns that links stop working after a handle change. | Shared Instagram bios, members' class links. | Redirect the old handle for 90 days and hold it from others for 180 |
| 3 | **Who sends emails.** Today every dashboard email opens the creator's mail app, and nothing claims to send mail. | Receipts, failed-payment notices, class reminders and "your class moved" have to come from the platform. | Platform sends transactional emails; the creator's "Email" buttons keep opening their mail app for personal messages |
| 4 | **Several purchases per member.** The prototype's member has exactly one plan or programme. | Real members buy a programme then a plan. The Members page shows one "Access" per row. | Data model allows many (`purchases`); the Members page lists the most relevant and the details show all — needs a UI decision |
| 5 | **Deleting things people bought.** The prototype deletes programmes and plans freely. | Buyers would lose what they paid for. | Refuse deletion while anyone holds access; offer unpublish |
| 6 | **One-off lessons not in any bundle** — currently assumed open to every member on a plan (attendance decision, "assumed, not confirmed"). | It decides who gets in through the join link. | Confirm the assumption, or require every lesson to be in a bundle |
| 7 | **"Mark as paid" with card payments.** Stripe collects renewals itself. | Marking a card invoice paid by hand could double-charge. | Manual marking only for money taken outside Stripe (flows.md) |
| 8 | **Refunds and disputes.** Not in the prototype at all. | Stripe will send them; access and payouts must react. | Refund from the payment's menu; full refund ends a one-off's access, subscription refunds don't end access unless chosen |
| 9 | **Recorded video hosting.** Videos are pasted YouTube links today. | Pasted links can't be limited to buyers. | Mux for paid videos; pasted links only for intro videos |
| 10 | **Member identity at the join link.** Personal tokens can be forwarded. | A forwarded link marks the wrong person present. | Accept the risk at launch with revocable tokens; add "is this you?" when the device differs, later |
| 11 | **The 10% fee.** `FEE_RATE` is a constant. | Plans for creators (lower fee on a paid tier) would need a per-studio rate. | Store `fee_rate` on the studio from day one, default 10% |
| 12 | **Tax.** Prices are shown as-is; VAT isn't mentioned anywhere. | Selling digital services to consumers across borders carries VAT/GST obligations. | Stripe Tax on checkout, prices tax-inclusive by default; needs advice |
