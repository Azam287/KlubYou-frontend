import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { usePageHeader } from "../../../context/PageHeaderContext";
import { useAppData } from "../../../context/AppDataContext";
import Icon from "../../common/Icon";
import ProgrammeCard from "./ProgrammeCard";
import NewProgrammeModal from "./modals/NewProgrammeModal";

export default function ProgrammesListPage() {
  usePageHeader("Programmes", "Your content — sold as courses, memberships, or both.");
  const { programmes, addProgramme } = useAppData();
  const [modalOpen, setModalOpen] = useState(false);
  const navigate = useNavigate();

  const handleCreate = (form) => {
    const id = addProgramme(form);
    setModalOpen(false);
    navigate(`/dashboard/programmes/${id}`);
  };

  return (
    <section className="panel">
      <div className="prog-head">
        <p className="prog-intro">
          A programme is your content. Sell the same programme as a course, a membership, or both.
        </p>
        <button className="btn btn-coral" onClick={() => setModalOpen(true)}>
          <Icon name="plus" size={16} strokeWidth={2.2} /> New programme
        </button>
      </div>
      <div className="prog-grid">
        {programmes.map((p) => (
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
