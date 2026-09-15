import { useMemo, useState } from "react";
import { usePageHeader } from "../../../context/PageHeaderContext";
import { useAppData } from "../../../context/AppDataContext";
import { Link } from "react-router-dom";
import Icon from "../../common/Icon";
import LessonCard from "./LessonCard";
import LessonFormModal from "./LessonFormModal";
import SearchInput from "../../common/SearchInput";
import SearchEmpty from "../../common/SearchEmpty";
import { byNextRun, patternLabel, repeats, timeLabel } from "../../../lib/everyday";
import { matchesQuery } from "../../../lib/search";
import { recentSessions, sessionReport } from "../../../lib/attendance";
import { joinLinkOf, lessonTarget } from "../../../lib/sessions";

export default function ClassesPage() {
  const {
    studio,
    members,
    studioPlans,
    bundles,
    programmes,
    attendance,
    everydayLessons,
    addEverydayLesson,
    updateEverydayLesson,
    toggleEverydayLesson,
    deleteEverydayLesson,
  } = useAppData();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  // Which kind the form opens as. One record type still backs both — this
  // decides which half of the form is shown, so neither kind is asked a
  // question the button already answered.
  const [adding, setAdding] = useState("everyday");
  const [search, setSearch] = useState("");

  const openNew = (kind) => {
    setEditing(null);
    setAdding(kind);
    setFormOpen(true);
  };

  // Memoized so it's a stable element reference across renders — usePageHeader
  // stores this in context, and a fresh element every render would re-trigger
  // its effect (via the `action` dependency) on every single render.
  const headerActions = useMemo(
    () => (
      // One flex child: the topbar is space-between, so two loose buttons
      // would be pushed to opposite ends of it.
      <div className="hdr-actions">
        <button
          className="btn btn-ghost"
          onClick={() => openNew("once")}
          data-tip="Add a single session on one date, like a workshop"
        >
          <Icon name="plus" size={16} strokeWidth={2.2} /> One-off class
        </button>
        <button
          className="btn btn-coral"
          onClick={() => openNew("everyday")}
          data-tip="Add a class that repeats on set days, same time and link"
        >
          <Icon name="plus" size={16} strokeWidth={2.2} /> Everyday lesson
        </button>
      </div>
    ),
    []
  );

  usePageHeader(
    "Everyday lessons",
    "Everything your subscribers can just turn up to. No separate price.",
    headerActions
  );

  // Soonest first within each group, so what's on today is at the top and
  // finished one-offs sink to the bottom.
  // Searched by title, days ("weekdays") and time ("7:00am").
  const [regular, oneOffs] = useMemo(() => {
    const sorted = [...everydayLessons]
      .sort((a, b) => byNextRun(a, b))
      .filter((l) => matchesQuery([l.title, patternLabel(l), timeLabel(l.time)], search));
    return [sorted.filter(repeats), sorted.filter((l) => !repeats(l))];
  }, [everydayLessons, search]);
  const searching = search.trim() !== "";

  const openForm = (item) => {
    setEditing(item);
    setFormOpen(true);
  };

  // Each lesson's most recent session that has started, for the card's
  // "Last time: 5 of 8 came" line.
  const latestOf = useMemo(() => {
    const data = { members, plans: studioPlans, bundles, programmes, lessons: everydayLessons, attendance };
    const latest = new Map();
    for (const s of recentSessions(data)) {
      if (s.kind !== "programme" && !latest.has(s.refId)) latest.set(s.refId, s);
    }
    return (lessonId) => (latest.has(lessonId) ? sessionReport(latest.get(lessonId), data) : null);
  }, [members, studioPlans, bundles, programmes, everydayLessons, attendance]);

  const list = (items, empty) =>
    items.length ? (
      items.map((item) => (
        <LessonCard
          key={item.id}
          item={item}
          link={joinLinkOf(studio.handle, lessonTarget(item.id))}
          latest={latestOf(item.id)}
          onEdit={openForm}
          onToggle={toggleEverydayLesson}
          onDelete={deleteEverydayLesson}
        />
      ))
    ) : (
      <p className="sec-empty">{empty}</p>
    );

  return (
    <section className="panel">
      <div className="banner">
        <span className="bi">
          <Icon name="info" size={20} />
        </span>
        <div>
          <b>Lessons come with the subscription. Programmes are bought.</b>
          <p>
            That's the whole difference. Anyone on your studio subscription can join everything
            on this page, so there's nothing to price and nothing to publish — add it and it's
            on. If you want to sell something on its own, with a start and an end, make it a{" "}
            <Link to="/dashboard/programmes" data-tip="Open Programmes">programme</Link> instead.
          </p>
          <p>
            Host each one wherever you like — Zoom, Google Meet, YouTube — and paste the link.
            Members join through their own personal link that redirects there, and their
            attendance is marked the moment they use it.
          </p>
        </div>
      </div>

      <div className="filters">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search lessons"
          label="Search lessons by title, days or time"
        />
      </div>

      {searching && regular.length + oneOffs.length === 0 ? (
        <SearchEmpty query={search} noun="lessons or classes" onClear={() => setSearch("")} />
      ) : (
        <>
          <div className="sec-head">
            <h3>Repeats every week</h3>
            <span className="mut">Same time, same link — set it up once and leave it</span>
          </div>
          {list(
            regular,
            searching
              ? "No repeating lessons match your search."
              : "Nothing repeating yet. Set the time and the days once, and it keeps running — there's no schedule to keep topping up."
          )}

          <div className="sec-head">
            <h3>One-off classes</h3>
            <span className="mut">A single session on one date, then it's done</span>
          </div>
          {list(
            oneOffs,
            searching
              ? "No one-off classes match your search."
              : "No one-off classes coming up. Use one for a workshop or a guest session."
          )}
        </>
      )}

      <LessonFormModal
        key={editing?.id || `new-${adding}`}
        open={formOpen}
        editing={editing}
        kind={editing ? (repeats(editing) ? "everyday" : "once") : adding}
        onClose={() => {
          setFormOpen(false);
          setEditing(null);
        }}
        onSubmit={(form) => (editing ? updateEverydayLesson(editing.id, form) : addEverydayLesson(form))}
      />
    </section>
  );
}
