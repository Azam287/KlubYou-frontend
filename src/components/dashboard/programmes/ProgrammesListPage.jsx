import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { usePageHeader } from "../../../context/PageHeaderContext";
import { useAppData } from "../../../context/AppDataContext";
import Icon from "../../common/Icon";
import ProgrammeCard from "./ProgrammeCard";
import NewProgrammeModal from "./modals/NewProgrammeModal";

// One list, narrowed by type — not two destinations. The type is an attribute
// of a programme, so it filters the catalogue rather than splitting it; "All"
// stays the default so nothing is hidden on arrival.
const FILTERS = [
  { value: "all", label: "All" },
  { value: "live", label: "Live" },
  { value: "recorded", label: "Recorded" },
];

export default function ProgrammesListPage() {
  const { programmes, addProgramme } = useAppData();
  const [modalOpen, setModalOpen] = useState(false);
  const [filter, setFilter] = useState("all");
  const navigate = useNavigate();

  const counts = useMemo(
    () => ({
      all: programmes.length,
      live: programmes.filter((p) => p.type === "live").length,
      recorded: programmes.filter((p) => p.type === "recorded").length,
    }),
    [programmes]
  );

  const shown = useMemo(
    () => (filter === "all" ? programmes : programmes.filter((p) => p.type === filter)),
    [programmes, filter]
  );

    const headerActions = useMemo(
      () => (
        // One flex child: the topbar is space-between, so two loose buttons
        // would be pushed to opposite ends of it.
        <div className="hdr-actions">
        <button className="btn btn-coral" onClick={() => setModalOpen(true)}>
          <Icon name="plus" size={16} strokeWidth={2.2} /> New programme
        </button>
        </div>
      ),
      []
    );

    usePageHeader("Programmes", "Courses and video series people buy on their own.", headerActions);

  const handleCreate = (form) => {
    const id = addProgramme(form);
    setModalOpen(false);
    navigate(`/dashboard/programmes/${id}`);
  };

  return (
    <section className="panel">
      <div className="prog-head">
        {/* The line between a programme and an everyday lesson is commercial,
            not temporal — said plainly here and on the Videos page, because
            "how often does it run?" is the wrong question to sort them by. */}
        <p className="prog-intro">
          <b>A programme is something people buy.</b> It has its own price on top of your studio
          subscription — which subscribers get for free, like everything else. A <b>Live</b>{" "}
          programme is a course of classes between two dates; a <b>Recorded</b> one is videos to
          work through at their own pace. A class that just runs week after week with no separate
          price isn't a programme — that's an{" "}
          <Link to="/dashboard/classes">everyday lesson</Link>.
        </p>
      </div>

      <div className="filters">
        <div className="chips">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              className={`chip${filter === f.value ? " on" : ""}`}
              onClick={() => setFilter(f.value)}
            >
              {f.label} <span className="chip-n">{counts[f.value]}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="prog-grid">
        {shown.map((p) => (
          <ProgrammeCard key={p.id} programme={p} />
        ))}
        <button className="add-card prog-add" onClick={() => setModalOpen(true)}>
          <Icon name="plus" size={26} strokeWidth={2} />
          New programme
        </button>
      </div>

      <NewProgrammeModal open={modalOpen} onClose={() => setModalOpen(false)} onCreate={handleCreate} />
    </section>
  );
}
