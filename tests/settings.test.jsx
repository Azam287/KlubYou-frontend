// Settings: the studio's name, page address, currency and time zone — and that
// every time rule reads the studio's zone, not the browser's. See lib/locale.js,
// lib/settings.js.
import { renderToString } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { ok, done, source, clean } from "./harness";
import SettingsPage from "../src/components/dashboard/settings/SettingsPage.jsx";
import { ToastProvider } from "../src/context/ToastContext.jsx";
import { AppDataProvider } from "../src/context/AppDataContext.jsx";
import { PageHeaderProvider } from "../src/context/PageHeaderContext.jsx";
import { initialProgrammes as P, initialStudio as S, takenHandles } from "../src/data/mockData";
import {
  DEFAULT_CURRENCY,
  DEFAULT_TIMEZONE,
  applyStudioLocale,
  money,
  money2,
  partsOf,
  studioTimezone,
  zonedDate,
} from "../src/lib/locale";
import { dayKeyOf, formatDay, formatTime, formatWhen, fromDateTimeInputs, fromDayInput, sameMonth, toDateInput, toTimeInput } from "../src/lib/datetime";
import { nextRun } from "../src/lib/everyday";
import { startOfWeek, weekOf } from "../src/lib/schedule";
import { expandSeries, offerPrice, scheduleWindow } from "../src/lib/programme";
import { addMonths, nextPayoutDay } from "../src/lib/payments";
import { earningsToDate } from "../src/lib/overview";
import {
  handleProblem,
  movedShareUrl,
  nameProblem,
  settingsChanges,
  settingsConsequences,
  settingsOf,
  settingsProblems,
} from "../src/lib/settings";

const H = (n) => n * 3600000;
const iso = (d) => new Date(d).toISOString();
const reset = () => applyStudioLocale({ timezone: DEFAULT_TIMEZONE, currency: DEFAULT_CURRENCY });

/* ---- the zone's clock ---- */
ok("the demo studio starts in London, in pounds", S.timezone === "Europe/London" && S.currency === "GBP" && studioTimezone() === "Europe/London");
ok("7am in London in September is 6am UTC (summer time)", iso(zonedDate(2026, 8, 16, 7, 0, 0, "Europe/London")) === "2026-09-16T06:00:00.000Z");
ok("...and 7am UTC in December (winter)", iso(zonedDate(2026, 11, 16, 7, 0, 0, "Europe/London")) === "2026-12-16T07:00:00.000Z");
ok("half-hour zones work: 7am in Kolkata is 1:30am UTC", iso(zonedDate(2026, 8, 16, 7, 0, 0, "Asia/Kolkata")) === "2026-09-16T01:30:00.000Z");
ok("days roll over like new Date does (day 0 is the last of the month before)", partsOf(zonedDate(2026, 2, 0, 12), "Europe/London").day === 28);
ok("a time the clocks skip lands after the jump", partsOf(zonedDate(2026, 2, 29, 1, 30, 0, "Europe/London"), "Europe/London").hour === 2);
ok("the wall clock reads back what went in", (() => {
  const p = partsOf(zonedDate(2026, 5, 3, 19, 45, 0, "America/New_York"), "America/New_York");
  return p.year === 2026 && p.month === 5 && p.day === 3 && p.hour === 19 && p.minute === 45 && p.weekday === 3;
})());
ok("an unknown zone or currency falls back rather than breaking the page",
  (applyStudioLocale({ timezone: "Mars/Olympus", currency: "XYZ" }), studioTimezone() === DEFAULT_TIMEZONE && money(5) === "£5"));
reset();

