import { useMemo, useState } from "react";
import { usePageHeader } from "../../../context/PageHeaderContext";
import { useAppData } from "../../../context/AppDataContext";
import { useToast } from "../../../context/ToastContext";
import { Link } from "react-router-dom";
import Icon from "../../common/Icon";
import LessonCard from "./LessonCard";
import LessonFormModal from "./LessonFormModal";
import { byNextRun, repeats } from "../../../lib/everyday";

export default function ClassesPage() {
  const {
    everydayLessons,
    addEverydayLesson,
    updateEverydayLesson,
    toggleEverydayLesson,
    deleteEverydayLesson,
  } = useAppData();
  const { showToast } = useToast();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  // Which kind the form opens as. One record type still backs both — this
  // decides which half of the form is shown, so neither kind is asked a
  // question the button already answered.
  const [adding, setAdding] = useState("everyday");

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
        <button className="btn btn-ghost" onClick={() => openNew("once")}>
          <Icon name="plus" size={16} strokeWidth={2.2} /> One-off class
        </button>
        <button className="btn btn-coral" onClick={() => openNew("everyday")}>
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
  const [regular, oneOffs] = useMemo(() => {
    const sorted = [...everydayLessons].sort((a, b) => byNextRun(a, b));
    return [sorted.filter(repeats), sorted.filter((l) => !repeats(l))];
  }, [everydayLessons]);

  const openForm = (item) => {
    setEditing(item);
    setFormOpen(true);
  };

  const copyLink = (url) => {
    if (navigator.clipboard?.writeText) navigator.clipboard.writeText(url).catch(() => {});
    showToast("Link copied");
  };

  const list = (items, empty) =>
    items.length ? (
      items.map((item) => (
        <LessonCard
          key={item.id}
          item={item}
          onEdit={openForm}
          onToggle={toggleEverydayLesson}
          onDelete={deleteEverydayLesson}
          onCopyLink={copyLink}
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
            <Link to="/dashboard/programmes">programme</Link> instead.
          </p>
          <p>
            Host each one wherever you like — Zoom, Google Meet, YouTube — and paste the link.
            Members join through their own personal link that redirects there, and their
            attendance is marked the moment they use it.
          </p>
        </div>
      </div>

      <div className="sec-head">
        <h3>Repeats every week</h3>
        <span className="mut">Same time, same link — set it up once and leave it</span>
      </div>
      {list(
        regular,
        "Nothing repeating yet. Set the time and the days once, and it keeps running — there's no schedule to keep topping up."
      )}

      <div className="sec-head">
        <h3>One-off classes</h3>
        <span className="mut">A single session on one date, then it's done</span>
      </div>
      {list(oneOffs, "No one-off classes coming up. Use one for a workshop or a guest session.")}

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
