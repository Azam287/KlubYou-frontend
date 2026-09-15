// The creator's public page: a profile, their links, and what they sell.
//
// Only the profile, the links and two colours are stored. What the page sells
// is read from the Membership and Programmes pages — published only — so the
// page can't advertise something that isn't on sale, and nobody has to keep a
// second list in step.

import { isPublished, isStudioOnly, leadOffer, offerPrice } from "./programme";
import { publishedOnly, sortedPlans } from "./membership";

/* ---------- colours ---------- */

// A handful of starting points. Any colour can still be picked by hand.
export const BACKGROUND_PRESETS = [
  { name: "White", value: "#ffffff" },
  { name: "Cream", value: "#f6f1ea" },
  { name: "Blush", value: "#fbe9e4" },
  { name: "Sage", value: "#e3ece4" },
  { name: "Lavender", value: "#ece6f7" },
  { name: "Purple", value: "#3a2e63" },
  { name: "Night", value: "#221a38" },
  { name: "Black", value: "#111111" },
];

export const TEXT_PRESETS = [
  { name: "Ink", value: "#221a38" },
  { name: "Charcoal", value: "#2b2b2b" },
  { name: "Forest", value: "#1f4d34" },
  { name: "Purple", value: "#5b3fa0" },
  { name: "Coral", value: "#b93a24" },
  { name: "White", value: "#ffffff" },
];

// Accent colours: the avatar, the intro video, link icons, buttons and the
// best-seller highlight. Picked once, used everywhere a page wants emphasis.
export const ACCENT_PRESETS = [
  { name: "Purple", value: "#3a2e63" },
  { name: "Violet", value: "#6d4bc3" },
  { name: "Ink", value: "#221a38" },
  { name: "Coral", value: "#c2412a" },
  { name: "Forest", value: "#2e7d50" },
  { name: "Ocean", value: "#1f5f8b" },
];

export const DEFAULT_THEME = { background: "#f6f1ea", text: "#221a38", accent: "#3a2e63" };

