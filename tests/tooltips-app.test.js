// Every button, link and menu action in the app has a tooltip. Checked by
// reading the source, because most controls only render in states a one-off
// server render never reaches (open menus, modals, hover, empty lists).
//
// A control passes if it carries `data-tip`, or sits directly inside a
// `<span className="tip-wrap" data-tip=…>` (how a disabled button gets one).
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { ok, done } from "./harness";

const walk = (dir) =>
  readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    return statSync(p).isDirectory() ? walk(p) : p.endsWith(".jsx") ? [p] : [];
  });

// Opening tags of `name`, with their position. Reads past `>` inside `{…}`
// and quotes, so `onClick={() => x}` doesn't end the tag early.
function openingTags(src, name) {
  const out = [];
  let i = 0;
  while ((i = src.indexOf(`<${name}`, i)) >= 0) {
    const after = src[i + name.length + 1];
    if (after && /[A-Za-z0-9]/.test(after)) {
      i += 1;
      continue;
    }
    let depth = 0;
    let quote = null;
    let k = i + 1;
    for (; k < src.length; k++) {
      const c = src[k];
      if (quote) {
        if (c === quote) quote = null;
      } else if (depth === 0 && (c === '"' || c === "'" || c === "`")) quote = c;
      else if (c === "{") depth++;
      else if (c === "}") depth--;
      else if (c === ">" && depth === 0 && src[k - 1] !== "=") break;
    }
    out.push({ at: i, tag: src.slice(i, k + 1) });
    i = k;
  }
  return out;
}

// The nearest wrapper opened before the control and not yet closed — written on
// one line or across several.
const wrappedInTip = (src, at) => {
  const before = src.slice(0, at);
  const cls = before.lastIndexOf('className="tip-wrap');
  if (cls < 0) return false;
  const open = before.lastIndexOf("<span", cls);
  return open >= 0 && /^<span\s+$/.test(before.slice(open, cls)) && !before.slice(open).includes("</span>")
    && /data-tip=/.test(before.slice(open));
};

const files = walk("src/components");
const lineOf = (src, at) => src.slice(0, at).split("\n").length;

const missing = [];
for (const file of files) {
  const src = readFileSync(file, "utf8");
  for (const name of ["button", "Link", "NavLink"]) {
    for (const { at, tag } of openingTags(src, name)) {
      if (/\sdata-tip=/.test(tag) || wrappedInTip(src, at)) continue;
      missing.push(`${file}:${lineOf(src, at)} <${name}>`);
    }
  }
}
ok("every button and link in the app has a tooltip", missing.length === 0, missing.join("\n    "));

// Menus: the ⋯ trigger and every item in it.
const menuMisses = [];
for (const file of files) {
  const src = readFileSync(file, "utf8");
  for (const { at, tag } of openingTags(src, "KebabMenu")) {
    if (!/\stip=/.test(tag)) menuMisses.push(`${file}:${lineOf(src, at)} ⋯ trigger`);
    // Items are written inline in `items={[…]}` or built up as `items.push({…})`.
    const block = tag.slice(tag.indexOf("items="));
    const labels = (block.match(/\blabel:/g) || []).length;
    const tips = (block.match(/\btip:/g) || []).length;
    if (labels !== tips) menuMisses.push(`${file}:${lineOf(src, at)} ${labels - tips} item(s) without a tip`);
  }
  for (const m of src.matchAll(/items\.push\(([\s\S]*?)\);/g)) {
    const labels = (m[1].match(/\blabel:/g) || []).length;
    const tips = (m[1].match(/\btip:/g) || []).length;
    if (labels !== tips) menuMisses.push(`${file}:${lineOf(src, m.index)} pushed item(s) without a tip`);
  }
}
ok("every menu, and every item in it, has a tooltip", menuMisses.length === 0, menuMisses.join("\n    "));

// Native title tooltips double up with data-tip and can't be styled. `title`
// as a prop of Modal / ConfirmModal is a heading, and an iframe's title is its
// accessible name — those are fine.
const titles = [];
for (const file of files) {
  const src = readFileSync(file, "utf8");
  for (const name of ["button", "span", "div", "a", "td", "th", "label", "input", "li", "b", "small"]) {
    for (const { at, tag } of openingTags(src, name)) {
      if (/\stitle=/.test(tag)) titles.push(`${file}:${lineOf(src, at)} <${name} title>`);
    }
  }
}
ok("no native title tooltips are left", titles.length === 0, titles.join("\n    "));

ok("the scan actually looked at the app", files.length > 60 && files.some((f) => f.endsWith("ProgrammeDetailPage.jsx")));

done();
