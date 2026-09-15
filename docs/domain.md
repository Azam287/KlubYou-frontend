# The domain: what things are, and the rules between them

Read this before changing behaviour. Most of the rules below were settled after
trying something else first, so each section notes what was tried and why it
was rejected — **don't reintroduce a rejected design without asking the
product owner.**

The logic for each area lives in a pure module under `src/lib/`. Components
call those functions; they don't reimplement the rules.

---

## The one principle: derive, don't store

If a value can be worked out from other data, it is computed at render time and
never saved. Aggregates, discounts, "next class", "on now", a plan's contents,
the schedule, the order of rows — all derived.

**Why:** every stored copy of a derived value eventually disagreed with the rows
beside it (a "3 pending payments" card above a table showing one; a "25% off"
badge its own prices didn't support). Deriving makes that class of bug
impossible rather than fixed.

**In practice:** when you're tempted to add a field, first check whether it can
be a function in `src/lib/`. If you must store something, store only what a
person decided (a price, a date, a name) — never a consequence of it.

---

## Programmes — `src/lib/programme.js`

Something a member **buys**. Exactly one of two types:

| Type        | How a member gets it                                                   |
| ----------- | ---------------------------------------------------------------------- |
| `live`      | Classes at set times between two dates, each with its own joining link |
| `recorded`  | Ordered **sections** of **videos**, watched anytime                    |

"Videos" is the word for recorded content. (It used to be "lessons", which
collided with *everyday lessons* — don't bring it back.)

### Every programme has

- a **name**, a **description**, and an **intro video** — the one thing a buyer
  can watch before paying. Publishing waits for it.
- a **status**: `draft` (only the creator sees it) or `published` (on the page, on sale).
- a **pricing decision**: one or more **offers** (`oneoff` "pay once" or
  `subscription`), *or* an explicit `pricing.studioOnly: true`. An untouched
  programme is *undecided*, not studio-only — that is a deliberate choice the
  creator has to make.

### Live programmes

- The **run window** (`schedule: { startsOn, weeks }`) is set **before** any
  class. It decides how many classes a repeating series creates, so the creator
  never has to count. `endsOn` is derived and exclusive; `lastDay` is the day before.
- Classes store an ISO `startsAt`. A class created as part of a repeat shares a
  `seriesId`, so "change the whole series" and "delete the whole series" work.
- A class is **in progress** for 60 minutes after it starts (`currentClassOf`).
  The same hour is used for everyday lessons, so "on now" means one thing everywhere.
- **Joining links never block publishing.** A class weeks away doesn't have its
  link yet. Missing links are *reminders*, surfaced on the programme page and the
  schedule. (A recorded video without a video file *does* block — it would be
  sold with nothing behind it.)

### Publishing — `readiness(programme)`

Returns a checklist. Items marked `optional` never block. Required items, in order:

1. *(live only)* run window set
2. at least one class / video
3. intro video
4. pricing decided
5. publish

`blocker` is the first unmet required item, so the UI can say *why* Publish is off.

---

## Everyday lessons — `src/lib/everyday.js`

What comes **with the studio subscription** — no separate price. Its own page
(`#/dashboard/classes`, "Everyday lessons") and its own sidebar entry.

**The line between a programme and an everyday lesson is commercial, not
temporal:** a programme is bought; an everyday lesson isn't. A live programme
also runs on dates — that doesn't make it an everyday lesson.

One record shape covers two kinds:

| Kind          | Has                                   | Form shows          |
| ------------- | ------------------------------------- | ------------------- |
| Repeating     | `days: [0–6]` (0 = Sunday), `time`    | days picker, no date |
| One-off class | `date`, `time`, `days: []`            | date, no repeat picker |

- `time` is a wall-clock string (`"07:00"`), not a timestamp — it runs at 7am on
  each of its days.
- `active: false` pauses a lesson. A one-off whose date has passed is `isOver`.
- `nextRun` and `currentSession` are derived every render.

**Tried and rejected:** merging everyday lessons and one-offs into programmes as
one page. The product owner preferred two separate sections. The *form* is
kind-specific (no "just once" option for a repeating lesson, no repeat section
for a one-off).

---

## Schedule — `src/lib/schedule.js`

`#/dashboard/schedule` is a **view, not a data source**. It stores nothing. Each
week is built from live programmes' classes plus everyday lessons:

- `weekOf(date, data)` → seven days (Monday first) with `today`, `past`, and
  entries, plus `total` and `missingLinks`.
- Entries starting within 30 minutes of each other are marked as a **clash** (amber, a warning — not an error).
- **Draft programmes are included** — the creator is planning them, and hiding
  them would make the schedule disagree with the programme page.
- `nextUp` looks 90 days ahead; `liveNow` is whatever is in progress.
- Each entry carries `refId` and `sourceId`, so a missing link can be fixed in place.

To change what the schedule shows, change the underlying class or lesson — never
add schedule-only data.

---

## Membership — `src/lib/membership.js`

The studio subscription, sold as **plans**. Three things, managed on three tabs
of `#/dashboard/membership`:

| Thing             | What it is                                                     | Stored as                              |
| ----------------- | -------------------------------------------------------------- | -------------------------------------- |
| **Plan**          | What someone buys: name, description, length, price            | `studioPlans`                          |
| **Bundle**        | A named set of programmes and everyday lessons                 | `bundles`                              |
| **Extra benefit** | A perk with no content behind it ("Monthly 1:1 check-in")      | `membershipFeatures` (legacy name — the UI says "extra benefit") |

### What a plan opens

A plan is **either**:

- **Everything** (`scope: "all"`) — every published bundle and every published
  benefit, including ones created later. Nothing can be left out; in the table
  its cells are locked. For exceptions, the plan must switch to choosing.
- **Chosen** (`scope: "picked"`) — the bundle ids in `plan.bundles` and the
  benefit ids in `plan.extras`.

Both lists live **on the plan**. (Benefits used to keep their own list of plan
ids, which put the answer in two places facing each other.)

**Bundles cannot be "everything".** That would be a second way to say what a
plan already says. A bundle is always an explicit list.

**Always ask through the helpers, never read the arrays directly:**

```js
planHasBundle(plan, bundleId)   // true for an everything plan, whose array is empty
planHasExtra(plan, extraId)
bundlesOf(plan, bundles)        // what a member actually gets: published only
planContent(plan, bundles, programmes, lessons) // de-duplicated programmes + lessons
```

Reading `plan.bundles.includes(id)` has caused the same bug three times: an
everything plan appears to contain nothing.

An everything plan keeps its old `bundles`/`extras` arrays — they're ignored on
read — so switching back to "Choose" doesn't lose the picks.

A plan may consist of benefits only. A plan with no bundles *and* no benefits
can't be saved.

### Drafts and publishing

Plans, bundles and benefits are all **created as drafts** and each has a
`status` of `draft` or `published` — the same lifecycle as a programme. The rule
is strict:

- **Unpublished things never appear to members** — not in the member preview, not
  on the public page.
- **Unpublished things don't appear in the Plans-tab table either.** Draft plans
  aren't columns; draft bundles and benefits aren't rows. The table says how
  many rows it's hiding and where to publish them (the Bundles / Extra benefits tabs).
- A published plan whose bundles are all drafts **opens nothing**, and the page warns about it.
- Draft extras don't count towards "Plus N of M extras".

### Row order

Bundles and benefits share **one `order` sequence**. A bundle can sit between two
benefits; there's no "bundles first" rule. Rows are reordered from the table's
⋯ menu (`moveMembershipRow`), which swaps with the neighbour of either kind and
renumbers 1…n. New rows join the end (`nextMembershipOrder`). Members see the same order.

### Prices

A plan stores `months`, `amount` and optionally `listPrice`. Everything else is derived:

- `savingOf` / `discountPercent` — from `listPrice − amount`. The percentage
  rounds **down**, so a badge never claims more than the prices give.
- `perMonth` — `amount / months`.
- `planValue` / `planSaving` — what the plan's programmes would cost bought
  separately *for the same length*, choosing each programme's cheapest offer
  over that stretch (a £12/month subscription over 6 months is £72). Shown only
  when positive.
- **Best seller**: at most one plan; marking one clears the rest.

### The two views of the Plans tab

A two-icon switcher: **table** (bundles and benefits down the side, plans across
the top; click a cell to include/exclude; pencil on each column edits the plan;
eye on each row publishes it) and **cards** (plans as products: price, content
summary, and the menu to publish, set best seller, or remove). "Preview as
member" shows what members see.

---

## My page — `src/lib/page.js`

The creator's public page (`klubyou.co/<handle>`), styled like an influencer's
link-in-bio page. `#/dashboard/page` is an editor on the left and a live
preview on the right.

**Publishing:** edits are a **draft**. The preview shows them straight away, but
visitors see the last *published* page (`publishedPage` in the store, a
`pageSnapshot`). Whenever the draft differs (`pageChanged`), a **Publish changes**
button appears in the header and the subtitle says there are unpublished
changes; publishing copies the draft over and the button goes away. The snapshot
is normalised, so undoing an edit by hand counts as no change. Memberships and
programmes aren't part of it — they're published on their own pages.

The page reads, top to bottom: the **header (image, studio name, tagline)**,
then the five **sections — about you, intro video, links, memberships,
programmes — in the order the creator sets** (that's the default order). It is previewed **on a phone**, styled like
the creator pages people know from a link in bio: a cover band, a ringed avatar
with `@handle`, social icons, pill-shaped link buttons, the **membership
comparison** (plan cards with price, discount and Choose, then a "What you get"
table of every published bundle and benefit against every plan — the same
`MembershipComparison` component as Membership → "Preview as member", in the
page's colours), a swipeable row of programme cards, and a **"Join from £…" button pinned to the
bottom** (the cheapest published plan; hidden when none is on sale).

**On desktop My page fits the window**: the editor scrolls inside its own
column and the preview (phone or browser) stretches to the height below the
header, so the page itself never scrolls. Narrow screens scroll normally. The
phone preview has a status bar (time, signal, battery) that the page scrolls
under.

**The editor** keeps the header image, studio name and tagline always open at
the top. Everything else is a **tile**, closed by default, showing a one-line
summary (`sectionSummary`: "3 links", "2 of 3 shown", the three colour dots…).
The five section tiles are **reorderable** — drag the grip, or focus it and
press ↑ ↓ (announced to screen readers) — and their order *is* the page order
(`movePageSection` → `moveItem`; drag landing via `dropIndex`). Each section tile
also has an **eye** to hide that section from the page; hiding Memberships also
removes the "Join from £…" button, since there'd be nothing on the page to join.
The header can't be hidden. The Colours tile
closes like the others but stays last: it styles the whole page rather than
sitting somewhere on it. Which tiles are open isn't stored.

An **arrow on the editor's right edge** collapses the editor so the preview has
the full width (‹ to hide; the arrow stays in place as › to bring it back). It
sits near the top of the editor's edge and stays in view as the editor scrolls. "Preview"
and the Phone / Web switch sit at the right above the preview. It isn't stored, and
the page opens with the editor showing.

A **Phone / Web** switch above the preview redraws the same page in a browser
window: wider column and cover, memberships and programmes in a grid, and the
join button in a sticky bar across the top instead of the bottom. The switch is
only a way of looking; it isn't stored and changes nothing on the page.

Only these are stored, on `studio`:

| Field        | Notes                                                                         |
| ------------ | ----------------------------------------------------------------------------- |
| `name`, `tagline`, `about` | Empty ones show as placeholders in the preview             |
| `avatarImage` | The round profile photo or logo, as a data URL, same limits as the header image. Empty shows the studio's initial |
| `coverImage` | The header image, as a data URL (no server to upload to). JPG/PNG/WebP/GIF up to 5 MB (`imageFileProblem`). Empty = a band tinted from the page colours |
| `introVideo` | A URL. **YouTube and Vimeo links play in an embedded player** (`videoEmbedOf`: youtu.be, watch?v=, shorts, embed, vimeo.com/ID; YouTube via youtube-nocookie.com). Any other link shows as a "Watch my intro" card. The demo uses Blender's openly licensed *Big Buck Bunny* |
| `links`      | `[{ id, label, url }]`, up to `MAX_LINKS` (8). Rows that aren't a link yet stay in the editor but not on the page. **An unlabelled link to a known social site shows as its icon** (`socialLinks`); **any other link, or a social link given a label, is a button** (`buttonLinks`), named by its label or else its site/domain |
| `theme`      | `{ background, text, accent }` — the only three colours. Themes saved without an accent get the default (`themeOf`) |
| `hiddenSections` | Section keys switched off the page (the eye on each tile). Content is kept; the tile stays in the editor marked Hidden. Stored as the hidden ones, so a new section shows by default. The page renders `visibleSections(studio)` |
| `sectionOrder` | The five section keys in page order. Read it through `sectionOrderOf`, which drops unknown keys and appends any missing one, so a section can't vanish because of an old order |

**Memberships** aren't chosen here: the page shows every *published* plan
(longest first), and the editor links to the Membership page.

**Links** can also be an email address (`hello@…` or `mailto:…`, `isEmailLink`):
it shows as an "Email" button with a mail icon, never as a web or social link.

**Programmes** are chosen one by one. The editor lists every *published*
programme with a tick box (drafts aren't listed, only counted) and a **Show
all** button. What's stored is `studio.hiddenProgrammes` — the ones *left off* —
so a programme published later appears automatically. Hiding one doesn't
unpublish it; it's still on sale, just not on the page. Deleting a programme
drops it from the hidden list. The page shows `pageProgrammes(programmes,
hiddenProgrammes)`, and the section disappears if every one is hidden.
**Hiding a programme never changes the membership comparison** — that reads
every published programme (the preview's `catalogue`), because hiding from the
page doesn't change what a plan includes. Subscription prices read
"£12/month" or "£30 every 3 months". A members-only programme shows "Join a
membership" only when the Memberships section is on the page; otherwise it has
no button.

**Colours:** three picks, each with presets plus "any colour":

- **Background** and **Text** set the page. Softer text, borders and card fills
  are mixed from them in CSS with `color-mix`. If the pair is below WCAG AA
  contrast (4.5:1), the editor says "Hard to read" and offers the fix
  (`bestTextOn`).
- **Accent** colours everything that should stand out: the avatar ("logo"), the
  intro video card, link icons, every button, the best-seller border, and the
  ticks in the comparison. The label on top of it (`onAccent`) is worked out —
  white or dark, whichever reads — so it is never picked. If the accent is under
  3:1 against the background (`accentVisible`), the editor warns that buttons
  will blend in.

---

## Members — `src/lib/members.js`

`#/dashboard/members`. A member stores **what they bought, not a description of
it**:

| `plan`        | Points at                        | Means                                   |
| ------------- | -------------------------------- | --------------------------------------- |
| `"studio"`    | `planId` (a Membership plan)     | On a membership                         |
| `"programme"` | `programmeId` + `offerId`        | Bought one programme, via one offer     |
| `"none"`      | nothing                          | A **lead**: signed up on the page, hasn't bought |

Plus `joinedAt`, `renewsAt` (null for lifetime), `autoRenew` (false once
stopped), `status`, `attended` (classes), `watched` (videos), `vouchers`. Names,
prices and lengths are always read from the plan or offer, so a rename reaches
every member. **Never store a plan length, a label or initials on a member.**

**Rules** (all derived):

- **Lifetime** (`isLifetime`): a programme bought with a one-off offer. No renewal
  date, can't lapse, can't be stopped or gifted days.
- **Renews** (`renews`): every membership plan, and programme subscriptions.
- **Status** (`stateOf`), most urgent first: *Lead* → *Inactive* (status says so,
  **or** the renewal date has passed) → *Payment due* (a pending payment) →
  *Ending* (renewal stopped) → *Renews soon* (within 7 days) → *Active*.
- **Renewal** (`renewalOf`): "Lifetime access", "Renews in 3 days", "Ends 12 Oct",
  "Ended 4 Aug".
- **Activity** (`progressOf`): a **recorded** programme counts videos watched out
  of its active videos; a **live** programme counts classes attended out of
  classes held since they joined; a **membership** counts classes attended with
  no "out of" (everyday lessons run every day, so there's no fair total).
- **Stopping renewal** turns `autoRenew` off: access runs to `renewsAt`, then
  ends. It asks for confirmation and can be resumed until then. Works for plans
  and programme subscriptions alike.
- **Gifting days** moves `renewsAt` back (7, 14 or 30) — only for renewing access
  that hasn't ended.
- **Vouchers** are recorded on the member (code like `EMMA20`, never repeated for
  them) and an email opens with the code. **Emails open in the creator's mail
  app** (`mailtoFor`); nothing in the app claims to send mail.

**Paging** (both the members and payments tables, `src/lib/paging.js` +
`common/Pagination`): 10 a page by default (25 or 50 to choose), "Showing 1–10 of
24", previous / next and page numbers with "…" for gaps. Changing a filter,
search, sort or page size goes back to page 1; the page is clamped, so a list
that shrinks under you (a payment marked paid while viewing Pending) never
shows an empty page. Export CSV on payments takes every matching payment, not
just the page.

**The page:** four summary figures (active with retention, joined this week,
renewing soon, payment due), status chips with counts, an access filter listing
the actual plans and programmes, search by name or email, sortable Member /
Joined / Renewal columns, a member detail modal (access and what it opens,
renewal, activity, payments, vouchers, actions), and a card per member on phones.

## Payments — `src/lib/payments.js`

`#/dashboard/payments`. A payment stores `memberId`, what it paid for (`planId`,
or `programmeId` + `offerId`), `amount`, `paidAt` and `status` (`paid` |
`pending`). Its label is derived (`paymentLabel`: "Half year · 6 months"). The
members page reads the **same rows**: a pending payment is what makes a member
"Payment due".

- **Summary** (`paymentSummary`): received this month, split into memberships and
  programmes; pending amount and count; the KlubYou fee (`FEE_RATE`, 10%); and
  the **next payout** — payouts go out **every Friday** (`PAYOUT_WEEKDAY`) for
  what was paid since the last one, after the fee. (It used to say "Fri, after
  fees" beside this month's total.)
- **Marking a pending payment paid** (`markPaymentPaid`) asks first, records it as
  paid today, and — if it was the member's renewal — moves their `renewsAt` on
  by the period it paid for (`renewalAfterPayment`: the plan's months, or a
  subscription offer's length; a one-off moves nothing). "Payment due" clears.
- A pending payment offers **Mark as paid** and **Remind them**; a paid one
  offers **Send receipt**. All emails open the creator's mail app.
- **Filters** match the members page: status chips with counts, the same
  "what was paid for" list (`AccessFilter`, shared), and search by member name or
  email. Date and amount sort. The member's name opens the member detail modal
  (with only the actions this page has: email).
- **Export CSV** downloads the payments currently shown (date, member, email,
  for, amount, you keep, fee, status).

## Overview — `src/lib/stats.js`

Every headline number (member counts, plan mix, earnings this month, earnings
chart, per-programme revenue, attendance) is computed from `members` and
`payments`, so it can't disagree with those pages.

## Dates in mock data — `src/lib/datetime.js`

Mock dates are generated **relative to now** (`atOffset(days, hour)`,
`monthsAgo`, `monthsAhead`), so the demo never goes stale. A value from
`<input type="date">` is a local calendar day — build it with `fromDayInput`,
not `new Date("2026-09-14")`, which lands on the previous day west of UTC.

---

## Glossary

| Word                | Means                                                              | Don't call it          |
| ------------------- | ------------------------------------------------------------------ | ---------------------- |
| Programme           | Something bought: live or recorded                                 | course, product        |
| Class               | A scheduled session inside a live programme                        | lesson                 |
| Video               | An item inside a recorded programme's section                      | lesson                 |
| Everyday lesson     | A repeating session included with the subscription                 | daily class            |
| One-off class       | A single-date session included with the subscription               |                        |
| Run window          | A live programme's start date + number of weeks                    | duration               |
| Plan                | A membership product: length + price + what it opens               | tier, package, studio subscription |
| Lead                | Signed up on the page but hasn't bought anything                   | visitor                |
| Lifetime            | A programme bought once — never renews or lapses                   |                        |
| Bundle              | A named set of programmes/lessons that plans open                  | collection             |
| Extra benefit       | A perk with no content (UI name); `membershipFeatures` in code      | feature (in UI copy)   |
| Draft / Published   | The lifecycle shared by programmes, plans, bundles and benefits    | hidden / visible       |
| My page             | The creator's public page (`klubyou.co/<handle>`)                  | profile, storefront    |
