# API

Four audiences, four surfaces, one server:

| Surface | Base | Who | Auth |
| ------- | ---- | --- | ---- |
| **Studio API** | `api.klubyou.co/v1/studio/…` | The dashboard (this repo) | Creator session cookie; studio from the session |
| **Public API** | `api.klubyou.co/v1/public/…` | The public page | None. Published data only |
| **Member API** | `api.klubyou.co/v1/me/…` | Member portal, checkout | Member session (magic link or password) |
| **Join** | `join.klubyou.co/<handle>/…` | Members' links | Personal token in `?m=`, or member session |
| **Webhooks** | `api.klubyou.co/hooks/…` | Stripe, Mux, Zoom | Provider signatures |

## Conventions

- **JSON over HTTPS**, `snake_case` on the wire, ids prefixed (`prg_01J…`).
  One OpenAPI document is generated from the Fastify route schemas; the
  dashboard's API client is generated from it.
- **Money** is `{ "amount_minor": 4000, "currency": "GBP" }`. The dashboard's
  `money()` formats it. No formatted strings come from the API.
- **Times** are ISO 8601 UTC instants. Wall-clock fields keep their local form
  and name: `"local_time": "07:00"`, `"local_date": "2026-09-18"`. Every studio
  response carries `studio.timezone`, and rules run in it.
- **Derived fields are included, and read-only.** A plan comes back with
  `content`, `saving`, `discount_percent`; a member with `state`, `renewal`,
  `progress`; a programme with `readiness`. They're computed by the same
  `packages/rules` functions the dashboard uses, so both agree. Sending one back
  in a write is ignored — the frontend can't set a status.
- **Lists** page by number, because the dashboard shows "Showing 1–10 of 24"
  and page buttons (`lib/paging.js`): `?page=2&per_page=25` (10, 25 or 50) →
  `{ items, page, pages, from, to, total }`. A page past the end is clamped
  (`clampPage`), not an empty list. Studio lists are small enough that counting
  is cheap; the activity feed and join events use cursors instead.
- **Search** is `?q=`, with the `matchesQuery` rule: case- and accent-
  insensitive, **every word must appear**. In SQL: `unaccent(lower(fields))
  LIKE '%' || word || '%'` for each word, backed by a trigram index.
- **Filters** use the dashboard's own values so nothing is translated:
  `?state=renewing`, `?access=plan:pln_…`, `?for=lesson:les_…`.

### Errors

