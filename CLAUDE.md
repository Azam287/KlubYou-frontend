# KlubYou frontend — notes for Claude

A creator dashboard prototype: **Vite + React 19 + react-router 6 (HashRouter),
plain CSS, no backend.** All data is in-memory React state seeded from
`src/data/mockData.js`; it resets on reload. British English throughout
(programme, colour, £).

## Commands

```bash
npm run dev      # http://localhost:5173/#/dashboard
npm test         # all suites in tests/ — `npm test -- membership` to filter
npm run lint     # must be 0 errors; 5 react-refresh warnings are pre-existing
npm run build
```

## Read before changing behaviour

- `docs/decisions.md` — the project's history: every product decision, why,
  and what the user already turned down. **Check it before proposing a design.**
- `docs/domain.md` — what programmes, everyday lessons, plans, bundles and extra
  benefits are, the rules between them, and **designs that were tried and
  rejected**. Don't reintroduce a rejected design; raise it with the user.
- `docs/architecture.md` — where things live, data flow, shared components, CSS pitfalls.
- `docs/testing.md` — how the tests work and what they can't see.

## Rules of this codebase

1. **Derive, don't store.** If a value can be computed from other data (totals,
   discounts, next class, "on now", schedule, plan contents, row order), compute
   it in `src/lib/`. Store only what a person decided.
2. **Business rules live in `src/lib/*.js` as pure functions.** Components call
   them; they don't re-implement them. Pass `now` in when time matters.
3. **All app data and every mutation live in `src/context/AppDataContext.jsx`.**
   Cascades (e.g. deleting a bundle removes it from plans) belong in the action.
   New actions go in the `useMemo` value *and* its dependency array.
4. **Drafts never reach members.** Programmes, plans, bundles and extra benefits
   are all `draft | published`, created as drafts. Members' views, the public
   page and the membership table show published only.
5. **Ask membership questions through the helpers**: `planHasBundle`,
   `planHasExtra`, `bundlesOf`, `planContent`. Reading `plan.bundles` directly
   is wrong for an "everything" plan (its array is empty) — this bug has shipped three times.
6. **Tooltips are `data-tip="…"`, not `title`.** Disabled buttons need a
   `<span className="tip-wrap" data-tip="why it's disabled">` wrapper.
   Icon-only buttons also need `aria-label`. Every button on the membership page
   and My page must have one (enforced by `tests/tooltips.test.jsx` and
   `tests/mypage.test.jsx`).
7. **`usePageHeader(title, subtitle, action)` — memoize `action`** or it loops.
8. **Use the CSS tokens** (`--ink`, `--coral`, `--line`, …) from `globals.css`.
   Amber means "worth a look"; there is no red.
9. **UI copy says what will happen**, in plain words, including the consequence
   ("Unpublish — members stop seeing it"). Match the existing voice.

## Editing

- **Do not run Prettier** — there's no config, and it reformats whole files.
  Match the surrounding style by hand: 2 spaces, double quotes, semicolons in
  `src/`, lines up to about 100 characters.
- Comments explain *why*, often including what went wrong before. Keep that
  voice; don't add comments that restate the code.
- **If you edit with scripted find-and-replace, fail loudly when the anchor
  isn't found.** A replacement that silently matches nothing has left props
  unwired here more than once. Grep for the exact text first.
- Before reusing a CSS class name, grep it — one class styling two different
  elements has broken layout here.
- Don't add dependencies, commit, or push without being asked. Leave `design/`
  and `graphify-out/` alone.

## Keeping the shared context current

These docs are the project's memory. Your own memory stays on this person's
machine, so nobody else sees it — anything a teammate or a later session needs
to know goes **in the repo**, in the same change as the code.

Before you finish any task that changed code:

| If…                                                                   | Update                    |
| --------------------------------------------------------------------- | ------------------------- |
| the user made, changed or reversed a product decision, rejected something you built, or stated how something should work | append to `docs/decisions.md` (format at the top of that file) |
| a rule, term, status or behaviour changed                             | `docs/domain.md`          |
| files moved, a shared component/action/pattern was added              | `docs/architecture.md`    |
| a convention, command or gotcha changed — or you hit a mistake worth warning about | this file        |
| tests or how to run them changed                                      | `docs/testing.md`         |

- Edit the section that's now wrong; don't append contradictions. Old
  decisions are never rewritten — add a new entry that reverses them.
- Keep it short. Record the *why* and the rejected alternative; the code shows the *what*.
- A Stop hook (`scripts/docs-check.mjs`, set in `.claude/settings.json`) blocks
  finishing when uncommitted code is newer than the docs. If there's genuinely
  nothing to record, run `touch .claude/docs-reviewed` and say so in one line —
  don't write filler to satisfy it.

## Verifying a change

1. `npm test`, `npm run lint`, `npm run build` — all green.
2. For a bug fix or new rule, add an assertion to the relevant suite in `tests/`,
   then **break the fix once and confirm the suite fails**.
3. The tests render to HTML with no browser. **They can't see layout, colour,
   hover or clicks.** When a change is visual, say plainly that appearance wasn't
   verified and ask the user to check it in `npm run dev` — don't imply it was.
