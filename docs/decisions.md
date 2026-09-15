# Decision log

Product and design decisions, newest at the bottom, with the reason and what
was tried instead. This is the shared memory of the project: it's how someone
(or Claude) starting fresh learns *why* the app is the way it is, and which
ideas have already been tried and turned down.

**Claude: append to this file whenever the user makes or reverses a product
decision, rejects something you built, or states a preference about how the app
should work.** Use the format below. Don't rewrite old entries — if a decision is
reversed, add a new entry that says so and link back.

```md
### YYYY-MM-DD — Short title
**Decision:** what is now true.
**Why:** the reason given, or the problem it solves.
**Rejected:** what was tried or proposed instead, and why it lost. (omit if none)
**Where:** files, or a section of domain.md.
```

---

## Up to 2026-09-14 — built before this log existed

These were reconstructed from the working sessions that built the app, so they
carry no individual dates.

### Joining links never block publishing a live programme
**Decision:** a live programme can be published with classes that have no joining link. Missing links are reminders, not blockers.
**Why:** a class weeks away doesn't have its link yet; waiting would keep the whole programme off sale.
**Where:** `readiness()` in `src/lib/programme.js` (links item is `optional` for live).

### "How it's sold" must be decided
**Decision:** publishing needs either at least one offer or an explicit "studio subscribers only". An untouched programme is undecided.
**Why:** the checklist used to tick "studio subscribers only" by default, claiming a decision nobody made.
**Where:** `pricingDecided`, `isStudioOnly`.

### Run window before classes
**Decision:** a live programme's start date and number of weeks are set before any class, and a repeating series fills the window.
**Why:** the window decides how many classes a weekly series creates; without it the creator had to guess a count.
**Where:** `scheduleWindow`, `expandSeries`, `RunWindowFields.jsx`.

### Every programme has a name, description and intro video
**Decision:** the intro video is shown to people before they buy, and publishing waits for it.
**Where:** `introVideoOf`, `IntroVideoCard.jsx`, readiness `intro` item.

### Recorded content is called "videos"
**Decision:** items in a recorded programme are *videos*, not *lessons*.
**Why:** "lesson" also meant everyday lessons — one word for two things.

### Everyday lessons are their own section
**Decision:** a simple kind of live class that runs on set weekdays, in its own sidebar entry, separate from programmes. Named **Everyday lessons** (was "daily classes").
**Why:** the user wanted a class that runs every day without the programme's complexity. The line against programmes is commercial: a programme is bought, an everyday lesson comes with the subscription.
**Where:** `src/lib/everyday.js`, `src/components/dashboard/classes/`.

### One-off classes kept, forms kept apart — and the merge was reverted
**Decision:** one-off classes exist alongside repeating everyday lessons. The repeating form has no "just once" option; the one-off form has no repeat section.
**Rejected:** collapsing one-offs and everyday lessons into a single merged section. It was built, and the user asked for the previous UX back ("I like previous UX").

### A studio-wide schedule page
**Decision:** `#/dashboard/schedule` shows every class and lesson by week. It stores nothing — it's derived from programmes and lessons, drafts included. The "Today" badge is white on dark.
**Where:** `src/lib/schedule.js`, `src/components/dashboard/schedule/`.

### Modal fields align the same way everywhere
**Decision:** side-by-side inputs (`two-col`) start level; the vertical rhythm rule doesn't apply inside them. Applies to every modal.

### Membership: plans, bundles, extra benefits
**Decision:** the membership page sells the studio subscription as plans (modelled on a tiered pricing page with a comparison table). Plans don't hold content directly: they open **bundles** (named sets of programmes and lessons, managed on their own tab) and include **extra benefits** (perks with no content). Every plan has a name and description.
**Why:** the same set of content backs several plans; describing it once stops plans drifting apart.
**Where:** `src/lib/membership.js`, docs/domain.md → Membership.

### One editable table plus a member preview
**Decision:** the Plans tab has one table — bundles and extras as rows (not separated by header), plans as columns — and a "Preview as member" modal.
**Rejected:** a "detailed view" and a "user view" of the table behind a toggle. The user found the two views confusing and disliked the UI.
**Also:** bundle rows expand in place to show what's inside, so you can see which programme comes from which bundle.

### "Everything" belongs to plans only
**Decision:** a plan is either Everything or a chosen set. An Everything plan includes every bundle and extra, now and later, and nothing can be switched off. Bundles have no "everything" option.
**Why:** a bundle that follows everything would be a redundant second way to say it.

