# Testing

```bash
npm test                  # every suite
npm test -- membership    # only files whose name contains "membership"
npm run lint              # 0 errors expected (5 react-refresh warnings are known)
npm run build
```

Run all three before calling a change done.

## How it works

There is no test framework and **no browser**. `scripts/run-tests.mjs` bundles
each `tests/*.test.js(x)` with esbuild (so JSX and app imports just work), runs
it with Node from the project root, and reports PASS/FAIL counts.

A suite is a plain script:

```jsx
import { renderToString } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { ok, done, source, clean } from "./harness";
import PlanCard from "../src/components/dashboard/membership/PlanCard.jsx";
import { planIsHollow } from "../src/lib/membership";
import { initialStudioPlans as PL, initialBundles as B, initialProgrammes as P,
  initialEverydayLessons as L } from "../src/data/mockData";

// A pure rule — call the function.
const starter = PL.find((p) => p.id === "sp1"); // its only bundle is a draft
ok("a plan whose bundles are all drafts opens nothing", planIsHollow(starter, B, P, L));

// A component — render it to HTML and look for what should be there.
const html = clean(renderToString(<MemoryRouter><PlanCard plan={…} … /></MemoryRouter>));
ok("the card says it opens nothing", html.includes("Opens nothing yet"), html.slice(0, 200));

// Something server rendering can't see — read the source.
ok("the header button has a tip", source("src/components/dashboard/membership/MembershipPage.jsx")
  .includes("data-tip={ADD_TIP[tab]}"));

done();
```

A test file that fails to build (a bad import, a syntax error) is reported as
"did not build" with the reason, and the other files still run.

`ok(label, condition, detail)` prints the label; `detail` is printed only on
failure, so put the actual value there. Name the file `something.test.js`
(or `.jsx` if it contains JSX) and the runner picks it up.

Pages that use context need the providers:

```jsx
<ToastProvider><AppDataProvider><PageHeaderProvider><MemoryRouter>
  <MembershipPage />
</MemoryRouter></PageHeaderProvider></AppDataProvider></ToastProvider>
```

## What this can and can't tell you

**Checks:** business rules, what text and controls render, which classes and
attributes are present, that CSS rules exist.

**Can't check — say so rather than implying otherwise:**

- **How anything looks.** Alignment, colour, spacing, overflow — no browser, no
  screenshots. Look at it in `npm run dev`.
- **Interaction.** Clicks, typing, hover, focus. `renderToString` renders once.
- **Effects.** Anything set in `useEffect` — e.g. the header action from
  `usePageHeader` — isn't in the HTML. Assert on the source instead, and add a
  comment saying why.
- **Content that only renders when open.** `KebabMenu` items render only while
  the menu is open, so menus are checked at source.

## Writing assertions that can fail

Two habits that have caught real mistakes here:

1. **Break it on purpose once.** After a new assertion passes, revert the fix it
   guards (or delete the attribute it checks) and confirm the suite goes red.
   An assertion that passes either way is worse than none.
2. **Assert both ends of a prop.** A component can support a prop that the page
   never passes. (That happened: the plan form could list extras, but the page
   didn't pass them, so the picker silently rendered nothing.)

Also: React escapes `'` as `&#x27;` and `&` as `&amp;` — run HTML through
`clean()` before matching text, and prefer matching whole class attributes
(`class="mt-edit"`) over prefixes (`mt-`) that also match neighbours.

## Current suites

| File                          | Covers                                                             |
| ----------------------------- | ------------------------------------------------------------------ |
| `membership.test.js`          | Membership model: everything vs chosen, drafts, order, pricing     |
| `membership-page.test.jsx`    | Membership page regressions: table, preview, plan form, data actions |
| `tooltips-app.test.js`        | Every button, link, menu and menu item in `src/components` has a tooltip; no native `title` tooltips |
| `tooltips.test.jsx`           | Every membership control has a tooltip; placement maths            |
| `settings.test.jsx`           | Zone maths (summer time, half-hour zones), every time rule in the studio's zone, a scan for browser-clock calls, currency, settings rules, Settings page |
| `attendance.test.jsx`         | Members' links, session ids, who a session is for, demo records, marking, session reports, quiet members, Attendance pages |
| `members.test.js`             | Member rules: access, status, renewal, activity, filters, actions, payment labels |
| `members-page.test.jsx`       | Members page: summary, filters, table, details, gift/voucher/stop, payments table |
| `overview.test.jsx`           | Overview: earnings comparison, who's here, attention list, coming up, activity, page |
| `search.test.jsx`             | The search rule, the search box, and where search appears            |
| `paging.test.jsx`             | Paging rules and the Pagination bar                                |
| `payments.test.js`            | Payment rules: summary, payouts, filters, marking paid, emails, CSV |
| `payments-page.test.jsx`      | Payments page: summary, filters, table, actions, export, member details |
| `mypage.test.jsx`             | My page: colours and contrast, links, what the page shows, editor  |

Programmes, everyday lessons and the schedule have **no suites in the repo
yet** — their rules are in `src/lib/programme.js`, `everyday.js` and
`schedule.js` and are good first candidates.
