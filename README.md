# KlubYou — creator dashboard (frontend prototype)

KlubYou lets a fitness or wellness creator run their studio online: a public
page, live and recorded **programmes** people buy, **everyday lessons** that
come with a subscription, a **membership** sold as plans, and the members and
payments that follow.

This repository is the creator's dashboard. **It is frontend-only.** There is
no backend and no persistence: everything lives in React state, seeded from
[`src/data/mockData.js`](src/data/mockData.js), and resets on reload.

## Quick start

```bash
npm install
npm run dev        # http://localhost:5173 — opens on onboarding; the dashboard is at #/dashboard
```

| Command         | What it does                                                          |
| --------------- | --------------------------------------------------------------------- |
| `npm run dev`   | Vite dev server with hot reload                                       |
| `npm test`      | Runs every `tests/*.test.js(x)` suite ([how](docs/testing.md))        |
| `npm run lint`  | ESLint. Expect **0 errors**; 5 `react-refresh` warnings are known     |
| `npm run build` | Production build into `dist/`                                         |

Requires Node 20.11+ (the test runner uses `import.meta.dirname`).

## Stack

Vite 6 · React 19 · react-router-dom 6 (`HashRouter`) · plain CSS with design
tokens · ESLint 9. No UI library, no state library, no CSS framework, no
TypeScript, no Prettier.

## Documentation

| Read this                                        | When                                                          |
| ------------------------------------------------ | ------------------------------------------------------------- |
| [docs/decisions.md](docs/decisions.md)           | First. Why the app is the way it is, and ideas already turned down |
| [docs/domain.md](docs/domain.md)                 | What a programme, lesson, plan, bundle and benefit are, and the rules between them |
| [docs/architecture.md](docs/architecture.md)     | Before changing code. Where things live and how data flows    |
| [docs/testing.md](docs/testing.md)               | Before claiming a change works                                |
| [CLAUDE.md](CLAUDE.md)                           | Working with Claude Code — it reads this automatically        |

## Working with Claude Code

Everything Claude needs is in the repo, so it works the same for everyone:
`CLAUDE.md` loads automatically, and `.claude/settings.json` adds a hook that
won't let Claude finish a code change until the docs are updated (or it has
confirmed nothing needs updating). **Commit the doc updates with the code** —
that's how the next person, and their Claude, picks up the context.

If you'd rather not have the hook for a session, disable it from `/hooks`.

## Pages

| Route (`#/dashboard/…`) | Page             | Source                                         |
| ----------------------- | ---------------- | ---------------------------------------------- |
| *(index)*               | Overview         | `src/components/dashboard/overview/`           |
| `page`                  | My page          | `src/components/dashboard/mypage/`             |
| `classes`               | Everyday lessons | `src/components/dashboard/classes/`            |
| `schedule`              | Schedule         | `src/components/dashboard/schedule/`           |
| `programmes`, `programmes/:id` | Programmes | `src/components/dashboard/programmes/`        |
| `membership`            | Membership       | `src/components/dashboard/membership/`         |
| `members`               | Members          | `src/components/dashboard/members/`            |
| `payments`              | Payments         | `src/components/dashboard/payments/`           |

Onboarding (`#/onboarding/account → otp → channel → done`) is in
`src/components/onboarding/`.

## Other folders

- `design/` — design canvases (`*.dc.html`) and a programme-flow redesign mock.
  Reference material, not built.
- `graphify-out/` — generated knowledge-graph output. Not part of the app.