### Draft / published for plans, bundles and extras
**Decision:** all three are created as drafts and can be published or unpublished. Only published ones appear to members **and in the Plans-tab table**. Plans choose extra benefits in their own form, next to bundles.
**Rejected:** a `hidden` flag on rows, which was replaced by the real lifecycle.

### The extras tab is "Extra benefits", styled like bundles
**Decision:** renamed from "Extras"; uses the same card layout as the Bundles tab.

### Row order is set in the table, and kinds mix
**Decision:** rows are reordered from the table's menu. Bundles and extras share one sequence — a bundle can sit between two extras.
**Rejected:** ordering by kind (bundles first, then extras), and reordering from the cards.

### Plans tab: table or cards
**Decision:** a bordered two-icon switcher — table icon shows the table, list icon shows plan cards.

### Editing a plan from its column: a pencil
**Decision:** each plan column header has a pencil button that opens the plan form.
**Rejected:** a ⋯ menu in the header ("3 dots doesn't look good"), and turning the plan name into a button — the name lost its centring and the best-seller name went coral ("it is worst").

---

## 2026-09-15

### Membership audit fixes
**Decision:** an Everything plan counts as using every bundle everywhere (cards, delete warning, preview); new rows join the end of the shared order; deleting an extra removes it from plans; "Cheapest way in" is the lowest price; draft extras aren't counted; a plan of extras only can be saved; a published plan that opens nothing is warned about; switching a plan to Everything keeps its old picks.
**Where:** `MembershipPage.jsx`, `AppDataContext.jsx`, `lib/membership.js`; pinned in `tests/membership*.test.*`.

### Tooltips on every membership control
**Decision:** every button and action on the membership page has a tooltip, and a disabled button's tooltip says what it's waiting for. Tooltips use `data-tip`, shown by one `TooltipLayer`; not native `title`.
**Where:** `src/components/common/TooltipLayer.jsx`, `src/lib/tooltip.js`, `tests/tooltips.test.jsx`.

### My page is a simple influencer page
**Decision:** My page is a link-in-bio style public page: studio name, tagline, about you, intro video, outbound links, then every published membership and programme. The only styling controls are background and text colour. Edits show live; there's no publish step for the page.
**Why:** the user wanted it simple to understand and edit, with minimal controls.
**Rejected / removed:** per-section toggles ("Plans on your page"), the drop-in card (its price was made up), the cover-colour swatches, the header stats (members, classes per week, rating), the plan-length picker on the membership card, and a "Publish changes" button that only showed a toast.
**Where:** `src/lib/page.js`, `src/components/dashboard/mypage/`, docs/domain.md → My page.

### My page preview looks like a social creator page
**Decision:** the preview is a phone showing a link-in-bio style page — cover, ringed avatar, @handle, social icons, pill link buttons, "Watch my intro" card, membership cards with savings chips, a swipeable programme row using each programme's thumbnail, and a sticky "Join from £…" button. Unlabelled social links become icons; labelled ones and other sites stay buttons. Still only two colours.
**Why:** the user asked for it to look more like social media influencers' pages.
**Rejected:** the desktop browser-window frame used before.
**Where:** `PagePreview.jsx`, `src/styles/mypage.css`, `socialLinks` / `buttonLinks` / `cheapestPlan` in `src/lib/page.js`.

### Header image upload and a web view
**Decision:** creators can upload a header image (replace or remove it; without one the header is tinted from the page colours). The preview has a Phone / Web switch; the web view shows the same page in a browser window with a wider layout, grids instead of the swipe row, and the join button in a top bar.
**Why:** the user asked for an option to update the header image and to see a web view.
**Where:** `HeaderImageEditor.jsx`, `PagePreview.jsx` (`device`), `imageFileProblem` / `PREVIEW_DEVICES` in `src/lib/page.js`.

### Memberships on My page use the members' comparison
**Decision:** the membership section of My page is the "What members see" layout — plan cards (best seller, price, % off, Choose) and a "What you get" table. It's one shared component, `MembershipComparison`, used by both the membership preview modal and My page, restyled on My page from the page's two colours. On a phone the cards swipe and the table scrolls with its first column fixed; on the web the cards sit in a row.
**Why:** the user wanted the subscription view on their page to match the members' comparison (shown with a screenshot of the modal).
**Rejected:** the earlier stacked membership cards with description and "Save %" chips.
**Where:** `src/components/dashboard/membership/MembershipComparison.jsx`, `PagePreview.jsx`, `src/styles/mypage.css`.

