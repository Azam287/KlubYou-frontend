// My page: the creator's public page and its editor. Rules are in
// src/lib/page.js; see docs/domain.md → My page.
import { renderToString } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { ok, done, source, clean } from "./harness";
import MyPagePage from "../src/components/dashboard/mypage/MyPagePage.jsx";
import PagePreview from "../src/components/dashboard/mypage/PagePreview.jsx";
import LinksEditor from "../src/components/dashboard/mypage/LinksEditor.jsx";
import ColourEditor from "../src/components/dashboard/mypage/ColourEditor.jsx";
import { ToastProvider } from "../src/context/ToastContext.jsx";
import { AppDataProvider } from "../src/context/AppDataContext.jsx";
import { PageHeaderProvider } from "../src/context/PageHeaderContext.jsx";
import {
  initialBundles as B,
  initialEverydayLessons as L,
  initialProgrammes as P,
  initialStudio as S,
  initialStudioPlans as PL,
  initialMembershipFeatures as F,
} from "../src/data/mockData";
import {
  MAX_LINKS,
  BACKGROUND_PRESETS,
  TEXT_PRESETS,
  ACCENT_PRESETS,
  accentVisible,
  onAccent,
  bestTextOn,
  contrastRatio,
  hostOf,
  isReadable,
  linkLabel,
  looksLikeUrl,
  pagePlans,
  pageProgrammes,
  parseHex,
  programmeAction,
  programmePriceLabel,
  themeOf,
  visibleLinks,
  buttonLinks,
  cheapestPlan,
  platformOf,
  socialLinks,
  MAX_IMAGE_MB,
  PREVIEW_DEVICES,
  imageFileProblem,
  isOnPage,
  publishedProgrammes,
  PAGE_SECTIONS,
  moveItem,
  sectionOrderOf,
  sectionSummary,
  dropIndex,
  isSectionHidden,
  visibleSections,
  isEmailLink,
  videoEmbedOf,
  pageSnapshot,
  pageChanged,
} from "../src/lib/page";
import ProfileEditor from "../src/components/dashboard/mypage/ProfileEditor.jsx";
import PageContents from "../src/components/dashboard/mypage/PageContents.jsx";
import EditorTiles from "../src/components/dashboard/mypage/EditorTiles.jsx";
import AboutEditor from "../src/components/dashboard/mypage/AboutEditor.jsx";
import IntroVideoEditor from "../src/components/dashboard/mypage/IntroVideoEditor.jsx";
import ProgrammePicker from "../src/components/dashboard/mypage/ProgrammePicker.jsx";
import ImageField from "../src/components/dashboard/mypage/ImageField.jsx";
import { comparisonRows, discountPercent, planPrice } from "../src/lib/membership";

const noop = () => {};
const R = (el) => clean(renderToString(<MemoryRouter>{el}</MemoryRouter>));

/* ---- colours ---- */
ok("hex parses in both lengths", parseHex("#fff").join() === "255,255,255" && parseHex("221a38").join() === "34,26,56");
ok("...and rejects anything else", parseHex("blue") === null && parseHex("#12345") === null);
ok("black on white is 21:1", Math.round(contrastRatio("#000000", "#ffffff")) === 21);
ok("contrast doesn't care about order", contrastRatio("#221a38", "#f6f1ea") === contrastRatio("#f6f1ea", "#221a38"));
ok("the default theme is readable", isReadable(themeOf(S)));
ok("the same colour twice is not", !isReadable({ background: "#221a38", text: "#221a38" }));
ok("the fix picks white on dark", bestTextOn("#111111") === "#ffffff");
ok("...and dark on light", bestTextOn("#f6f1ea") === "#221a38");
ok("...and the fix is always readable", ["#111111", "#221a38", "#fbe9e4", "#e3ece4", "#f15b41", "#777777"]
  .every((bg) => isReadable({ background: bg, text: bestTextOn(bg) }) || contrastRatio(bg, bestTextOn(bg)) >= 3));
ok("purple is offered for the background, light and dark", ["#ece6f7", "#3a2e63"].every((v) => BACKGROUND_PRESETS.some((p) => p.value === v)));
ok("...and for text", TEXT_PRESETS.some((p) => p.name === "Purple"));
ok("purple text reads on the light backgrounds", BACKGROUND_PRESETS.filter((b) => contrastRatio(b.value, "#ffffff") < 3)
  .every((b) => isReadable({ background: b.value, text: "#5b3fa0" })));
ok("white text reads on the purple background", isReadable({ background: "#3a2e63", text: "#ffffff" }));
ok("a studio with no theme gets the default", themeOf({}).background && themeOf({}).text);

/* ---- links ---- */
ok("a link without https still counts", looksLikeUrl("instagram.com/maya") && looksLikeUrl("https://www.youtube.com/@m"));
ok("...but a word isn't a link", !looksLikeUrl("hello") && !looksLikeUrl("") && !looksLikeUrl("my site.com"));
ok("the host drops scheme, www and path", hostOf("https://www.Instagram.com/maya?x=1") === "instagram.com");
ok("known sites are named from the URL", linkLabel({ url: "instagram.com/maya" }) === "Instagram"
  && linkLabel({ url: "youtu.be/abc" }) === "YouTube" && linkLabel({ url: "x.com/m" }) === "X");
ok("...a sub-domain of a known site too", linkLabel({ url: "m.youtube.com/@m" }) === "YouTube");
ok("...a lookalike domain is not", linkLabel({ url: "notinstagram.com/m" }) === "notinstagram.com");
ok("other sites show their domain", linkLabel({ url: "mayayoga.co.uk/journal" }) === "mayayoga.co.uk");
ok("the creator's own label wins", linkLabel({ label: "My journal", url: "mayayoga.co.uk" }) === "My journal");
ok("platforms know their icon", platformOf("tiktok.com/@m")?.key === "tiktok" && platformOf("mayayoga.co.uk") === null);
const mixed = [{ id: 1, label: "", url: "instagram.com/m" }, { id: 2, label: "Shop my mat", url: "instagram.com/shop" },
  { id: 3, label: "", url: "mayayoga.co.uk" }, { id: 4, label: "", url: "nope" }];
