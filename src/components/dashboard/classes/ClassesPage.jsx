import { useMemo, useState } from "react";
import { usePageHeader } from "../../../context/PageHeaderContext";
import { useAppData } from "../../../context/AppDataContext";
import Icon from "../../common/Icon";
import LiveClassCard from "./LiveClassCard";
import ClassFormModal from "../shared/ClassFormModal";
import VenueLinkModal from "../shared/VenueLinkModal";

export default function ClassesPage() {
  const { liveClasses, addLiveClass, addLinkToClass } = useAppData();
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [linkTarget, setLinkTarget] = useState(null);

  // Memoized so it's a stable element reference across renders — usePageHeader
  // stores this in context, and a fresh element every render would re-trigger
  // its effect (via the `action` dependency) on every single render.
  const scheduleAction = useMemo(
    () => (
      <button className="btn btn-coral" onClick={() => setScheduleOpen(true)}>
        <Icon name="plus" size={16} strokeWidth={2.2} /> Schedule class
      </button>
    ),
    []
  );

  usePageHeader("Classes", "Schedule and host your classes on YouTube.", scheduleAction);

  return (
    <section className="panel">
      <div className="banner">
        <span className="bi">
          <Icon name="info" size={20} />
        </span>
        <div>
          <b>How classes work</b>
          <p>
            You host each class wherever you like — Zoom, Google Meet, YouTube, anywhere — and
            paste the link. Every member joins through their own personal link that redirects
            there, and their attendance is marked the moment they use it. The link goes out in
            their reminder and expires when class ends.
          </p>
        </div>
      </div>

      {liveClasses.map((item) => (
        <LiveClassCard
          key={item.id}
          item={item}
          onEdit={(cls) => setLinkTarget(cls)}
          onAddLink={(cls) => setLinkTarget(cls)}
        />
      ))}

      <ClassFormModal
        open={scheduleOpen}
        onClose={() => setScheduleOpen(false)}
        onSubmit={(form) => {
          addLiveClass({
            title: form.title,
            meta: [form.date, form.time].filter(Boolean).join(" · ") || "Scheduled",
          });
          setScheduleOpen(false);
        }}
      />

      <VenueLinkModal
        open={!!linkTarget}
        onClose={() => setLinkTarget(null)}
        initialUrl={linkTarget?.venueUrl || ""}
        title={linkTarget?.mode === "draft" ? "Add class link" : "Edit class link"}
        onSave={(url) => linkTarget && addLinkToClass(linkTarget.id, url)}
      />
    </section>
  );
}
