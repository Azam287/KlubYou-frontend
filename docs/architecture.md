# Architecture

A single-page React app with no backend. All state is in memory and resets on
reload. This page is the map; the rules the code enforces are in
[domain.md](domain.md).

## Layout of `src/`

```
src/
├── main.jsx, App.jsx        entry point and routes (HashRouter)
├── data/mockData.js         the initial state for everything — the demo's "database"
├── lib/                     pure functions: every business rule lives here
│   ├── programme.js         programme types, run window, series, readiness, offers
│   ├── everyday.js          everyday lessons: patterns, next run, on now
│   ├── schedule.js          the derived studio timetable
│   ├── sessions.js          session ids, members' links (JOIN_DOMAIN), host names — imports nothing
│   ├── attendance.js        who a session is for, register marking, session reports, quiet members
│   ├── membership.js        plans, bundles, extra benefits, pricing maths, table rows
│   ├── overview.js          the overview: fair earnings comparison, to-dos, coming up, activity
│   ├── members.js           members: access, status, renewal, activity, filters, actions
│   ├── payments.js          payments: summary, payouts, filters, marking paid, receipts, CSV
│   ├── search.js            one search rule for every list (case, accents, every word)
│   ├── paging.js            splitting a list into pages (members and payments tables)
│   ├── page.js              the public page: links, colour contrast, what it shows
│   ├── stats.js             every dashboard number, money formatting, platform fee
│   ├── datetime.js          dates in the studio's zone: formatting, days, date-input parsing
│   ├── locale.js            the studio's zone and currency: money(), partsOf/zonedDate — imports nothing
│   ├── settings.js          settings rules: page address, name, what a change will do
│   └── tooltip.js           tooltip placement maths
├── context/
│   ├── AppDataContext.jsx   ALL app data + every action that changes it
│   ├── ToastContext.jsx     showToast(message)
│   ├── PageHeaderContext.jsx  usePageHeader(title, subtitle, action)
│   └── OnboardingContext.jsx  onboarding form state
├── components/
│   ├── common/              Icon, Modal, ConfirmModal, KebabMenu, TooltipLayer, Brand
│   ├── layout/              DashboardLayout, Sidebar, Topbar
│   ├── onboarding/          the four onboarding steps
│   └── dashboard/<page>/    one folder per page, with its cards and modals
└── styles/                  globals.css (tokens + shared) and one file per area
```

## Data flow

```
mockData.js ──seeds──▶ AppDataContext (useState per collection)
                            │
             useAppData() ◀─┘  { programmes, everydayLessons, bundles, studioPlans,
                            │    membershipFeatures, members, payments, …, and actions }
                            ▼
                  page component ──passes data to──▶ lib/*.js selectors ──▶ render
                            │
                  user action ──▶ context action (e.g. updateBundle) ──▶ setState ──▶ re-render
```

- **One store.** `AppDataContext` owns every collection and exposes named actions
  (`addBundle`, `publishProgramme`, `moveMembershipRow`, …). Components never
  hold a copy of app data in their own state; forms keep a local draft and hand
  it to an action on save.
- **Actions do the cascading.** Deleting a bundle removes its id from every plan;
  deleting a benefit does the same for `plan.extras`. Put that kind of cleanup in
  the action, not in the component that calls it.
- **Actions toast.** Mutations that a user triggers call `showToast` with what
  happened ("Bundle published — members can see it").
- **Selectors are pure.** `src/lib/*` functions take data and return data. No
  React, no context, no DOM (except `TooltipLayer`, which is a component). Pass
  `now` in when time matters, so functions stay testable.
- **IDs** for new records come from `nextId(prefix)` in the context (`bundle-1000`, …).
- **Attendance** is one more collection (`attendance`, seeded by `initialAttendance`
  from the same rules the app uses, with a hash instead of `Math.random`). Its one
  action is `markAttendance(session, member, present)`; records otherwise come from
  the join site. Anything that counts classes attended (`progressOf`,
  `averageAttendance`) takes `attendance` — pass it in the page's `ctx`.
- **Zone and currency are applied, not passed.** `AppDataProvider` calls
  `applyStudioLocale(studio)` at the top of every render, and `money()` and every
  date helper read it. This is the one deliberate exception to "pass it in": ~60
  call sites would each need the zone, and a missed one silently uses the
  browser's. The provider's children are keyed by zone and currency, so changing
  either remounts the app — pages memoize on data and wouldn't notice. Tests call
  `applyStudioLocale` themselves and reset it.
- **`members.js` and `attendance.js` can't import each other**; both read session
  names from `sessions.js`, which imports nothing.

### Adding a new action

1. Write any rule it needs as a pure function in the right `src/lib/` file.
2. Add a `useCallback` action in `AppDataContext.jsx` near its siblings, list its
   dependencies, toast the result if the user triggered it.
3. Add it to the context `value` object (it appears in **two** lists near the
   bottom of the file — the `useMemo` value and its dependency array).
4. Call it from the component via `useAppData()`.

## Routing and page chrome

- `HashRouter`, so URLs look like `/#/dashboard/membership`. Routes are in `App.jsx`.
- `DashboardLayout` renders `Sidebar`, `Topbar` and the page. The sidebar items
  are the `NAV_ITEMS` array in `Sidebar.jsx`.
