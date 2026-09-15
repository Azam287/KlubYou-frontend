// Runs every tests/*.test.js(x) file.
//
// There's no test framework and no browser: each file is bundled with esbuild
// (so JSX and the app's imports just work), run with Node, and components are
// rendered to HTML with react-dom/server. That checks structure, text and
// rules — never how anything looks.
//
//   npm test                 every suite
//   npm test -- membership   only files whose name contains "membership"

import { build } from "esbuild";
import { spawnSync } from "node:child_process";
import { mkdirSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const testsDir = join(root, "tests");
// Inside node_modules so the bundles resolve react from the project.
const outDir = join(root, "node_modules", ".cache", "klubyou-tests");
mkdirSync(outDir, { recursive: true });

const filter = process.argv[2] || "";
const files = readdirSync(testsDir)
  .filter((f) => /\.test\.jsx?$/.test(f) && f.includes(filter))
  .sort();

if (!files.length) {
  console.error(`No test files match "${filter}".`);
  process.exit(1);
}

let failed = 0;
for (const file of files) {
  const outfile = join(outDir, file.replace(/\.jsx?$/, ".mjs"));
  try {
    await build({
      entryPoints: [join(testsDir, file)],
      bundle: true,
      format: "esm",
      platform: "node",
      jsx: "automatic",
      loader: { ".css": "empty" },
      external: ["react", "react-dom", "react-router-dom"],
      outfile,
      logLevel: "silent",
    });
  } catch (err) {
    // A file that won't build (a missing import, a syntax error) is a failure
    // to report, not a reason to stop running the others.
    failed++;
    console.log(`✗ ${file.padEnd(28)} did not build`);
    console.log((err.errors || []).map((e) => `    ${e.text}${e.location ? ` (${e.location.file}:${e.location.line})` : ""}`).join("\n") || `    ${err.message}`);
    continue;
  }
  // Run from the project root, so tests can read source files by `src/...`.
  const run = spawnSync(process.execPath, [outfile], { cwd: root, encoding: "utf8" });
  const out = `${run.stdout}${run.stderr}`;
  const passes = (out.match(/^PASS/gm) || []).length;
  const fails = out.match(/^FAIL.*$/gm) || [];
  const ok = run.status === 0;
  console.log(`${ok ? "✓" : "✗"} ${file.padEnd(28)} ${passes} passed${fails.length ? `, ${fails.length} failed` : ""}`);
  if (!ok) {
    failed++;
    console.log((fails.length ? fails.join("\n") : out).replace(/^/gm, "    "));
  }
}

console.log(failed ? `\n${failed} of ${files.length} files failed` : `\nall ${files.length} files passed`);
process.exit(failed ? 1 : 0);