### Purple in the page colour choices
**Decision:** My page's colour presets include purple — Lavender (`#ece6f7`) and Purple (`#3a2e63`) backgrounds, and Purple (`#5b3fa0`) text. Still two colours; these are just more starting points.
**Why:** the user asked for purple to be available.
**Where:** `BACKGROUND_PRESETS` / `TEXT_PRESETS` in `src/lib/page.js`.

### An accent colour for the page
**Decision:** My page has a third colour, **Accent** (default Purple `#3a2e63`), with one picker. It colours the avatar, intro video, link icons, buttons, best-seller highlight and comparison ticks. Button labels are computed from it (white or dark). This reverses "still only two colours" from the entries above.
**Why:** the user wanted one picker to control the purple on the logo, intro, buttons and so on (shown with a phone-preview screenshot), rather than it following the text colour.
**Also:** the Coral accent preset is `#c2412a`, not the dashboard's `#e0543a`, because no label colour reaches 4.5:1 on the lighter coral.
**Where:** `ACCENT_PRESETS`, `onAccent`, `accentVisible` in `src/lib/page.js`; `ColourEditor.jsx`; `--pg-accent` / `--pg-on-accent` in `src/styles/mypage.css`.

### Choosing which programmes appear on My page
**Decision:** the My page editor lists published programmes with tick boxes to show or hide each, and a "Show all" button (off, with a reason, when all are shown). The hidden ones are stored (`studio.hiddenProgrammes`), so newly published programmes appear by default. Memberships still show every published plan.
**Why:** the user wanted to choose which published programmes appear, plus a show-all button. This replaces "every published programme is shown" from the entries above.
**Where:** `ProgrammePicker.jsx`, `setProgrammeOnPage` / `showAllProgrammes` in `AppDataContext.jsx`, `pageProgrammes` / `publishedProgrammes` in `src/lib/page.js`.

### The My page editor can be hidden
**Decision:** a "Hide editor" / "Show editor" button in the preview bar collapses the editor column so the preview takes the full width. It's a view setting only — not saved; the page always opens with the editor showing.
**Why:** the user asked for a button to collapse the editor.
**Where:** `MyPagePage.jsx` (`editorOpen`, `.page-wrap.solo`).

### The editor's collapse control is an arrow on its edge
**Decision:** the text "Hide editor / Show editor" button is replaced by a round arrow handle pinned to the editor's right edge (centred on the gap, sticky below the top bar): ‹ hides, › in the same spot shows. On narrow screens it sits above the editor.
**Why:** the user wanted just arrows, anchored to the right of the editor.
**Rejected:** a labelled button in the preview bar (the entry above).
**Where:** `MyPagePage.jsx` (`.ed-col`, `.ed-track`, `.ed-handle`), `src/styles/mypage.css`.

### My page editor as collapsible, reorderable tiles
**Decision:** header image, studio name and tagline stay as plain fields at the top. About you, Intro video, Links, Memberships, Programmes and Colours are tiles, all collapsed by default with a one-line summary. The five section tiles can be dragged (or moved with arrow keys) and that order is the order of sections on the public page (`studio.sectionOrder`). Colours collapses but stays last, since it isn't a place on the page.
**Why:** the user asked for everything except header, studio name and tagline to be collapsible tiles, collapsed by default and reorderable. This replaces the fixed section order in the entries above.
**Where:** `EditorTiles.jsx`, `AboutEditor.jsx`, `IntroVideoEditor.jsx`, `MyPagePage.jsx`; `PAGE_SECTIONS`, `sectionOrderOf`, `moveItem`, `dropIndex`, `sectionSummary` in `src/lib/page.js`.

### Sections can be hidden from My page
**Decision:** each section tile (About you, Intro video, Links, Memberships, Programmes) has an eye that hides the section from the page without losing its content or position; the tile stays, faded and marked Hidden. Hiding Memberships also hides the "Join from" button. The header and Colours can't be hidden.
**Why:** the user asked for an option to hide sections.
**Where:** `studio.hiddenSections`, `isSectionHidden` / `visibleSections` in `src/lib/page.js`, `setSectionHidden` in `AppDataContext.jsx`, `EditorTiles.jsx`.