- A page sets its header with `usePageHeader(title, subtitle, action)`. **The
  `action` element must be memoized** (`useMemo`) or the effect re-runs forever.

## Shared components

| Component       | Use it for                                                                  |
| --------------- | --------------------------------------------------------------------------- |
| `Modal`         | Every dialog. `open`, `onClose`, `title`, `footer`, `maxWidth`. Esc and backdrop close it |
| `ConfirmModal`  | Every destructive confirmation. `message`, `detail`, `confirmLabel`, `confirmTip`, `cancelTip` |
| `KebabMenu`     | Row/card menus. `items: [{ label, icon, tip, danger, onClick } \| null]`; `tip` on the menu itself |
| `Icon`          | SVG icons by name. Add new ones to the map in `Icon.jsx`                     |
| `TooltipLayer`  | Mounted once in `App.jsx`. Don't mount it again — use `data-tip` (below)     |
| `SearchInput`   | Every list's search box: icon, clear button (and Esc). Filter with `matchesQuery(fields, query)` from `lib/search.js`; pair with `SearchEmpty` for "No … match" |
| `Pagination`    | Under a table: count, pages, page size. Pair with `paginate()` from `lib/paging.js`; reset the page to 1 when filters or sort change |
| `JoinLink` (`dashboard/shared/`) | A members' link with its copy button. Anything that copies a class or lesson link copies this, never the hosting address |
| `useCopyLink` (`dashboard/shared/`) | Copy a link (adds `https://`), toast only once the clipboard took it |
| `MembershipComparison` (`dashboard/membership/`) | Plan cards + "What you get" table. Used by the member preview modal and My page; pass `picture` to draw the Choose buttons instead of rendering them |

### Tooltips

Put `data-tip="…"` on any element. One layer shows it on hover and keyboard
focus (not on touch), on `<body>` so tables and modals don't clip it.

```jsx
<button data-tip="Publish — members can see it" aria-label="Publish">…</button>
<button data-tip="…" data-tip-side="left">…</button>          // top (default) | bottom | left | right

// A disabled button gets no hover, so wrap it and put the tip on the wrapper —
// and make the tip say what the button is waiting for:
<span className="tip-wrap" data-tip={name ? "Save changes" : "Give it a name first"}>
  <button disabled={!name}>Save</button>
</span>
```

- Don't use `title=` for tooltips — it doubles up with `data-tip` and can't be styled.
- Icon-only buttons still need an `aria-label`; `data-tip` is not a label.
- Every button, link, ⋯ menu trigger and menu item in the app has one, and
  `tests/tooltips-app.test.js` fails the build of the suite if a new one doesn't
  (it reads the source, since menus and modals don't render in a test). Native
  `title` tooltips are gone and flagged if they come back; `title` as a Modal or
  ConfirmModal prop (a heading) and on an `<iframe>` (its accessible name) is fine.
- Put the tip **last** among the attributes, and say what will happen, including
  the consequence ("Unpublish — members stop seeing it").

## Styling

Plain CSS. `src/index.css` imports `styles/globals.css` then one file per area
(`programmes.css`, `classes.css`, `schedule.css`, `membership.css`, …).

**Design tokens** (in `globals.css` `:root`) — use these, don't hard-code colours:

| Token          | Value     | For                         |
| -------------- | --------- | --------------------------- |
| `--paper`      | `#f2f0f4` | page background             |
| `--card`       | `#fcfbfd` | cards, panels, modals       |
| `--ink`        | `#221a38` | text, dark UI               |
| `--ink-soft`   | `#5b5470` | secondary text              |
| `--coral`      | `#f15b41` | primary action, brand       |
| `--coral-deep` | `#d8452d` | coral hover, danger text    |
| `--line`       | `#e5e1ec` | borders                     |
| `--line-soft`  | `#ece9f1` | subtle dividers             |
| `--good`       | `#2e7d50` | success, "included"         |

Amber `#e39a2c` (text `#a9701a`) means "worth a look" — clashes, warnings, a
plan that opens nothing. There is no separate red: destructive buttons are coral.

Fonts: **Bricolage Grotesque** for headings and big numbers, **Hanken Grotesk** for body.

**Shared classes** worth knowing: `btn` + `btn-coral` / `btn-ghost` / `btn-primary`
/ `btn-block`; form fields `ctrl` > `lbl` + `field` + `hint`; `two-col` for
side-by-side fields; `pill` + `active` / `sched` / …; `segbtns` > `seg` (all in
`globals.css`). Some shared-looking classes live in an area file instead:
`btn-sm` in `programmes.css`, `banner` in `classes.css`, `tabs` > `tab` in
`membership.css`. Grep before assuming.

### CSS pitfalls this codebase has hit

- **Specificity over intent.** `.sday-h span` beat `.sday-now`, so a white badge
  rendered grey; `.mtable td` beat `.mt-what`. When a style "doesn't apply",
  check what's outranking it before adding `!important`.
- **One class, two elements.** `.mt-sub` once styled both a `<span>` and a
  `<tr>`; its `display: block` pulled the row out of the table. Grep a class
  name before reusing it.
- **Sibling rhythm rules leak.** `.ctrl + .ctrl { margin-top }` also fired inside
  `.two-col`, pushing the second column down. Scope spacing rules.
- **`display: block` on a `<button>`** makes it shrink-to-fit and left-aligned —
  it won't centre in a table header.
