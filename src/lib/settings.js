// Studio settings: the name, the page address, the currency and the time zone.
// What each is checked against, and what changing one does to the rest.

import { CURRENCIES, currencySymbol, isCurrency, isTimezone, offsetLabel, partsOf } from "./locale";

export const PAGE_DOMAIN = "klubyou.co";
export const NAME_MAX = 60;
export const HANDLE_MIN = 3;
export const HANDLE_MAX = 30;

// What a person types into the address box, as it would appear in the URL.
export const normaliseHandle = (value) => String(value || "").trim().toLowerCase();

export const pageAddressOf = (handle) => `${PAGE_DOMAIN}/${handle}`;

// Why a page address can't be used, or "" if it can. `taken` is the list of
// addresses other studios have; the studio's own current one is always fine.
export function handleProblem(value, { current = "", taken = [] } = {}) {
  const h = normaliseHandle(value);
  if (h === current) return "";
  if (h.length < HANDLE_MIN) return `Use at least ${HANDLE_MIN} characters`;
  if (h.length > HANDLE_MAX) return `Keep it to ${HANDLE_MAX} characters or fewer`;
  if (!/^[a-z0-9-]+$/.test(h)) return "Use only letters, numbers and hyphens";
  if (h.startsWith("-") || h.endsWith("-")) return "It can't start or end with a hyphen";
  if (taken.includes(h)) return `${pageAddressOf(h)} is taken`;
  return "";
}

export function nameProblem(value) {
  const v = String(value || "").trim();
  if (!v) return "Your studio needs a name";
  if (v.length > NAME_MAX) return `Keep it to ${NAME_MAX} characters or fewer`;
  return "";
}

export const settingsOf = (studio) => ({
  name: studio?.name || "",
  handle: studio?.handle || "",
  currency: studio?.currency || CURRENCIES[0].code,
  timezone: studio?.timezone || "",
});

// Everything wrong with a draft, by field. Empty when it can be saved.
export function settingsProblems(draft, { current = "", taken = [] } = {}) {
  const out = {};
  const name = nameProblem(draft.name);
  const handle = handleProblem(draft.handle, { current, taken });
  if (name) out.name = name;
  if (handle) out.handle = handle;
  if (!isCurrency(draft.currency)) out.currency = "Pick a currency";
  if (!isTimezone(draft.timezone)) out.timezone = "Pick a time zone";
  return out;
}

// Which settings a draft changes, compared field by field after tidying.
export function settingsChanges(studio, draft) {
  const now = settingsOf(studio);
  const changed = [];
  if (draft.name.trim() !== now.name) changed.push("name");
  if (normaliseHandle(draft.handle) !== now.handle) changed.push("handle");
  if (draft.currency !== now.currency) changed.push("currency");
  if (draft.timezone !== now.timezone) changed.push("timezone");
  return changed;
}

// A saved programme share link carries the page address in it
// ("klubyou.co/maya/morning-vinyasa"), so a new address has to reach it too.
export function movedShareUrl(url, from, to) {
  const prefix = `${PAGE_DOMAIN}/${from}/`;
  return typeof url === "string" && url.startsWith(prefix) ? `${PAGE_DOMAIN}/${to}/${url.slice(prefix.length)}` : url;
}

// "Europe/London · GMT+1 · 9:41am there now"
export function timezoneLabel(tz, now = new Date()) {
  if (!isTimezone(tz)) return tz;
  const p = partsOf(now, tz);
  const clock = `${p.hour % 12 || 12}:${String(p.minute).padStart(2, "0")}${p.hour >= 12 ? "pm" : "am"}`;
  return `${tz.replace(/_/g, " ")} · ${offsetLabel(tz, now)} · ${clock}`;
}

// "£ British pound (GBP)"
export const currencyLabel = (code) => {
  const c = CURRENCIES.find((x) => x.code === code);
  return c ? `${currencySymbol(code).trim()} ${c.name} (${c.code})` : code;
};

// What saving these changes will do, in the words the confirmation shows.
// Only the ones worth pausing over: a name change isn't one.
export function settingsConsequences(studio, draft) {
  const changed = settingsChanges(studio, draft);
  const out = [];
  if (changed.includes("handle")) {
    out.push(
      `Your page moves to ${pageAddressOf(normaliseHandle(draft.handle))}. Links already shared to ` +
        `${pageAddressOf(studio.handle)} — your page, programme links and members' class links — stop working.`
    );
  }
  if (changed.includes("currency")) {
    out.push(
      `Every price is shown in ${currencyLabel(draft.currency)}. The numbers stay the same — nothing is converted, ` +
        `so check your prices.`
    );
  }
  if (changed.includes("timezone")) {
    out.push(
      `Times are shown in ${draft.timezone.replace(/_/g, " ")}. Everyday lessons and one-off classes keep their ` +
        `clock time (7:00am stays 7:00am there); programme classes keep the moment they happen, so their times move.`
    );
  }
  return out;
}