[RFC 9457 problem details](https://www.rfc-editor.org/rfc/rfc9457), with
messages written for the creator — the dashboard shows `detail` as-is:

```json
{
  "type": "https://klubyou.co/errors/not-ready",
  "status": 422,
  "title": "Not ready to publish",
  "detail": "Add an intro video first — it's what buyers watch before they pay.",
  "fields": { "intro_video_url": "Add an intro video" },
  "blocker": "intro"
}
```

The messages come from the rules (`handleProblem`, `nameProblem`, `readiness`
`blocker`, `imageFileProblem`), so a disabled button's tooltip and the API's
refusal say the same sentence.

### Concurrency

Anything edited in a form returns an `ETag` made from its `updated_at`; writes
send `If-Match`. A stale write gets `412` with the current copy — the dashboard
says "This changed in another tab — here's the latest" rather than silently
overwriting. Matters most for the page draft and settings.

### Idempotency

Every `POST` that creates or charges accepts `Idempotency-Key`, kept 24 h in Redis.
A double-clicked "Mark as paid" or a retried checkout does one thing.

### Rate limits

Per IP and per user (Redis). Tight on `auth/*` (5 codes / 10 min), handle
availability checks, and join links; generous on reads.

---

## Studio API

Every endpoint below replaces an action in `src/context/AppDataContext.jsx`;
the action is named so the frontend change is mechanical. Writes return the
updated resource, with derived fields, so the dashboard can replace its state
with the answer.

### Session and onboarding

| Method & path | Does | Replaces |
| ------------- | ---- | -------- |
| `POST /v1/auth/signup` | Email + password → sends a 6-digit code | `AccountStep` |
| `POST /v1/auth/verify` | Code → verified, session cookie | `OtpStep` |
| `POST /v1/auth/resend` | New code (rate-limited) | "Resend code" (a stub today) |
| `GET /v1/auth/google/start`, `/callback` | Google sign-in | "Continue with Google" |
| `POST /v1/auth/login`, `POST /v1/auth/logout` | | "Log in" |
| `GET /v1/handles/:handle/availability` | `{ ok, message }` from `handleProblem` | `handleCheck` |
| `POST /v1/studios` | Claim handle, create studio, zone from the browser | `ChannelStep` |

### Settings — `lib/settings.js`

| | | |
| - | - | - |
| `GET /v1/studio` | Name, handle, currency, timezone, Stripe status | — |
| `PATCH /v1/studio/settings` | `{ name?, handle?, currency?, timezone? }`. Validates with `settingsProblems`. Returns `consequences` when called with `?dry_run=true`, so the confirmation modal shows the server's answer | `updateSettings` |

Handle, currency and zone changes have side effects — see
[flows.md → Changing settings](flows.md#changing-settings).

### My page — `lib/page.js`

| | | |
| - | - | - |
| `GET /v1/studio/page` | `{ draft, published: <latest version>, changed }` (`changed` = `pageChanged`) | — |
| `PATCH /v1/studio/page/draft` | Partial draft: tagline, about, intro video, theme… | `updateStudio`, `updatePageTheme` |
| `POST /v1/studio/page/draft/links`, `PATCH …/links/:id`, `DELETE …/links/:id` | ≤ 8 | `addPageLink`, `updatePageLink`, `removePageLink` |
| `PUT /v1/studio/page/draft/sections` | `{ order, hidden }` | `movePageSection`, `setSectionHidden` |
| `PUT /v1/studio/page/draft/programmes` | `{ hidden: [...] }` or `{ show_all: true }` | `setProgrammeOnPage`, `showAllProgrammes` |
| `POST /v1/studio/page/publish` | Adds the draft as a new version (skipped if nothing changed) | `publishPage` |
| `GET /v1/studio/page/versions?page=` | Every published version, newest first: number, when, who, restored from | *new* — version history |
| `GET /v1/studio/page/versions/:number` | One version's content, for previewing it | *new* |
| `POST /v1/studio/page/versions/:number/restore` | Copies that version into the draft. `{ publish: true }` also publishes it, as a new version | *new* — revert |
| `POST /v1/studio/uploads` | A presigned upload URL for a header image or avatar; the key goes into the draft. Type and ≤ 5 MB checked on completion | `ImageField` data URLs |

### Programmes — `lib/programme.js`

| | | |
| - | - | - |
| `GET /v1/studio/programmes?q=&type=` | With `readiness`, buyers, revenue | list page |
| `POST /v1/studio/programmes` | `{ name, description, type }` → draft. No dates: a live programme's run comes back derived from its classes (`runs: { starts_on, last_day, weeks }`) | `addProgramme` |
| `GET/PATCH/DELETE /v1/studio/programmes/:id` | Delete refuses if anyone has bought it (see open questions) | `updateProgramme`, `deleteProgramme` |
| `POST /v1/studio/programmes/:id/publish` | Runs `readiness`; `422` with `blocker` if not; creates Stripe prices for its memberships | `publishProgramme` |
| `POST /v1/studio/programmes/:id/unpublish` | Existing buyers keep access | `unpublishProgramme` |
| `PUT /v1/studio/programmes/:id/studio-only` | `{ studio_only: true }` | `setStudioOnly` |
| `POST/PATCH/DELETE …/sections[/:id]`, `POST …/sections/:id/move` | Recorded only. Edits the programme's `sections` list; deleting one deletes its videos | `addSection`, `updateSection`, `deleteSection`, `moveSection` |

A programme's content is **classes** and its prices are **memberships** — the
two resources below, filtered by `programme_id`.

### Classes — `lib/everyday.js`, `lib/programme.js`, `lib/schedule.js`

One resource for everyday lessons, one-offs, programme classes and videos
(`kind` = `lesson | oneoff | live | video`), because they're one table. The
body a kind accepts is validated by kind — a lesson can't be given `starts_at`,
a video can't be given a hosting link.

| | | |
| - | - | - |
| `GET /v1/studio/classes?kind=lesson,oneoff&q=` | Everyday lessons page: with `next_run`, `live_now`, latest session report | `ClassesPage` |
| `GET /v1/studio/classes?programme_id=` | A programme's classes (live) or videos by section (recorded), in order | `LiveProgrammeView`, `RecordedProgrammeView` |
| `POST /v1/studio/classes` | `lesson`: `{ title, local_time, weekdays, venue_url? }` · `oneoff`: `{ title, local_time, local_date, venue_url? }` · `live`: `{ programme_id, title, starts_at, pattern, count, venue_url? }` — the server expands the series to `count` classes (2–52, `expandSeries`) · `video`: `{ programme_id, section_id, title }` → returns a Mux direct upload URL | `addEverydayLesson`, `addClasses`, `addVideo` |
| `PATCH /v1/studio/classes/:id` | Title, times, days, hosting link, video link; for `live`, `{ starts_at, scope: "one"\|"series", notify }` | `updateEverydayLesson`, `updateClassLink`, `updateClassTiming`, `updateVideo` |
| `POST /v1/studio/classes/:id/deactivate`, `…/activate` | Sets / clears `inactive_at` — shown as pause (lesson), cancel (live), hide (video) | `toggleEverydayLesson`, `toggleClassActive`, `toggleVideoActive` |
| `POST /v1/studio/classes/:id/move` | Videos: `{ direction }` within the section | `moveVideo` |
| `DELETE /v1/studio/classes/:id?scope=one\|series` | Attendance records are kept | `deleteEverydayLesson`, `deleteClass`, `deleteVideo` |
| `GET /v1/studio/schedule?from=&to=` | Derived occurrences of `lesson`, `oneoff` and `live` classes in the window (≤ 92 days), with clashes, `missing_links`, and `came` for started sessions | `weekOf`, `nextUp`, `liveNow` |

### Memberships — `lib/membership.js`

One resource for studio plans and programme offers (`type` = `studio |
programme`), because they're one table. Studio-only fields (included items,
best seller, full price, includes everything, status) are refused on a programme membership.

| | | |
| - | - | - |
| `GET /v1/studio/membership` | Studio memberships (plans) and membership items (bundles and benefits) in order | Membership page |
| `GET /v1/studio/memberships?type=programme&programme_id=` | A programme's offers | `PricingPanel` |
| `POST /v1/studio/memberships` | `studio`: `{ name, description, interval_months, amount_minor, list_amount_minor?, includes_everything }` → draft · `programme`: `{ programme_id, name?, interval_months: null\|n, amount_minor }` | `addStudioPlan`, `addOffer` |
| `PATCH /v1/studio/memberships/:id` | | `updateStudioPlan` |
| `DELETE /v1/studio/memberships/:id` | Archived instead if anyone bought it; a studio plan someone holds is refused | `removeStudioPlan`, `removeOffer` |
| `POST /v1/studio/memberships/:id/publish`, `…/unpublish` | Studio type only; a programme membership follows its programme | plan status toggle |
| `PUT /v1/studio/memberships/:id/items` | `{ item_ids }` — bundles and benefits together. Studio type only | `setPlanBundles`, `setPlanExtras` |
| `POST /v1/studio/memberships/:id/best-seller` | Studio type only; clears the rest in one transaction | `setBestSellerPlan` |
| `POST/PATCH/DELETE /v1/studio/membership-items[/:id]` | `kind: bundle \| benefit`; a bundle takes `{ programme_ids, class_ids }`. Delete removes it from every plan | `addBundle`, `updateBundle`, `deleteBundle`, `addMembershipFeature`, `updateMembershipFeature`, `deleteMembershipFeature` |
| `POST /v1/studio/membership-items/:id/move` | `{ direction: "up"\|"down" }` — one order for both kinds | `moveMembershipRow` |

### Members — `lib/members.js`

| | | |
| - | - | - |
| `GET /v1/studio/members?state=&access=&q=&sort=&dir=&page=` | Rows with `state`, `access`, `renewal`, `progress`; plus `counts` for the chips and `summary` | `filterMembers`, `sortMembers`, `stateCounts`, `memberSummary` |
| `GET /v1/studio/members/:id` | Details: access and what it opens, payments, vouchers, last came | `MemberDetailModal` |
| `POST /v1/studio/purchases/:id/stop-renewal`, `…/resume-renewal` | Stripe `cancel_at_period_end` | `setMemberAutoRenew` |
| `POST /v1/studio/purchases/:id/gift` | `{ days: 7\|14\|30 }` | `giftMemberDays` |
| `POST /v1/studio/members/:id/vouchers` | `{ percent: 10\|20\|50 }` → code + Stripe promotion code | `addMemberVoucher` |

### Payments — `lib/payments.js`

| | | |
| - | - | - |
| `GET /v1/studio/payments?status=&access=&q=&sort=&page=` | With `summary` (received this month split, pending, fee, next payout) and `counts` | `PaymentsPage` |
| `GET /v1/studio/payments.csv?…` | Every matching payment, not just the page | Export CSV |
| `POST /v1/studio/payments/:id/mark-paid` | Manual payments only (see flows) | `markPaymentPaid` |
| `GET /v1/studio/payouts` | Read straight from Stripe; nothing stored | — |
| `POST /v1/studio/stripe/onboarding-link` | Stripe-hosted Connect onboarding | — |

### Attendance — `lib/attendance.js`

| | | |
| - | - | - |
| `GET /v1/studio/attendance?for=&q=&page=` | Recent sessions (4 weeks) with reports, `summary`, `live`, `quiet` | `AttendancePage` |
| `GET /v1/studio/attendance/:sessionKey` | `sessionReport` + `historyOf` + members' link | `SessionAttendancePage` |
| `PUT /v1/studio/attendance/:sessionKey/members/:memberId` | `{ present: true\|false }`; refuses before the session starts | `markAttendance` |
| `GET /v1/studio/members/:id/link?target=` | Their personal link (creates a token if none) | "Copy their link" |

### Overview — `lib/overview.js`

| | | |
| - | - | - |
| `GET /v1/studio/overview` | Summary, attention items, coming up, earnings series, who's here | `OverviewPage` |
| `GET /v1/studio/activity?cursor=` | Payments, sign-ups, vouchers, newest first | `recentActivity` |

---

## Public API

Published things only, cached at the edge for 60 s, purged on publish.

| | |
| - | - |
| `GET /v1/public/studios/:handle` | The **latest page version**, studio name, published plans (longest first) with comparison rows, programmes not hidden — the same data `PagePreview` renders |
| `GET /v1/public/studios/:handle/p/:programmeId` | One published programme: intro video, its memberships (offers), what's inside |
| `POST /v1/public/studios/:handle/leads` | Sign up without buying → a member with no purchases (a lead) |
| `POST /v1/public/studios/:handle/checkout` | `{ membership_id, email, voucher? }` → Stripe Checkout URL. One field whether it's a plan or a programme offer |

An unknown or old handle returns `404` (old-handle redirects are open question 2).

## Member API

| | |
| - | - |
| `POST /v1/me/auth/magic-link`, `GET /v1/me/auth/callback` | Members sign in with an emailed link |
| `GET /v1/me/studios/:handle` | What I have here: purchases, what they open, upcoming sessions with my links |
| `GET /v1/me/classes/:id/playback` | Kind `video`: signed Mux token, only with access |
| `PUT /v1/me/classes/:id/completed` | Kind `video`: marks it watched |
| `POST /v1/me/purchases/:id/billing-portal` | Stripe customer portal: card, cancel, invoices |

## Join

Not JSON: these answer a click with a page or a redirect.

| | |
| - | - |
| `GET join.klubyou.co/:handle/:classId?m=token` | Everyday lesson or one-off (a class of kind `lesson` / `oneoff`) |
| `GET join.klubyou.co/:handle/:programmeId/:classId?m=token` | Programme class. Ids, not slugs, so renaming never breaks a link already sent (`joinLinkOf`) |

Outcome, in the order `joinDecision` checks it: gone · cancelled · paused ·
unknown member (ask them to sign in) · no access · not open yet (opens 15 min
before; shows the next session) · over · no hosting link · **in** → record
attendance, `302` to the hosting link. See [flows.md → The join link](flows.md#the-join-link).

## Webhooks

| | Events used |
| - | - |
| `POST /hooks/stripe` | `checkout.session.completed`, `invoice.paid`, `invoice.payment_failed`, `customer.subscription.updated`, `customer.subscription.deleted`, `charge.refunded`, `account.updated` |
| `POST /hooks/mux` | `video.asset.ready` (duration), `video.asset.errored` |
| `POST /hooks/zoom` *(optional)* | `meeting.participant_joined`, `meeting.participant_left` |

All verify signatures, store the raw event in `webhook_events`
and return `200` immediately; the worker processes them idempotently.