/* ---- everything reads it ---- */
const instant = "2026-09-16T06:00:00.000Z";
ok("the same moment reads 7:00am in London…", formatTime(instant) === "7:00am");
applyStudioLocale({ timezone: "Asia/Kolkata" });
ok("…and 11:30am once the studio is in Kolkata", formatTime(instant) === "11:30am" && formatWhen(instant).startsWith("Wed 16 Sep"));
ok("a late-evening UTC moment is already tomorrow there", dayKeyOf("2026-09-16T20:00:00.000Z") === "2026-09-17");
ok("a picked date is that day in the studio's zone", iso(fromDayInput("2026-09-18")) === "2026-09-17T18:30:00.000Z" && toDateInput("2026-09-17T18:30:00.000Z") === "2026-09-18");
ok("date and time pickers build the studio's time", iso(fromDateTimeInputs("2026-09-18", "07:00")) === "2026-09-18T01:30:00.000Z"
  && toTimeInput("2026-09-18T01:30:00.000Z") === "07:00");
const now = new Date("2026-09-16T12:00:00Z");
const next = nextRun({ time: "07:00", days: [0, 1, 2, 3, 4, 5, 6], active: true }, now);
ok("an everyday lesson at 7:00 runs at 7:00 in the studio's zone", partsOf(next).hour === 7 && partsOf(next).minute === 0 && iso(next) === "2026-09-17T01:30:00.000Z");
const week = weekOf(now, { lessons: [], programmes: [] });
ok("the schedule's week starts at Monday midnight in the studio's zone", partsOf(week.from).weekday === 1 && partsOf(week.from).hour === 0
  && iso(startOfWeek(now)) === "2026-09-13T18:30:00.000Z");
ok("a run window starts at the studio's midnight", partsOf(scheduleWindow({ startsOn: "2026-09-21", weeks: 2 }).startsOn).hour === 0);
ok("payout day is the studio's Friday", partsOf(nextPayoutDay(now)).weekday === 5 && partsOf(nextPayoutDay(now)).hour === 0);
ok("this month starts at the studio's midnight: 20:00 UTC on 31 Aug is already September in Kolkata",
  sameMonth("2026-08-31T20:00:00Z", new Date("2026-09-10T12:00:00Z"))
  && earningsToDate([{ status: "paid", amount: 50, paidAt: "2026-08-31T20:00:00Z" }], new Date("2026-09-10T12:00:00Z")).thisMonth === 50);
reset();
ok("…but still August in London", !sameMonth("2026-08-31T20:00:00Z", new Date("2026-09-10T12:00:00Z")));
const series = expandSeries(iso(zonedDate(2026, 9, 18, 7)), "weekly", 3);
ok("a weekly 7am series stays at 7am across the clocks going back", series.every((d) => partsOf(d).hour === 7) && series.length === 3
  && new Date(series[1]) - new Date(series[0]) === 7 * 24 * H(1) + H(1));
ok("31 Jan plus a month is the end of February, in the studio's zone", formatDay(addMonths(iso(zonedDate(2026, 0, 31, 9)), 1)) === "Sat 28 Feb");