// "#abc" or "#aabbcc" → [r, g, b], or null for anything else.
export function parseHex(hex) {
  const m = String(hex || "").trim().match(/^#?([0-9a-f]{3}|[0-9a-f]{6})$/i);
  if (!m) return null;
  const h = m[1].length === 3 ? m[1].replace(/./g, (c) => c + c) : m[1];
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
}

// WCAG relative luminance.
function luminance([r, g, b]) {
  const channel = (v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

// 1 (none) to 21 (black on white).
export function contrastRatio(a, b) {
  const ca = parseHex(a);
  const cb = parseHex(b);
  if (!ca || !cb) return 1;
  const [hi, lo] = [luminance(ca), luminance(cb)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

// 4.5 is the WCAG AA line for body text. Below it, the page is hard to read
// for a lot of people — and it's easy to get there by changing one colour and
// forgetting the other.
export const READABLE = 4.5;
export const isReadable = (theme) => contrastRatio(theme?.background, theme?.text) >= READABLE;

// Whichever of dark ink or white reads better on a background — the one-click
// fix when the two colours clash.
export const bestTextOn = (background) =>
  contrastRatio(background, "#ffffff") >= contrastRatio(background, "#221a38") ? "#ffffff" : "#221a38";

export const themeOf = (studio) => ({ ...DEFAULT_THEME, ...(studio?.theme || {}) });

// The label colour on anything filled with the accent — white or dark,
// whichever reads — so a pale accent never leaves a button unreadable. Worked
// out, not picked: it's the one colour a creator should never have to think about.
export const onAccent = (accent) => bestTextOn(accent);

// Buttons and shapes need 3:1 against the page to be seen (WCAG, non-text).
export const ACCENT_VISIBLE = 3;
export const accentVisible = (theme) =>
  contrastRatio(theme?.background, theme?.accent) >= ACCENT_VISIBLE;

/* ---------- header image ---------- */

// The picture across the top of the page. Stored as a data URL, since there's
// no server to upload to — which is why the size is capped: it lives in memory.
export const MAX_IMAGE_MB = 5;
export const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

// Why a chosen file can't be used, in words for the creator — or null if it can.
export function imageFileProblem(file) {
  if (!file) return "No file was chosen.";
  if (!IMAGE_TYPES.includes(file.type)) return "That isn't a JPG, PNG, WebP or GIF image.";
  if (file.size > MAX_IMAGE_MB * 1024 * 1024) {
    return `That image is ${(file.size / 1024 / 1024).toFixed(1)} MB — the limit is ${MAX_IMAGE_MB} MB.`;
  }
  return null;
}

/* ---------- previewing ---------- */

// The same page, seen the two ways followers arrive: from a link in bio on a
// phone, or on a computer.
export const PREVIEW_DEVICES = [
  { key: "phone", label: "Phone", icon: "phone" },
  { key: "web", label: "Web", icon: "monitor" },
];

/* ---------- links ---------- */

// Well-known sites get their proper name (and an icon), so pasting a URL is
// enough.
const PLATFORMS = [
  [/(^|\.)instagram\.com$/, "instagram", "Instagram"],
  [/(^|\.)(youtube\.com|youtu\.be)$/, "youtube", "YouTube"],
  [/(^|\.)tiktok\.com$/, "tiktok", "TikTok"],
  [/(^|\.)(x\.com|twitter\.com)$/, "x", "X"],
  [/(^|\.)facebook\.com$/, "facebook", "Facebook"],
  [/(^|\.)linkedin\.com$/, "linkedin", "LinkedIn"],
  [/(^|\.)spotify\.com$/, "spotify", "Spotify"],
  [/(^|\.)substack\.com$/, "substack", "Substack"],
  [/(^|\.)pinterest\.com$/, "pinterest", "Pinterest"],
];

export const MAX_LINKS = 8;

// "https://www.instagram.com/maya" → "instagram.com"
export function hostOf(url) {
  return String(url || "")
    .trim()
    .replace(/^[a-z]+:\/\//i, "")
    .split(/[/?#]/)[0]
    .replace(/^www\./i, "")
    .toLowerCase();
}

// Loose on purpose: people paste "instagram.com/maya" without the https.
export const looksLikeUrl = (url) =>
  /^(https?:\/\/)?[^\s/.]+(\.[^\s/.]+)*\.[a-z]{2,}(\/\S*)?$/i.test(String(url || "").trim());

// An email address, with or without "mailto:" — the contact link most creator
// pages carry. It used to pass as a web link and show up labelled with the
// whole address, "mailto:" and all.
export const isEmailLink = (url) =>
  /^(mailto:)?[^\s@/:]+@[^\s@/]+\.[a-z]{2,}$/i.test(String(url || "").trim());

// What the button says: the creator's own label, else the site's name, else
// the domain.
export function linkLabel(link) {
  const own = (link?.label || "").trim();
  if (own) return own;
  if (isEmailLink(link?.url)) return "Email";
  const known = platformOf(link?.url);
  return known ? known.name : hostOf(link?.url) || "Link";
}

// { key, name } for a well-known site, else null. `key` is also its icon name.
export function platformOf(url) {
  // An address at gmail.com isn't a link to Gmail.
  if (isEmailLink(url)) return null;
  const host = hostOf(url);
  const hit = PLATFORMS.find(([re]) => re.test(host));
  return hit ? { key: hit[1], name: hit[2] } : null;
}

// Links split the way creator pages show them: well-known social accounts as a
// row of icons, everything else as full-width buttons. Giving a social link
// your own label makes it a button — naming it says you want it seen.
export const socialLinks = (links) =>
  visibleLinks(links).filter((l) => platformOf(l.url) && !(l.label || "").trim());

export const buttonLinks = (links) =>
  visibleLinks(links).filter((l) => !platformOf(l.url) || (l.label || "").trim());

// Links that would actually go somewhere. Half-typed rows stay in the editor
// but don't reach the page.
export const visibleLinks = (links) => (links || []).filter((l) => looksLikeUrl(l.url));

/* ---------- what the page sells ---------- */

// Every published plan, longest first — the same order as the Membership page.
export const pagePlans = (plans) => sortedPlans(publishedOnly(plans));

// Every published programme, whether or not it's on the page — what the
// editor lists to choose from. Drafts can't be chosen: they aren't on sale.
export const publishedProgrammes = (programmes) => (programmes || []).filter(isPublished);

// What the page shows: published, minus the ones the creator hid. The hidden
// ones are stored rather than the shown ones, so a programme published later
// appears on the page without anyone having to remember to tick it.
export const pageProgrammes = (programmes, hidden = []) =>
  publishedProgrammes(programmes).filter((p) => !(hidden || []).includes(p.id));

export const isOnPage = (studio, programmeId) =>
  !(studio?.hiddenProgrammes || []).includes(programmeId);

// The cheapest way in, for the "Join from £18" button pinned to the bottom of
// the page. Null when nothing is on sale.
export const cheapestPlan = (plans) =>
  (plans || []).reduce((best, p) => (!best || (p.amount || 0) < (best.amount || 0) ? p : best), null);

// How a programme is bought, in the words the page uses.
// "£12/month", "£30 every 3 months". Offers store their length as "1 month"
// or "3 months", which read as "£12/1 month" when pasted in whole.
export function programmePriceLabel(programme) {
  const lead = leadOffer(programme);
  if (lead) {
    const price = offerPrice(lead);
    if (lead.kind !== "subscription") return price;
    const n = parseInt(String(lead.length || "1"), 10) || 1;
    return n === 1 ? `${price}/month` : `${price} every ${n} months`;
  }
  return isStudioOnly(programme) ? "With membership" : "";
}

// What a programme's button says — or null for no button. A programme sold only
// through the membership points at joining, which only makes sense when there's
// a membership on the page to join.
export function programmeAction(programme, { canJoin = true } = {}) {
  const lead = leadOffer(programme);
  if (!lead) return canJoin ? "Join a membership" : null;
  return lead.kind === "subscription" ? "Subscribe" : "Buy";
}

/* ---------- section order ---------- */

// The parts of the page below the name and tagline, which the creator can put
// in any order. The header (image, name, tagline) always comes first.
export const PAGE_SECTIONS = [
  { key: "about", label: "About you" },
  { key: "video", label: "Intro video" },
  { key: "links", label: "Links" },
  { key: "memberships", label: "Memberships" },
  { key: "programmes", label: "Programmes" },
];

const SECTION_KEYS = PAGE_SECTIONS.map((s) => s.key);

// The stored order, made whole: unknown keys dropped, duplicates removed, and
// any section missing from it (one added since it was saved) put at the end —
// so a section can never silently vanish from the page because of an old order.
export function sectionOrderOf(studio) {
  const saved = (studio?.sectionOrder || []).filter((k, i, a) => SECTION_KEYS.includes(k) && a.indexOf(k) === i);
  return [...saved, ...SECTION_KEYS.filter((k) => !saved.includes(k))];
}

// Sections the creator has switched off. Stored as the hidden ones, like
// programmes, so a section added later is on by default.
export const isSectionHidden = (studio, key) => (studio?.hiddenSections || []).includes(key);

// What the page actually shows, in order.
export const visibleSections = (studio) => sectionOrderOf(studio).filter((k) => !isSectionHidden(studio, k));

// `id` moved to position `to` (clamped), everything else keeping its order.
export function moveItem(order, id, to) {
  const from = order.indexOf(id);
  if (from < 0) return order;
  const target = Math.max(0, Math.min(order.length - 1, to));
  if (target === from) return order;
  const next = order.filter((k) => k !== id);
  next.splice(target, 0, id);
  return next;
}

// Where a dragged item lands when dropped on the item at `over`, above or below
// its midpoint. Taking the dragged item out first shifts everything after it up
// one, which is the off-by-one this exists to get right.
export function dropIndex(from, over, after) {
  const to = over + (after ? 1 : 0);
  return from < to ? to - 1 : to;
}

// The one line a collapsed tile shows, so you can see what's in it without
// opening it.
export function sectionSummary(key, { studio, plans = [], published = [] }) {
  switch (key) {
    case "about": {
      const words = (studio?.about || "").trim().split(/\s+/).filter(Boolean).length;
      return words ? `${words} word${words === 1 ? "" : "s"}` : "Not written yet";
    }
    case "video": {
      const url = (studio?.introVideo || "").trim();
      if (!url) return "Not added";
      return looksLikeUrl(url) ? platformOf(url)?.name || hostOf(url) : "Not a link yet";
    }
    case "links": {
      const n = visibleLinks(studio?.links).length;
      return n ? `${n} link${n === 1 ? "" : "s"}` : "None yet";
    }
    case "memberships":
      return plans.length ? `${plans.length} published` : "None published";
    case "programmes": {
      if (!published.length) return "None published";
      const hidden = studio?.hiddenProgrammes || [];
      const shown = published.filter((p) => !hidden.includes(p.id)).length;
      return `${shown} of ${published.length} shown`;
    }
    default:
      return "";
  }
}

/* ---------- the intro video player ---------- */

// The embeddable player for a YouTube or Vimeo link — { provider, id, src } —
// or null for anything else, which the page shows as a plain "Watch my intro"
// card instead. Accepts the shapes people paste: youtu.be/ID,
// youtube.com/watch?v=ID, /shorts/ID, /embed/ID, vimeo.com/123456.
export function videoEmbedOf(url) {
  const raw = String(url || "").trim();
  if (!looksLikeUrl(raw)) return null;
  const withScheme = /^[a-z]+:\/\//i.test(raw) ? raw : `https://${raw}`;
  let u;
  try {
    u = new URL(withScheme);
  } catch {
    return null;
  }
  const host = u.hostname.replace(/^(www|m)\./, "").toLowerCase();
  const ytId = (id) => (/^[A-Za-z0-9_-]{11}$/.test(id || "") ? id : null);

  if (host === "youtu.be" || host.endsWith("youtube.com") || host === "youtube-nocookie.com") {
    const parts = u.pathname.split("/").filter(Boolean);
    const id =
      host === "youtu.be"
        ? ytId(parts[0])
        : ytId(u.searchParams.get("v")) ||
          (["shorts", "embed", "live"].includes(parts[0]) ? ytId(parts[1]) : null);
    return id
      ? { provider: "YouTube", id, src: `https://www.youtube-nocookie.com/embed/${id}?rel=0&modestbranding=1` }
      : null;
  }

  if (host === "vimeo.com" || host === "player.vimeo.com") {
    const id = u.pathname.split("/").filter((p) => /^\d+$/.test(p)).pop();
    return id ? { provider: "Vimeo", id, src: `https://player.vimeo.com/video/${id}` } : null;
  }

  return null;
}

/* ---------- publishing the page ---------- */

// Everything on My page that visitors see, normalised so that putting a thing
// back the way it was counts as no change: the theme with its defaults, the
// full section order, hidden lists in a fixed order. What the page sells isn't
// here — memberships and programmes are published on their own pages.
export function pageSnapshot(studio) {
  const sorted = (list) => [...(list || [])].sort();
  return {
    name: studio?.name || "",
    tagline: studio?.tagline || "",
    about: studio?.about || "",
    introVideo: studio?.introVideo || "",
    coverImage: studio?.coverImage || "",
    avatarImage: studio?.avatarImage || "",
    links: (studio?.links || []).map((l) => ({ id: l.id, label: l.label || "", url: l.url || "" })),
    theme: themeOf(studio),
    sectionOrder: sectionOrderOf(studio),
    hiddenSections: sorted(studio?.hiddenSections),
    hiddenProgrammes: sorted(studio?.hiddenProgrammes),
  };
}

// Whether the page being edited differs from the one visitors see.
export const pageChanged = (studio, published) =>
  JSON.stringify(pageSnapshot(studio)) !== JSON.stringify(published);