ok("unlabelled social links become icons", socialLinks(mixed).map((l) => l.id).join() === "1");
ok("...labelled ones and other sites become buttons", buttonLinks(mixed).map((l) => l.id).join() === "2,3");
ok("...and a half-typed link is neither", ![...socialLinks(mixed), ...buttonLinks(mixed)].some((l) => l.id === 4));
ok("half-typed links stay off the page", visibleLinks([{ url: "insta" }, { url: "instagram.com/m" }, { url: "" }]).length === 1);

/* ---- what the page sells ---- */
ok("only published plans", pagePlans(PL).every((p) => p.status === "published")
  && pagePlans([...PL, { id: "d", status: "draft", months: 1 }]).length === pagePlans(PL).length);
ok("...longest first", pagePlans(PL).every((p, i, a) => i === 0 || a[i - 1].months >= p.months));
ok("only published programmes", pageProgrammes(P).length === P.filter((p) => p.status === "published").length
  && !pageProgrammes(P).some((p) => p.id === "restore-sleep"));
ok("a one-off price reads as a price", programmePriceLabel({ pricing: { offers: [{ kind: "oneoff", price: "£40" }] } }) === "£40");
ok("...a subscription says how often", programmePriceLabel({ pricing: { offers: [{ kind: "subscription", length: "1 month", price: "£12" }] } }) === "£12/month");
ok("...every few months reads as a sentence, not \"/3 months\"", programmePriceLabel({ pricing: { offers: [{ kind: "subscription", length: "3 months", price: "£30" }] } }) === "£30 every 3 months");
ok("...the cheapest offer leads", programmePriceLabel({ pricing: { offers: [
  { kind: "oneoff", price: "£40" }, { kind: "subscription", length: "month", price: "£12" }] } }) === "£12/month");
ok("studio-only says it comes with membership", programmePriceLabel({ pricing: { studioOnly: true, offers: [] } }) === "With membership"
  && programmeAction({ pricing: { studioOnly: true, offers: [] } }) === "Join a membership");

/* ---- the preview ---- */
const plans = pagePlans(PL);
const progs = pageProgrammes(P);
const pv = R(<PagePreview studio={S} plans={plans} programmes={progs} bundles={B} lessons={L} features={F} />);
const at = (text) => pv.indexOf(text);
ok("name, tagline and about are on the page", pv.includes(S.name) && pv.includes(S.tagline) && pv.includes(S.about));
ok("the intro video is shown", pv.includes("pg-video"));
// Social accounts are icons (named for screen readers); other sites and
// anything given its own label are buttons.
ok("social accounts show as named icons", pv.includes('aria-label="Instagram"') && pv.includes('aria-label="YouTube"'));
ok("...other links as buttons with their label", pv.includes(">My journal<") && !pv.includes(">Instagram<"));
ok("in the order asked for: profile, about, video, links, memberships, programmes",
  at(S.tagline) < at(S.about) && at(S.about) < at("pg-video") && at("pg-video") < at("pg-links")
  && at("pg-links") < at(">Join the membership<") && at(">Join the membership<") < at(">Programmes<"),
  JSON.stringify([at(S.tagline), at(S.about), at("pg-video"), at("pg-links"), at(">Join the membership<"), at(">Programmes<")]));
ok("every published plan is shown", plans.every((p) => pv.includes(p.name)));
ok("every published programme is shown", progs.every((p) => pv.includes(p.name)) && !pv.includes("Restore & Sleep"));
ok("the colours are set on the page", pv.includes(`--pg-bg:${S.theme.background}`) && pv.includes(`--pg-text:${S.theme.text}`));
ok("calls to action are drawn, not clickable", !/<button/.test(pv) && !/<a /.test(pv));
ok("a plan of extras only doesn't tell visitors 'Nothing selected yet'",
  !R(<PagePreview studio={S} plans={[{ id: "x", status: "published", name: "Perks", months: 1, amount: 5, scope: "picked", bundles: [], extras: [] }]}
    programmes={[]} bundles={B} lessons={L} />).includes("Nothing selected yet"));

/* ---- the creator-page look ---- */
ok("it's previewed on a phone", pv.includes('class="phone"') && pv.includes("phone-screen"));
ok("the handle sits under the name", pv.includes(`@${S.handle}`) && at(S.name) < at(`@${S.handle}`));
ok("a YouTube intro plays on the page", /<iframe src="https:\/\/www\.youtube-nocookie\.com\/embed\/aqz-KE-bpKQ/.test(pv)
  && pv.includes('title="Intro video on YouTube"'));
const cardOnly = R(<PagePreview studio={{ ...S, introVideo: "mayayoga.co.uk/hello.mp4" }} plans={[]} programmes={[]} bundles={B} lessons={L} />);
ok("...any other link gets a Watch my intro card", cardOnly.includes("Watch my intro") && !cardOnly.includes("<iframe"));
ok("programmes are a swipeable row of product cards", pv.includes("pg-rail") && (pv.match(/class="pg-product"/g) || []).length === progs.length);
ok("a join button is pinned, from the cheapest plan", pv.includes("pg-sticky") && pv.includes(`Join from ${planPrice(cheapestPlan(plans))}`));
ok("...which really is the cheapest", cheapestPlan(plans).amount === Math.min(...plans.map((p) => p.amount)));
ok("a discounted plan says how much it saves", plans.filter((p) => discountPercent(p) > 0).every((p) => pv.includes(`${discountPercent(p)}% off`)));
ok("nothing on sale, no join button", cheapestPlan([]) === null);

const blank = R(<PagePreview studio={{ ...S, name: "", tagline: "", about: "", introVideo: "", links: [] }}
  plans={[]} programmes={[]} bundles={B} lessons={L} />);
ok("an empty page shows where the name and tagline go", blank.includes("Your studio name") && blank.includes("Your tagline"));
ok("...and leaves out what isn't there", !blank.includes("pg-video") && !blank.includes("pg-links")
  && !blank.includes(">Join the membership<") && !blank.includes(">Programmes<") && !blank.includes("pg-sticky"));
ok("a video that isn't a link isn't shown", !R(<PagePreview studio={{ ...S, introVideo: "soon" }} plans={[]} programmes={[]} bundles={B} lessons={L} />).includes("pg-video"));

/* ---- the editor ---- */
const page = clean(renderToString(
  <ToastProvider><AppDataProvider><PageHeaderProvider><MemoryRouter><MyPagePage /></MemoryRouter></PageHeaderProvider></AppDataProvider></ToastProvider>));