### My page audit fixes
**Decision:** fixed gaps found auditing My page —
- the membership comparison reads every published programme, not the page's filtered list (hiding a programme was shrinking what memberships appeared to include);
- a profile photo can be uploaded for the avatar (`avatarImage`); the header image and photo share one `ImageField` component, which replaces `HeaderImageEditor`;
- email links are recognised and shown as "Email";
- subscription prices read "£12/month" / "£30 every 3 months", not "£12/1 month";
- members-only programmes don't offer "Join a membership" when no membership is on the page;
- "Copy page link" only says Copied once the clipboard accepted it;
- an empty studio name is flagged; the hidden editor stays mounted so tiles and messages survive hiding it;
- a closed tile's toggle no longer points at a body that isn't rendered; labelled icons on the page have `role="img"`;
- the test runner reports a file that fails to build instead of crashing.
**Not done:** the page handle (`klubyou.co/maya`) still can't be changed from My page — it's set at sign-up, and changing a live URL breaks links already shared, so that's a product decision.
**Where:** `PagePreview.jsx`, `MyPagePage.jsx`, `ImageField.jsx`, `ProfileEditor.jsx`, `EditorTiles.jsx`, `src/lib/page.js`, `scripts/run-tests.mjs`.

### My page has a publish step again, and the intro video plays
**Decision:** My page edits are a draft; a "Publish changes" button appears in the header only when the draft differs from the published page, and the subtitle says so. This reverses "changes show as you type — no publish step" from earlier entries. YouTube and Vimeo intro links now play in an embedded player instead of a placeholder card; other links keep the card. The demo intro link is a real, openly licensed video (Big Buck Bunny) because the old one (`youtu.be/maya-welcome`) wasn't a real video.
**Why:** the user asked for a publish button whenever anything changes, and reported the intro video preview wasn't showing.
**Where:** `pageSnapshot` / `pageChanged` / `videoEmbedOf` in `src/lib/page.js`; `publishedPage` / `publishPage` in `AppDataContext.jsx`; `MyPagePage.jsx` (header); `PagePreview.jsx`; `IntroVideoEditor.jsx`.

### Members page rebuilt on plans and offers
**Decision:** members point at the Membership plan (`planId`) or programme offer (`programmeId` + `offerId`) they bought, and payments at what they paid for; every label, price and length is derived. Status adds Payment due, Ending and Renews soon; recorded programmes show videos watched, live ones classes attended out of held; programme subscriptions can be stopped. Actions are real: stopping asks first and runs to the end of paid time; gifting moves the renewal date; vouchers are recorded and emailed; emails and receipts open the creator's mail app. The page gained summary figures, status chips with counts, plan/programme filters, email search, sorting, a member detail modal and a card layout on phones. Demo data was corrected: no member on a draft programme, no lapsed lifetime purchase, no one-off buyer shown as renewing.
**Why:** the user asked to fix every gap found auditing the members page against the Membership and Programmes work.
**Rejected / removed:** `planLength`, stored `initials` and `attendedOf` on members; `for` text on payments; toast-only `memberAction` / `memberActionByName`; "Studio subscription" / "Single programme" wording.
**Where:** `src/lib/members.js`, `src/components/dashboard/members/`, `src/styles/members.css`, `PaymentTable.jsx`, `AppDataContext.jsx`, `mockData.js`.

### Payments page brought in step with members
**Decision:** the payments page reads the same rows as the members page and acts on them. Pending payments can be marked paid (with confirmation), which moves the member's renewal on by the period paid for and clears Payment due; or a reminder email opened. Receipts are only offered for paid payments. The summary uses the same strip as Members and Membership, splits income into memberships and programmes, and shows a real next payout (every Friday, for what came in since the last). Filters (status with counts, a shared "what was paid for" list, member search), date/amount sorting, member details, CSV export and a phone card layout were added.
**Why:** the user asked to update the Payments page to be in sync with the members work.
**Rejected / removed:** "Next payout" as this month's total with a hard-coded "Fri"; the stat-card layout that differed from the other pages.
**Where:** `src/lib/payments.js`, `src/components/dashboard/payments/`, `src/components/dashboard/shared/AccessFilter.jsx`, `markPaymentPaid` in `AppDataContext.jsx`.

### Members and payments are paginated
**Decision:** both tables show 10 rows a page by default (25 / 50 selectable) with a shared Pagination bar under the table. Filters, search, sort and page size reset to page 1; the page is clamped when the list shrinks. CSV export still covers every matching payment.
**Why:** the user asked for both pages to be paginated.
**Where:** `src/lib/paging.js`, `src/components/common/Pagination.jsx`, `MembersPage.jsx`, `PaymentsPage.jsx`.

### Documentation and tests live in the repo
**Decision:** `README.md`, `CLAUDE.md`, `docs/`, and `npm test` suites in `tests/` are the shared context for everyone working on the project, with or without Claude. Docs are updated in the same change as the code (enforced by a Stop hook in `.claude/settings.json`).
**Why:** context held only in one person's Claude memory or a temp folder is lost to everyone else — the first set of test suites was wiped with a temp directory.
