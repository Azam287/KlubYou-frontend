import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { usePageHeader } from "../../../context/PageHeaderContext";
import { useAppData } from "../../../context/AppDataContext";
import { useToast } from "../../../context/ToastContext";
import Icon from "../../common/Icon";
import { QrPlaceholder } from "../../common/Brand";
import ClassRow from "./ClassRow";
import ClassFormModal from "../shared/ClassFormModal";
import VenueLinkModal from "../shared/VenueLinkModal";
import TimingModal from "./modals/TimingModal";
import DeleteClassModal from "./modals/DeleteClassModal";
import AddPlanModal from "./modals/AddPlanModal";

const TYPE_LABEL = { course: "Course", membership: "Membership" };

export default function ProgrammeDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { programmes, addClass, addPlan, updateClassLink, updateClassTiming, toggleClassActive, deleteClass } =
    useAppData();
  const { showToast } = useToast();
  const programme = programmes.find((p) => p.id === id);

  usePageHeader("Programmes", "Your content — sold as courses, memberships, or both.");

  // which modal is open, and for which section/class
  const [addClassSection, setAddClassSection] = useState(null); // 'course' | 'membership' | null
  const [addPlanOpen, setAddPlanOpen] = useState(false);
  const [linkTarget, setLinkTarget] = useState(null); // { section, classItem }
  const [timingTarget, setTimingTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  if (!programme) {
    return (
      <section className="panel">
        <button className="backlink" onClick={() => navigate("/dashboard/programmes")}>
          <Icon name="back" size={16} strokeWidth={2} /> All programmes
        </button>
        <p>That programme couldn't be found.</p>
      </section>
    );
  }

  const copyShareLink = () => {
    const url = `https://${programme.course?.shareUrl}`;
    if (navigator.clipboard?.writeText) navigator.clipboard.writeText(url).catch(() => {});
    showToast("Link copied");
  };

  return (
    <section className="panel">
      <button className="backlink" onClick={() => navigate("/dashboard/programmes")}>
        <Icon name="back" size={16} strokeWidth={2} /> All programmes
      </button>

      <div className="pd-head">
        <div className="pd-thumb" style={{ background: programme.thumbGradient }} />
        <div className="pd-headmeta">
          <div className="prog-badges">
            {programme.types.map((t) => (
              <span className={`badge ${t}`} key={t}>
                {TYPE_LABEL[t]}
              </span>
            ))}
          </div>
          <h2>{programme.name}</h2>
          <p>{programme.description}</p>
        </div>
        <button className="btn btn-ghost" style={{ alignSelf: "flex-start" }}>
          Edit details
        </button>
      </div>

      {programme.course && (
        <div className="cardbox pd-sec">
          <div className="box-h">
            <h3>Sold as a course</h3>
            <span className="pill sched">
              <i /> {programme.course.status}
            </span>
          </div>
          <div className="pd-fields">
            <div className="pdf">
              <span>Enrol from</span>
              <b>{programme.course.enrollFrom}</b>
            </div>
            <div className="pdf">
              <span>Enrol until</span>
              <b>{programme.course.enrollUntil}</b>
            </div>
            <div className="pdf">
              <span>Runs</span>
              <b>{programme.course.runs}</b>
            </div>
            <div className="pdf">
              <span>Price</span>
              <b>{programme.course.price}</b>
            </div>
            <div className="pdf">
              <span>Certificate at end</span>
              <b>{programme.course.certificate ? "On" : "Off"}</b>
            </div>
          </div>

          <div className="pd-sub">Classes in this course</div>
          <div className="clist">
            {programme.course.classes.map((c) => (
              <ClassRow
                key={c.id}
                classItem={c}
                onEditLink={(cls) => setLinkTarget({ section: "course", classItem: cls })}
                onChangeTiming={(cls) => setTimingTarget({ section: "course", classItem: cls })}
                onToggleActive={(cls) => toggleClassActive(programme.id, "course", cls.id)}
                onDelete={(cls) => setDeleteTarget({ section: "course", classItem: cls })}
              />
            ))}
          </div>
          <button className="btn btn-ghost" style={{ marginTop: 12 }} onClick={() => setAddClassSection("course")}>
            <Icon name="plus" size={15} strokeWidth={2.2} /> Add class
          </button>

          <div className="share">
            <div className="share-l">
              <div className="share-lbl">Share this course</div>
              <div className="share-link">
                <span>{programme.course.shareUrl}</span>
                <button className="copy" onClick={copyShareLink} title="Copy link">
                  <Icon name="copy" size={15} strokeWidth={1.7} />
                </button>
              </div>
            </div>
            <div className="qr">
              <QrPlaceholder />
            </div>
          </div>
        </div>
      )}

      {programme.membership && (
        <div className="cardbox pd-sec">
          <div className="box-h">
            <h3>Sold as a membership</h3>
            <span className="mut">{programme.membersCount} active members</span>
          </div>
          <div className="rows" style={{ maxWidth: 420 }}>
            {programme.membership.plans.map((p) => (
              <div className="prow" key={p.id}>
                <span>{p.length}</span>
                <b>{p.price}</b>
              </div>
            ))}
          </div>
          <button className="btn btn-ghost" style={{ marginTop: 14 }} onClick={() => setAddPlanOpen(true)}>
            <Icon name="plus" size={15} strokeWidth={2.2} /> Add plan
          </button>

          <div className="pd-sub" style={{ marginTop: 22 }}>
            Classes for members
          </div>
          <div className="clist">
            {programme.membership.classes.map((c) => (
              <ClassRow
                key={c.id}
                classItem={c}
                onEditLink={(cls) => setLinkTarget({ section: "membership", classItem: cls })}
                onChangeTiming={(cls) => setTimingTarget({ section: "membership", classItem: cls })}
                onToggleActive={(cls) => toggleClassActive(programme.id, "membership", cls.id)}
                onDelete={(cls) => setDeleteTarget({ section: "membership", classItem: cls })}
              />
            ))}
          </div>
          <button className="btn btn-ghost" style={{ marginTop: 12 }} onClick={() => setAddClassSection("membership")}>
            <Icon name="plus" size={15} strokeWidth={2.2} /> Add class
          </button>
        </div>
      )}

      <ClassFormModal
        open={!!addClassSection}
        onClose={() => setAddClassSection(null)}
        onSubmit={(form) => {
          addClass(programme.id, addClassSection, {
            title: form.title,
            when: [form.date, form.time].filter(Boolean).join(" · ") || "TBC",
            venue: { platform: form.venueUrl ? "zoom" : "none", url: form.venueUrl },
          });
          setAddClassSection(null);
        }}
      />

      <AddPlanModal
        open={addPlanOpen}
        onClose={() => setAddPlanOpen(false)}
        onSave={(plan) => addPlan(programme.id, plan)}
      />

      <VenueLinkModal
        open={!!linkTarget}
        onClose={() => setLinkTarget(null)}
        initialUrl={linkTarget?.classItem.venue?.url || ""}
        onSave={(url) => updateClassLink(programme.id, linkTarget.section, linkTarget.classItem.id, url)}
      />

      <TimingModal
        open={!!timingTarget}
        onClose={() => setTimingTarget(null)}
        onSave={({ when, scope, notify }) =>
          updateClassTiming(programme.id, timingTarget.section, timingTarget.classItem.id, { when, scope, notify })
        }
      />

      <DeleteClassModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={(scope) => deleteClass(programme.id, deleteTarget.section, deleteTarget.classItem.id, scope)}
      />
    </section>
  );
}