ok("the profile keeps header image, name and tagline in view", ["Header image"].every((l) => page.includes(`>${l}</span>`))
  && ["Studio name", "Tagline"].every((l) => page.includes(`>${l}</label>`)));
ok("everything else is a tile", ["About you", "Intro video", "Links", "Memberships", "Programmes", "Colours"]
  .every((t) => page.includes(`<b>${t}</b>`)) && (page.match(/class="tile( |")/g) || []).length === 6);
ok("...and every tile starts closed", !page.includes('class="tile-body"') && !page.includes('aria-expanded="true" aria-controls="tile-')
  && (page.match(/class="tile-toggle" aria-expanded="false"/g) || []).length === 6);
ok("...so their fields aren't on screen until opened", !page.includes(">About you</label>") && !page.includes('href="/dashboard/programmes"'));
ok("the old plan toggles, drop-in and publish button are gone",
  !page.includes("Drop-in") && !page.includes("Plans on your page") && !page.includes("Publish changes"));

const unreadable = R(<ColourEditor theme={{ background: "#221a38", text: "#2b2b2b" }} onChange={noop} />);
ok("clashing colours are called out", unreadable.includes("Hard to read"));
ok("...with the fix one click away", unreadable.includes("Use white text"));
ok("readable colours say so", R(<ColourEditor theme={{ background: "#ffffff", text: "#221a38" }} onChange={noop} />).includes("Easy to read"));
ok("any colour can be picked by hand", unreadable.includes('type="color"'));
ok("a custom colour is marked as the chosen one", /class="sw sw-custom on"/.test(
  R(<ColourEditor theme={{ background: "#123456", text: "#ffffff" }} onChange={noop} />)));

const linksHtml = R(<LinksEditor links={[{ id: "a", label: "", url: "instagram.com/m" }, { id: "b", label: "", url: "nope" },
  { id: "c", label: "", url: "mayayoga.co.uk" }]} onAdd={noop} onChange={noop} onRemove={noop} />);
ok("a social link says it'll show as an icon", linksHtml.includes("Shows as the Instagram icon"));
ok("...any other says the button text it'll get", linksHtml.includes('placeholder="Button text — mayayoga.co.uk"'));
ok("a bad link is flagged", linksHtml.includes("Not a link yet"));
const fullLinks = R(<LinksEditor links={Array.from({ length: MAX_LINKS }, (_, i) => ({ id: `l${i}`, label: "", url: "a.com" }))}
  onAdd={noop} onChange={noop} onRemove={noop} />);
ok("adding stops at the limit, and says why", /disabled=""/.test(fullLinks) && fullLinks.includes(`You can have up to ${MAX_LINKS} links`));

/* every control has a tooltip, like the membership page */
const untipped = (html) => [...html.matchAll(/<button\b[^>]*>/g)].filter((m) => !/data-tip="/.test(m[0])
  && !/<span\b[^>]*data-tip="[^"]+"[^>]*>\s*$/.test(html.slice(Math.max(0, m.index - 300), m.index))).map((m) => m[0]);
ok("every editor button has a tooltip", untipped(page + linksHtml + unreadable).length === 0, untipped(page + linksHtml + unreadable).join(" | "));