// Guard: the browser's clock creeping back in. Every rule and component should
// go through datetime.js / locale.js.
const files = (dir) => readdirSync(dir).flatMap((f) => {
  const p = join(dir, f);
  return statSync(p).isDirectory() ? files(p) : /\.jsx?$/.test(f) ? [p] : [];
});
const local = /\.(getHours|getMinutes|getDay|getDate|getMonth|getFullYear|setHours|setDate|setMonth|setMinutes|setFullYear)\(|toDateString\(|toLocaleDateString\(|toLocaleTimeString\(|new Date\(\s*[a-z.]+\s*,/;
const offenders = [...files("src/lib"), ...files("src/components"), "src/data/mockData.js"]
  .filter((f) => !f.endsWith("locale.js"))
  .filter((f) => local.test(source(f)));
ok("nothing reads the browser's clock directly", offenders.length === 0, offenders.join(", "));

/* ---- money ---- */
ok("pounds by default, pence only when there are some", money(40) === "£40" && money(12.5) === "£12.50" && money(1234) === "£1,234" && money2(92) === "£92.00");
applyStudioLocale({ currency: "USD" });
ok("changing the currency relabels every price", money(40) === "$40" && money2(9) === "$9.00");
const of1 = P[0].pricing.offers[0];
ok("…offers too, even ones saved with £ in the text", of1.price.startsWith("£") && offerPrice(of1) === "$40");
applyStudioLocale({ currency: "INR" });
ok("…and nothing is converted", money(40) === "₹40");
reset();
ok("no price is written with a hard-coded £ any more", [...files("src/lib"), ...files("src/components")]
  .filter((f) => /[`"]£\$\{|\(£[,)]|£0/.test(source(f))).length === 0);

/* ---- the settings rules ---- */
ok("a page address needs 3 characters", handleProblem("ab") === "Use at least 3 characters");
ok("…only letters, numbers and hyphens", handleProblem("maya yoga") === "Use only letters, numbers and hyphens" && handleProblem("maya_yoga") !== "");
ok("…no hyphen at either end", handleProblem("-maya") !== "" && handleProblem("maya-") !== "");
ok("…and not someone else's", handleProblem("yoga", { taken: takenHandles }) === "klubyou.co/yoga is taken");
ok("typing in capitals is the same address", handleProblem("Maya-Yoga", { taken: takenHandles }) === "");
ok("the studio's own address is always fine", handleProblem("maya", { current: "maya", taken: ["maya"] }) === "");
ok("a studio needs a name", nameProblem("  ") === "Your studio needs a name" && nameProblem("x".repeat(61)) !== "" && nameProblem("Maya") === "");
ok("an unknown zone or currency can't be saved", Object.keys(settingsProblems({ ...settingsOf(S), timezone: "Nope", currency: "XYZ" })).join() === "currency,timezone");
ok("nothing changed is no changes", settingsChanges(S, settingsOf(S)).length === 0);
ok("tidying doesn't count as a change", settingsChanges(S, { ...settingsOf(S), name: ` ${S.name} `, handle: "MAYA" }).length === 0);
const all = settingsConsequences(S, { name: "New", handle: "maya-yoga", currency: "USD", timezone: "Asia/Kolkata" });
ok("moving the page says which links stop working", all[0].includes("klubyou.co/maya-yoga") && all[0].includes("stop working"));
ok("changing currency says nothing is converted", all[1].includes("nothing is converted"));
ok("changing zone says what moves and what doesn't", all[2].includes("keep their clock time") && all[2].includes("their times move"));
ok("a rename alone needs no warning", settingsConsequences(S, { ...settingsOf(S), name: "New name" }).length === 0);
ok("a new address reaches share links that carry the old one", movedShareUrl("klubyou.co/maya/morning-vinyasa", "maya", "maya-yoga") === "klubyou.co/maya-yoga/morning-vinyasa"
  && movedShareUrl("klubyou.co/mayan/x", "maya", "new") === "klubyou.co/mayan/x");

/* ---- the store and the page ---- */
const store = source("src/context/AppDataContext.jsx");
ok("saving is a store action, in the value and its dependencies", (store.match(/\bupdateSettings,/g) || []).length === 2);
ok("…which moves share links, updates the published name, and applies the zone before rendering",
  store.includes("movedShareUrl(") && store.includes("setPublishedPage((p) => ({ ...p, name }))") && store.includes("applyStudioLocale(studio)"));
ok("…and redraws everything when zone or currency changes", store.includes("key={`${studio.timezone}|${studio.currency}`}"));

const page = clean(renderToString(
  <ToastProvider><AppDataProvider><PageHeaderProvider><MemoryRouter><SettingsPage /></MemoryRouter></PageHeaderProvider></AppDataProvider></ToastProvider>));
ok("the settings page has the four settings", ["Studio name", "Page address", "Currency", "Time zone"].every((t) => page.includes(`>${t}</label>`)));
ok("…filled in with the studio's", page.includes(`value="${S.name}"`) && page.includes('value="maya"') && page.includes(">klubyou.co/</span>"));
ok("…shows the time there now", /Europe\/London · GMT(\+1)? · \d+:\d\d[ap]m there now/.test(page));
ok("…and nothing to save yet", page.includes("Everything is saved") && /<button[^>]*disabled=""[^>]*>Save changes/.test(page));
ok("the sidebar and routes have settings", source("src/components/layout/Sidebar.jsx").includes('"/dashboard/settings"') && source("src/App.jsx").includes('path="settings"'));

done();
