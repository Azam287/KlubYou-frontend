// Claude Code Stop hook: don't let Claude finish while code has changed and
// the documentation hasn't caught up. Wired up in .claude/settings.json.
//
// It compares uncommitted changes only. If the newest change to code is newer
// than the newest change to the docs, Claude is asked — once per stop — to
// update them, or to confirm nothing needs updating by touching the marker
// file below. Committing clears the slate.
//
// Try it: echo '{}' | node scripts/docs-check.mjs

import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, statSync } from "node:fs";
import { join, resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const MARKER = ".claude/docs-reviewed"; // local only, gitignored

const CODE = [/^src\//, /^tests\//, /^scripts\//, /^index\.html$/, /^package\.json$/, /^vite\.config\.js$/, /^eslint\.config\.js$/];
const DOCS = [/^CLAUDE\.md$/, /^README\.md$/, /^docs\//];

let input = {};
try {
  input = JSON.parse(readFileSync(0, "utf8") || "{}");
} catch {
  // No payload (run by hand) — carry on.
}

// Already sent back once for this stop: let it finish, or it would loop.
if (input.stop_hook_active) process.exit(0);

let status = "";
try {
  status = execFileSync("git", ["status", "--porcelain", "--untracked-files=all"], { cwd: root, encoding: "utf8" });
} catch {
  process.exit(0); // not a git checkout — nothing to compare
}

const newest = (paths) =>
  paths.reduce((latest, p) => {
    const full = join(root, p);
    return existsSync(full) ? Math.max(latest, statSync(full).mtimeMs) : latest;
  }, 0);

const changed = status
  .split("\n")
  .filter(Boolean)
  .map((line) => line.slice(3).replace(/^.* -> /, "").replace(/^"|"$/g, ""));

const code = changed.filter((p) => CODE.some((re) => re.test(p)));
if (!code.length) process.exit(0);

const docs = changed.filter((p) => DOCS.some((re) => re.test(p)));
const codeAt = newest(code);
const docsAt = Math.max(newest(docs), newest([MARKER]));

if (docsAt >= codeAt) process.exit(0);

const list = code.slice(0, 8).join(", ") + (code.length > 8 ? `, and ${code.length - 8} more` : "");
console.log(
  JSON.stringify({
    decision: "block",
    reason:
      `Code changed since the docs were last updated (${list}). Before finishing, keep the shared project context current:\n` +
      "- docs/decisions.md — append an entry if the user made, changed or rejected a product decision.\n" +
      "- docs/domain.md — if a rule, term or behaviour changed.\n" +
      "- docs/architecture.md, docs/testing.md, CLAUDE.md, README.md — if structure, conventions, commands or tests changed.\n" +
      `If nothing needs updating (e.g. a pure bug fix with no rule change), run \`touch ${MARKER}\` and say in one line that the docs were checked. Don't pad the docs.`,
  })
);