/* ---- header image ---- */
const file = (type, mb) => ({ type, size: mb * 1024 * 1024 });
ok("a photo within the limit is accepted", imageFileProblem(file("image/jpeg", 2)) === null && imageFileProblem(file("image/webp", MAX_IMAGE_MB)) === null);
ok("...a non-image is refused, and says why", /isn't a JPG/.test(imageFileProblem(file("application/pdf", 1))));
ok("...so is one over the limit, with its size", /6\.0 MB — the limit is 5 MB/.test(imageFileProblem(file("image/png", 6))));
ok("...and no file at all", !!imageFileProblem(null));

const img = "data:image/png;base64,AAAA";
const withImg = R(<PagePreview studio={{ ...S, coverImage: img }} plans={plans} programmes={progs} bundles={B} lessons={L} />);
ok("an uploaded image fills the header", withImg.includes('class="pg-cover img"') && withImg.includes(`background-image:url(${img})`));
// Changed by hand in the "My page, members, payments" commit: with no upload
// the header shows a placeholder photo rather than the colour tint.
ok("...without one the header shows the placeholder photo", pv.includes("background-image:url(https://picsum.photos/400/150)"));

const noImgEditor = R(<ImageField label="Header image" image="" onChange={noop} />);
ok("the editor offers an upload", noImgEditor.includes("> Upload<") && noImgEditor.includes('type="file"'));
ok("...of images only", noImgEditor.includes('accept="image/jpeg,image/png,image/webp,image/gif"'));
ok("...and says what's allowed", noImgEditor.includes(`up to ${MAX_IMAGE_MB} MB`));
const imgEditor = R(<ImageField label="Header image" image={img} onChange={noop} />);
ok("with an image, it can be replaced or removed", imgEditor.includes("> Replace<") && imgEditor.includes(">Remove<"));
ok("...and shows it", imgEditor.includes(`background-image:url(${img})`));
ok("the header image comes first in the profile", page.indexOf("Header image") < page.indexOf(">Studio name<"));
ok("header image buttons have tooltips", untipped(noImgEditor + imgEditor).length === 0, untipped(noImgEditor + imgEditor).join(" | "));

/* ---- phone and web view ---- */
ok("two ways to preview", PREVIEW_DEVICES.map((d) => d.key).join() === "phone,web");
const web = R(<PagePreview studio={S} plans={plans} programmes={progs} bundles={B} lessons={L} features={F} device="web" />);
ok("the web view is a browser window, not a phone", web.includes('class="browser"') && !web.includes('class="phone"'));
ok("the phone view is the default", pv.includes('class="phone"') && pv.includes('class="pg mobile"'));
ok("on the web the join button moves to a top bar", web.includes("pg-topbar") && web.includes(`Join from ${planPrice(cheapestPlan(plans))}`)
  && !web.includes("pg-sticky"));
ok("...on a phone it stays at the bottom", pv.includes("pg-sticky") && !pv.includes("pg-topbar"));
ok("both views show the same things", [S.name, S.about, "youtube-nocookie.com/embed/aqz-KE-bpKQ", "My journal", ...plans.map((p) => p.name), ...progs.map((p) => p.name)]
  .every((t) => web.includes(t) && pv.includes(t)));
ok("the web view is still only a picture — nothing clickable", !/<button/.test(web) && !/<a /.test(web));
const css = source("src/styles/mypage.css");
ok("on the web, plans and programmes sit side by side", /\.pg\.web \.mv-plans \{[^}]*grid-template-columns/s.test(css)
  && /\.pg\.web \.pg-rail \{[^}]*display: grid/s.test(css));
ok("on a phone, plan cards swipe and the table keeps its first column", /\.pg\.mobile \.mv-plans \{[^}]*overflow-x: auto/s.test(css)
  && /\.pg\.mobile \.mv-table td:first-child,[^{]*\{[^}]*position: sticky/s.test(css));
ok("the switch says which view is on", page.includes('aria-pressed="true"') && page.includes("> Phone<") && page.includes("> Web<"));

/* ---- memberships: the same comparison members see ---- */
const cmp = comparisonRows({ plans, bundles: B, programmes: P, lessons: L, features: F });
ok("memberships show as plan cards", (pv.match(/class="mv-plan( best)?"/g) || []).length === plans.length);
ok("...each with a drawn Choose", (pv.match(/class="mv-choose"/g) || []).length === plans.length);
ok("...and the best seller flagged", pv.includes('class="mv-plan best"') && pv.includes(">Best seller<"));
ok("then a What you get table", pv.includes(">What you get<") && pv.includes("mv-table"));
ok("...with a column per plan", plans.every((p) => pv.includes(`>${p.name}</th>`)));
ok("...a row per published bundle and benefit", cmp.length > 0 && cmp.every((r) => pv.includes(`<b>${r.title}</b>`)));
ok("...never a draft", !pv.includes("Morning starter") && !pv.includes("Pause your plan anytime"));
ok("...ticks and dashes matching the plans", (pv.match(/mv-yes/g) || []).length === cmp.reduce((n, r) => n + r.plans.length, 0));
ok("the page and the membership preview use one component", source("src/components/dashboard/mypage/PagePreview.jsx").includes("<MembershipComparison")
  && source("src/components/dashboard/membership/MemberViewModal.jsx").includes("<MembershipComparison"));
ok("My page passes the benefits through", source("src/components/dashboard/mypage/MyPagePage.jsx").includes("features={membershipFeatures}"));
ok("the page shows it in its own colours", /\.pg \.mv-plan \{[^}]*var\(--pg-card\)/s.test(css) && /\.pg \.mv-yes \{[^}]*var\(--pg-accent\)/s.test(css));

/* ---- one accent colour ---- */
ok("the theme has an accent, and old themes get one", !!themeOf(S).accent && themeOf({ theme: { background: "#fff", text: "#000" } }).accent === "#3a2e63");
ok("purple is the first accent offered", ACCENT_PRESETS[0].name === "Purple");
ok("button labels are worked out, and always readable", ACCENT_PRESETS.every((a) => contrastRatio(a.value, onAccent(a.value)) >= 4.5)
  && onAccent("#3a2e63") === "#ffffff" && onAccent("#f7d9ff") === "#221a38");
ok("an accent that vanishes into the page is caught", !accentVisible({ background: "#ece6f7", accent: "#e3d9f5" }) && accentVisible(themeOf(S)));
ok("the page receives the accent and its label colour", pv.includes(`--pg-accent:${themeOf(S).accent}`) && pv.includes("--pg-on-accent:#ffffff"));
const accented = [".pg-av", ".pg-video", ".pg-link-ic", ".pg-btn", ".pg-mini-av", ".mv-choose", ".pg .mv-plan.best", ".pg .mv-yes"];
ok("logo, intro, link icons, buttons and highlights all follow the accent",
  accented.every((sel) => new RegExp(`(^|\\n)${sel.replace(/[.]/g, "\\.")} \\{[^}]*var\\(--pg-accent\\)`, "s").test(css)),
  accented.filter((sel) => !new RegExp(`(^|\\n)${sel.replace(/[.]/g, "\\.")} \\{[^}]*var\\(--pg-accent\\)`, "s").test(css)).join());
ok("...and their labels the worked-out colour", [".pg-btn", ".mv-choose", ".pg-link-ic"]
  .every((sel) => new RegExp(`(^|\\n)${sel.replace(/[.]/g, "\\.")} \\{[^}]*var\\(--pg-on-accent\\)`, "s").test(css)));
const accentEditor = R(<ColourEditor theme={{ background: "#ffffff", text: "#221a38", accent: "#3a2e63" }} onChange={noop} />);
ok("the editor has one accent picker, and says what it colours", accentEditor.includes(">Accent<") && accentEditor.includes("Logo, intro video, buttons and highlights")
  && ACCENT_PRESETS.every((a) => accentEditor.includes(`aria-label="Accent: ${a.name}"`)));
ok("...with any colour allowed", accentEditor.includes('aria-label="Accent: pick any colour"'));
ok("a faint accent gets a warning", R(<ColourEditor theme={{ background: "#ffffff", text: "#221a38", accent: "#f4f0ff" }} onChange={noop} />)
  .includes("accent is hard to see") && !accentEditor.includes("accent is hard to see"));
ok("a theme saved before accents existed still edits", R(<ColourEditor theme={{ background: "#ffffff", text: "#221a38" }} onChange={noop} />).includes(">Accent<"));

/* ---- tiles: collapsible, reorderable ---- */
const keys = PAGE_SECTIONS.map((x) => x.key);
ok("the default order is the one the page always had", sectionOrderOf(S).join() === "about,video,links,memberships,programmes"
  && sectionOrderOf({}).join() === keys.join());
ok("an old or damaged order is made whole", sectionOrderOf({ sectionOrder: ["links", "nope", "links", "about"] }).join()
  === "links,about,video,memberships,programmes");
ok("moving puts it exactly there", moveItem(keys, "programmes", 0).join() === "programmes,about,video,links,memberships"
  && moveItem(keys, "about", 2).join() === "video,links,about,memberships,programmes");
ok("...clamped at the ends, unknown ignored", moveItem(keys, "about", -3).join() === keys.join()
  && moveItem(keys, "about", 99)[4] === "about" && moveItem(keys, "nope", 1) === keys);

const reordered = R(<PagePreview studio={{ ...S, sectionOrder: ["programmes", "memberships", "links", "video", "about"] }}
  plans={plans} programmes={progs} bundles={B} lessons={L} features={F} />);
const ra = (t) => reordered.indexOf(t);
ok("the page follows the tile order", ra(">Programmes<") < ra(">Join the membership<") && ra(">Join the membership<") < ra("pg-links")
  && ra("pg-links") < ra("pg-video") && ra("pg-video") < ra("pg-about"), JSON.stringify([ra(">Programmes<"), ra(">Join the membership<"), ra("pg-links"), ra("pg-video"), ra("pg-about")]));
ok("...with the header still first", ra(S.tagline) < ra(">Programmes<"));

ok("each closed tile says what's in it", sectionSummary("about", { studio: S }).endsWith("words")
  && sectionSummary("video", { studio: S }) === "YouTube" && sectionSummary("links", { studio: S }) === "3 links"
  && sectionSummary("memberships", { plans }) === `${plans.length} published`);
ok("...and when it's empty", sectionSummary("about", { studio: { about: "" } }) === "Not written yet"
  && sectionSummary("video", { studio: { introVideo: "soon" } }) === "Not a link yet" && sectionSummary("links", { studio: { links: [] } }) === "None yet");
ok("page tiles show their summaries", page.includes(`>${sectionSummary("links", { studio: S })}<`));
ok("the Colours tile shows the three colours", page.includes("tile-dots") && page.includes(`background:${S.theme.accent}`));

const demoTiles = [
  { key: "a", title: "Alpha", summary: "one", body: <p>alpha body</p>, movable: true },
  { key: "b", title: "Beta", summary: "two", body: <p>beta body</p>, movable: true },
  { key: "c", title: "Gamma", summary: "three", body: <p>gamma body</p>, movable: false },
];
const shut = R(<EditorTiles tiles={demoTiles} onMove={noop} />);
ok("tiles render closed, bodies left out", !shut.includes("alpha body") && !shut.includes("beta body"));
const oneOpen = R(<EditorTiles tiles={demoTiles} onMove={noop} defaultOpen={["b"]} />);
ok("an open tile shows its body and says so", oneOpen.includes("beta body") && !oneOpen.includes("alpha body")
  && /class="tile open"[\s\S]*aria-expanded="true" aria-controls="tile-b"/.test(oneOpen) && oneOpen.includes('id="tile-b"'));
ok("movable tiles have a draggable grip", (shut.match(/class="tile-grip" draggable="true"/g) || []).length === 2);
ok("...a fixed one has none", (shut.match(/tile-grip-space/g) || []).length === 1);
ok("the grip explains the keyboard way", shut.includes('aria-label="Move Alpha. Use the up and down arrow keys."'));
ok("moves are announced to screen readers", shut.includes('aria-live="polite"'));
ok("tile buttons have tooltips", untipped(shut + oneOpen).length === 0, untipped(shut + oneOpen).join(" | "));
const tilesSrc = source("src/components/dashboard/mypage/EditorTiles.jsx");
ok("arrow keys move a tile", tilesSrc.includes('e.key === "ArrowUp" || e.key === "ArrowDown"'));
// Every drop on a four-item list, checked against doing the move by hand.
const four = ["a", "b", "c", "d"];
const dropsRight = four.every((dragged, from) => four.every((target, over) => [false, true].every((after) => {
  if (dragged === target) return true;
  const expect = four.filter((k) => k !== dragged);
  expect.splice(expect.indexOf(target) + (after ? 1 : 0), 0, dragged);
  return moveItem(four, dragged, dropIndex(from, over, after)).join() === expect.join();
})));
ok("a drop lands exactly where the line showed, from every position", dropsRight);
ok("the tiles use that rule", tilesSrc.includes("dropIndex(indexOf(dragKey), indexOf(t.key), !!drop?.after)"));
ok("the memberships tile links to where plans are edited", R(<PageContents plans={plans} />).includes('href="/dashboard/membership"'));
ok("the store moves a section through the same rule", /movePageSection = useCallback\([\s\S]{0,160}moveItem\(sectionOrderOf\(s\), key, to\)/.test(source("src/context/AppDataContext.jsx")));

ok("About you and the intro video still edit", R(<AboutEditor value="hi" onChange={noop} />).includes(">About you</label>")
  && R(<IntroVideoEditor value="soon" onChange={noop} />).includes("doesn't look like a link"));

/* ---- hiding a section ---- */
ok("nothing is hidden to start with", visibleSections(S).length === 5 && !isSectionHidden(S, "about"));
ok("a hidden section drops out, the rest keep their order", visibleSections({ ...S, hiddenSections: ["video", "links"] }).join() === "about,memberships,programmes");
ok("...and the order still applies", visibleSections({ sectionOrder: ["programmes", "about"], hiddenSections: ["about"] })[0] === "programmes"
  && !visibleSections({ sectionOrder: ["programmes", "about"], hiddenSections: ["about"] }).includes("about"));

const hideAll = (keys) => R(<PagePreview studio={{ ...S, hiddenSections: keys }} plans={plans} programmes={progs} bundles={B} lessons={L} features={F} />);
const noVideo = hideAll(["video"]);
ok("a hidden section is gone from the page", !noVideo.includes("pg-video") && noVideo.includes("pg-links") && noVideo.includes(">Programmes<"));
ok("...every kind of section can go", !hideAll(["about"]).includes("pg-about") && !hideAll(["links"]).includes("pg-links")
  && !hideAll(["programmes"]).includes(">Programmes<") && !hideAll(["memberships"]).includes(">Join the membership<"));
ok("the header can't be hidden", hideAll(["about", "video", "links", "memberships", "programmes"]).includes(S.tagline));
ok("hiding memberships takes the join button with it", !hideAll(["memberships"]).includes("pg-sticky") && !hideAll(["memberships"]).includes("Join from")
  && !R(<PagePreview studio={{ ...S, hiddenSections: ["memberships"] }} plans={plans} programmes={progs} bundles={B} lessons={L} features={F} device="web" />).includes("Join from"));
ok("...but hiding something else doesn't", hideAll(["programmes"]).includes("Join from"));

const hideTiles = [
  { key: "a", title: "Alpha", summary: "one", body: null, movable: true, hidden: false, onHide: noop },
  { key: "b", title: "Beta", summary: "two", body: null, movable: true, hidden: true, onHide: noop },
  { key: "c", title: "Colours", summary: "", body: null, movable: false },
];
const eyes = R(<EditorTiles tiles={hideTiles} onMove={noop} />);
ok("section tiles get an eye, Colours doesn't", (eyes.match(/class="tile-eye/g) || []).length === 2);
ok("a hidden tile says so, faded, with the eye to bring it back", /class="tile off"[\s\S]*>Hidden</.test(eyes)
  && eyes.includes('aria-label="Show Beta on your page"') && eyes.includes('aria-label="Hide Alpha from your page"'));
ok("...and the summary gives way to Hidden", !eyes.includes(">two<") && eyes.includes(">one<"));
ok("the eyes have tooltips", untipped(eyes).length === 0, untipped(eyes).join(" | "));
ok("every section tile on My page has an eye", (page.match(/class="tile-eye/g) || []).length === 5);
const hideStore = source("src/context/AppDataContext.jsx");
ok("the store switches a section off and on", /setSectionHidden = useCallback\([\s\S]{0,260}hiddenSections: hidden \? \[\.\.\.rest, key\] : rest/.test(hideStore)
  && (hideStore.match(/\bsetSectionHidden,/g) || []).length === 2);

/* ---- hiding the editor ---- */
const openPage = page;
const closedPage = clean(renderToString(
  <ToastProvider><AppDataProvider><PageHeaderProvider><MemoryRouter><MyPagePage defaultEditorOpen={false} /></MemoryRouter></PageHeaderProvider></AppDataProvider></ToastProvider>));
const handle = (html) => html.match(/<button class="ed-handle"[^>]*>[\s\S]*?<\/button>/)?.[0] || "";
ok("the page opens with the editor showing", openPage.includes('id="mypage-editor"'));
ok("the toggle is an arrow, not a labelled button", handle(openPage) && !/>\s*(Hide|Show) editor\s*</.test(openPage + closedPage));
ok("...pinned inside the editor column, after the editor", /class="ed-col"[\s\S]*id="mypage-editor"[\s\S]*class="ed-track"[\s\S]*class="pv-col"/.test(openPage));
ok("...and not in the preview bar", !/class="pv-bar"[\s\S]*ed-handle/.test(openPage.slice(openPage.indexOf('class="pv-col"'))));
ok("open, it points left and says it hides", /aria-label="Hide editor"[^>]*aria-expanded="true"[^>]*aria-controls="mypage-editor"/.test(handle(openPage))
  && handle(openPage).includes("M15 5l-7 7 7 7"));
ok("hidden, the editor is out of sight but kept, and the preview has the row", /id="mypage-editor" hidden=""/.test(closedPage)
  && closedPage.includes('class="page-wrap solo"') && closedPage.includes('class="ed-col closed"') && closedPage.includes('class="phone"'));
ok("...the arrow stays, pointing right, to bring it back", /aria-label="Show editor"[^>]*aria-expanded="false"/.test(handle(closedPage))
  && handle(closedPage).includes('aria-controls="mypage-editor"') && handle(closedPage).includes("M9 5l7 7-7 7"));
ok("the arrow has a tooltip either way", handle(openPage).includes("Hide the editor and give the preview the full width")
  && handle(closedPage).includes("Bring the editor back"));
const edCss = source("src/styles/mypage.css");
ok("it sits on the editor's right edge", /\.ed-track \{[^}]*position: absolute;[^}]*right: -25px/s.test(edCss));
// Its height on the edge is a hand-tuned detail (see .ed-handle), so only
// the fact that it stays in view is checked.
ok("...and stays in view as the editor scrolls", /\.ed-handle \{[^}]*position: sticky/s.test(edCss));
ok("...along the full height of the row, even with the editor hidden", /\.ed-col \{[^}]*align-self: stretch/s.test(edCss));
/* fitted to the window */
const fit = edCss.slice(edCss.indexOf("fitted to the window"));
ok("My page is marked so it can fit the window", openPage.includes('class="panel mypage"'));
ok("on desktop the layout is exactly the window below the header", /\.mypage \.page-wrap \{[^}]*height: calc\(100dvh - var\(--topbar-h\) - 48px\)/s.test(fit)
  && /\.content:has\(> \.mypage\) \{[^}]*padding-bottom: 24px/s.test(fit));
ok("...the editor scrolls inside its own column", /\.mypage \.editor \{[^}]*overflow-y: auto/s.test(fit));
ok("...and the phone and browser stretch to the height left", /\.mypage \.phone-screen \{[^}]*flex: 1/s.test(fit)
  && /\.mypage \.browser-view \{[^}]*flex: 1/s.test(fit));
ok("...only on desktop — narrow screens scroll as normal", /@media \(min-width: 861px\) \{\s*\.content:has/.test(fit));
ok("the phone has a status bar the page scrolls under", pv.includes('class="phone-status"') && pv.includes(">9:41<")
  && /\.phone-status \{[^}]*position: sticky;[^}]*top: 0/s.test(edCss));
ok("...but the web view doesn't", !web.includes("phone-status"));
ok("the preview bar sits on the right", /\.pv-bar \{[^}]*justify-content: flex-end/s.test(edCss));
ok("a lone preview takes the full width", /\.page-wrap\.solo \{[^}]*grid-template-columns: 0 minmax\(0, 1fr\)/s.test(edCss));

/* ---- choosing which programmes appear ---- */
const pub = publishedProgrammes(P);
const [first, second] = pub;
ok("every published programme can be chosen, drafts can't", pub.length === P.filter((p) => p.status === "published").length && pub.length >= 2);
ok("nothing hidden shows them all", pageProgrammes(P, []).length === pub.length && pageProgrammes(P).length === pub.length);
ok("a hidden programme leaves the page", pageProgrammes(P, [first.id]).every((p) => p.id !== first.id)
  && pageProgrammes(P, [first.id]).length === pub.length - 1);
ok("hiding a draft changes nothing", pageProgrammes(P, ["restore-sleep"]).length === pub.length);
ok("isOnPage reads the hidden list", !isOnPage({ hiddenProgrammes: [first.id] }, first.id) && isOnPage({ hiddenProgrammes: [first.id] }, second.id)
  && isOnPage({}, first.id));
ok("a programme published later shows by default — hidden ones are stored, not shown ones",
  pageProgrammes([...P, { id: "new", status: "published" }], [first.id]).some((p) => p.id === "new"));

const pvHidden = R(<PagePreview studio={S} plans={plans} programmes={pageProgrammes(P, [first.id])} bundles={B} lessons={L} features={F} />);
ok("the preview leaves out a hidden programme", !pvHidden.includes(`<b>${first.name}</b>`) && pvHidden.includes(`<b>${second.name}</b>`));
const pvNone = R(<PagePreview studio={S} plans={plans} programmes={pageProgrammes(P, pub.map((p) => p.id))} bundles={B} lessons={L} features={F} />);
ok("...and with every one hidden, the section goes", !pvNone.includes(">Programmes<"));

const picker = R(<ProgrammePicker published={pub} hidden={[first.id]} drafts={1} onToggle={noop} onShowAll={noop} />);
ok("the picker lists every published programme with a tick box", pub.every((p) => picker.includes(`<b>${p.name}</b>`))
  && (picker.match(/type="checkbox"/g) || []).length === pub.length);
ok("...ticked when shown, unticked when hidden", (picker.match(/checked=""/g) || []).length === pub.length - 1);
ok("...and the tile counts them", sectionSummary("programmes", { studio: { hiddenProgrammes: [first.id] }, published: pub }) === `${pub.length - 1} of ${pub.length} shown`);
ok("Show all is there when something is hidden", picker.includes("Show all") && !/<button[^>]*disabled=""[^>]*>[^<]*<svg[\s\S]{0,400}Show all/.test(picker));
const pickerAll = R(<ProgrammePicker published={pub} hidden={[]} drafts={0} onToggle={noop} onShowAll={noop} />);
ok("...and switched off, saying why, when everything shows", /disabled=""/.test(pickerAll)
  && pickerAll.includes("Every published programme is already on your page"));
ok("drafts are mentioned, not listed", picker.includes("1 draft programme isn't listed") && !pickerAll.includes("draft programme"));
ok("the picker's buttons have tooltips", untipped(picker + pickerAll).length === 0, untipped(picker + pickerAll).join(" | "));
ok("it links to the Programmes page", picker.includes('href="/dashboard/programmes"'));

const store = source("src/context/AppDataContext.jsx");
ok("the store can hide one and show all", /setProgrammeOnPage = useCallback\([\s\S]{0,300}hiddenProgrammes/.test(store)
  && /showAllProgrammes = useCallback\([\s\S]{0,120}hiddenProgrammes: \[\]/.test(store)
  && (store.match(/\bsetProgrammeOnPage,/g) || []).length === 2 && (store.match(/\bshowAllProgrammes,/g) || []).length === 2);
ok("deleting a programme forgets it was hidden", /deleteProgramme = useCallback\([\s\S]{0,400}hiddenProgrammes: \(s\.hiddenProgrammes/.test(store));
ok("My page passes the hidden list to the preview", source("src/components/dashboard/mypage/MyPagePage.jsx").includes("pageProgrammes(programmes, studio.hiddenProgrammes)"));

/* ---- gaps found auditing My page ---- */

// Hiding a programme from the page used to shrink the membership comparison
// too, because it was handed the page's list instead of the catalogue.
// Bundles without descriptions, so the table falls back to counting what's in
// each — the count hiding a programme used to change.
const plainB = B.map((b) => ({ ...b, description: "" }));
const cmpAll = R(<PagePreview studio={S} plans={plans} programmes={pageProgrammes(P, [])} catalogue={pub} bundles={plainB} lessons={L} features={F} />);
const cmpHidden = R(<PagePreview studio={S} plans={plans} programmes={pageProgrammes(P, [first.id])} catalogue={pub} bundles={plainB} lessons={L} features={F} />);
const tableOf = (html) => html.slice(html.indexOf("mv-table"), html.indexOf("</table>"));
ok("hiding a programme from the page doesn't change what memberships include", tableOf(cmpAll) === tableOf(cmpHidden)
  && /\d programmes?/.test(tableOf(cmpAll)), tableOf(cmpAll).match(/\d programmes?[^<]*/)?.[0]);
ok("...because My page passes the whole catalogue to the comparison", source("src/components/dashboard/mypage/MyPagePage.jsx").includes("catalogue={published}")
  && source("src/components/dashboard/mypage/PagePreview.jsx").includes("programmes={catalogue}"));

// Email links used to pass as web links, labelled "mailto:hello@…".
ok("an email address is recognised, with or without mailto:", isEmailLink("hello@mayayoga.co.uk") && isEmailLink("mailto:hello@maya.com")
  && !isEmailLink("instagram.com/maya") && !isEmailLink("https://x.com/@maya"));
ok("...labelled Email, not the address", linkLabel({ url: "mailto:hello@maya.com" }) === "Email" && linkLabel({ label: "Say hi", url: "hello@maya.com" }) === "Say hi");
ok("...never mistaken for the site it's at", platformOf("maya@gmail.com") === null && platformOf("hello@youtube.com") === null);
ok("...and shown as a button with a mail icon", (() => {
  const h = R(<PagePreview studio={{ ...S, links: [{ id: "e", label: "", url: "hello@maya.com" }] }} plans={[]} programmes={[]} bundles={B} lessons={L} />);
  return h.includes(">Email<") && buttonLinks([{ id: "e", label: "", url: "hello@maya.com" }]).length === 1 && h.includes('d="m4 7 8 6 8-6"');
})());

// A members-only programme said "Join a membership" even with no membership on the page.
const studioOnly = { id: "so", status: "published", type: "recorded", name: "Members Flow", pricing: { studioOnly: true, offers: [] }, sections: [] };
ok("a members-only programme points at joining when there's a membership to join", programmeAction(studioOnly) === "Join a membership");
ok("...and has no button when there isn't", programmeAction(studioOnly, { canJoin: false }) === null
  && programmeAction({ pricing: { offers: [{ kind: "oneoff", price: "£5" }] } }, { canJoin: false }) === "Buy");
const soHidden = R(<PagePreview studio={{ ...S, hiddenSections: ["memberships"] }} plans={plans} programmes={[studioOnly]} bundles={B} lessons={L} features={F} />);
ok("...on the page too", soHidden.includes("Members Flow") && !soHidden.includes("Join a membership"));

// The profile photo — the one picture every creator page has.
const withPhoto = R(<PagePreview studio={{ ...S, avatarImage: img }} plans={[]} programmes={[]} bundles={B} lessons={L} />);
ok("a profile photo fills the avatar instead of the initial", /class="img" style="background-image:url\(data:image\/png/.test(withPhoto));
ok("...and the small one in the web bar", /pg-mini-av" aria-hidden="true" style="background-image:url\(data:image/.test(
  R(<PagePreview studio={{ ...S, avatarImage: img }} plans={[]} programmes={[]} bundles={B} lessons={L} device="web" />)));
ok("without one, the initial shows", pv.includes(`<span>${S.name.charAt(0)}</span>`));
ok("the profile has a photo field, round", page.includes(">Profile photo</span>") && page.includes("img-field round"));

ok("an empty studio name is called out", R(<ProfileEditor studio={{ ...S, name: "" }} onChange={noop} />).includes("Your page needs a name")
  && !page.includes("Your page needs a name"));

// Copy link announced "Copied" even when the clipboard refused.
const mpSrc = source("src/components/dashboard/mypage/MyPagePage.jsx");
ok("copying only says Copied once it's done", mpSrc.includes("await navigator.clipboard.writeText") && mpSrc.includes("Couldn't copy — your page is"));

ok("a closed tile doesn't point at a body that isn't there", !/aria-controls="tile-/.test(shut) && /aria-controls="tile-b"/.test(oneOpen));
ok("labelled pictures on the page are announced as images", /class="pg-social" role="img" aria-label="Instagram"/.test(pv)
  && /class="pg-video" role="img"/.test(cardOnly) && !/class="pg-video player" role="img"/.test(pv));

ok("a test file that won't build is reported, not a crash", source("scripts/run-tests.mjs").includes("did not build"));

/* ---- the intro video player ---- */
const yt = (u) => videoEmbedOf(u)?.id;
ok("YouTube links in every shape people paste", ["https://youtu.be/aqz-KE-bpKQ", "youtu.be/aqz-KE-bpKQ?si=abc",
  "https://www.youtube.com/watch?v=aqz-KE-bpKQ&t=10", "m.youtube.com/watch?v=aqz-KE-bpKQ", "youtube.com/shorts/aqz-KE-bpKQ",
  "https://www.youtube.com/embed/aqz-KE-bpKQ"].every((u) => yt(u) === "aqz-KE-bpKQ"));
ok("...played from the privacy-friendly domain", videoEmbedOf("youtu.be/aqz-KE-bpKQ").src.startsWith("https://www.youtube-nocookie.com/embed/aqz-KE-bpKQ"));
ok("Vimeo links too", videoEmbedOf("https://vimeo.com/76979871")?.src === "https://player.vimeo.com/video/76979871"
  && videoEmbedOf("vimeo.com/channels/staffpicks/76979871")?.id === "76979871");
ok("not a video id, not a player", videoEmbedOf("youtu.be/maya-welcome") === null && videoEmbedOf("youtube.com/@mayayoga") === null
  && videoEmbedOf("instagram.com/reel/abc") === null && videoEmbedOf("soon") === null && videoEmbedOf("") === null);
ok("the demo intro is a real, playable link", videoEmbedOf(S.introVideo)?.provider === "YouTube");
ok("the editor says it will play", R(<IntroVideoEditor value="https://youtu.be/aqz-KE-bpKQ" onChange={noop} />).includes("Plays on your page from YouTube"));
ok("...or that it won't, and why", R(<IntroVideoEditor value="mayayoga.co.uk/hi.mp4" onChange={noop} />).includes("Only YouTube and Vimeo videos play on the page"));

/* ---- publishing changes ---- */
const live = pageSnapshot(S);
ok("nothing edited, nothing to publish", !pageChanged(S, live));
ok("any edit on the page is a change", ["name", "tagline", "about", "introVideo", "coverImage", "avatarImage"]
  .every((f) => pageChanged({ ...S, [f]: `${S[f] || ""}x` }, live)));
ok("...so are links, colours, order and what's hidden", pageChanged({ ...S, links: [] }, live)
  && pageChanged({ ...S, theme: { ...S.theme, accent: "#123456" } }, live)
  && pageChanged({ ...S, sectionOrder: ["links", "about", "video", "memberships", "programmes"] }, live)
  && pageChanged({ ...S, hiddenSections: ["about"] }, live) && pageChanged({ ...S, hiddenProgrammes: ["x"] }, live));
ok("putting something back the way it was is no change", !pageChanged({ ...S, hiddenSections: [] }, live)
  && !pageChanged({ ...S, sectionOrder: undefined }, live) && !pageChanged({ ...S, theme: undefined, }, pageSnapshot({ ...S, theme: undefined })));
ok("...and hidden lists don't care about order", !pageChanged({ ...S, hiddenProgrammes: ["b", "a"] }, pageSnapshot({ ...S, hiddenProgrammes: ["a", "b"] })));
ok("things published elsewhere aren't page changes", !pageChanged({ ...S, handle: S.handle, ownerName: "Someone" }, live));
const pubStore = source("src/context/AppDataContext.jsx");
ok("the store keeps what's live separately, and publishing copies the draft", pubStore.includes("useState(() => pageSnapshot(initialStudio))")
  && /publishPage = useCallback\([\s\S]{0,120}setPublishedPage\(pageSnapshot\(studio\)\)/.test(pubStore)
  && (pubStore.match(/\bpublishPage,/g) || []).length === 2);
const hdr = source("src/components/dashboard/mypage/MyPagePage.jsx");
ok("the header shows Publish changes only when something changed", hdr.includes("const changed = pageChanged(studio, publishedPage);")
  && /\{changed && \(\s*<button[\s\S]{0,300}onClick=\{publishPage\}[\s\S]{0,120}Publish changes/.test(hdr));
ok("...with a tooltip saying what publishing does", hdr.includes("Put your changes live — until then, visitors see the last published version"));
ok("...and the subtitle says whether there are changes", hdr.includes("You have unpublished changes") && hdr.includes("Everything is published"));
ok("...recomputed when the changes do", hdr.includes("[pageUrl, showToast, changed, publishPage]"));

/* ---- the data layer ---- */
const ctx = source("src/context/AppDataContext.jsx");
ok("links and colours have their own actions", ["addPageLink", "updatePageLink", "removePageLink", "updatePageTheme"]
  .every((a) => (ctx.match(new RegExp(`\\b${a},`, "g")) || []).length === 2 && ctx.includes(`const ${a} = useCallback`)));
ok("adding a link respects the limit", /addPageLink = useCallback\([\s\S]{0,200}>= MAX_LINKS/.test(ctx));
ok("the old toggle and cover state is gone", !ctx.includes("pagePlans") && !ctx.includes("coverGradient"));

done();
