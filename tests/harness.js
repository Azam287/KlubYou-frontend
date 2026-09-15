// The whole test "framework": a named assertion that prints PASS or FAIL, and a
// summary that sets the exit code. Kept this small on purpose.
import { readFileSync } from "node:fs";

let fails = 0;

// ok("what should be true", condition, "what to print if it isn't")
export function ok(label, condition, detail = "") {
  console.log(`${condition ? "PASS" : "FAIL"}  ${label}${condition ? "" : `  <- ${detail}`}`);
  if (!condition) fails++;
}

export function done() {
  console.log(fails ? `\n${fails} FAILED` : "\nall passed");
  process.exit(fails ? 1 : 0);
}

// Source text, for things server rendering can't see: effects, open menus.
export const source = (path) => readFileSync(path, "utf8");

// renderToString output with React's escaping undone, so assertions can be
// written against the text as it reads.
export const clean = (html) =>
  html
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/&#x27;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&");
