import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { usePageHeader } from "../../../context/PageHeaderContext";
import { useAppData } from "../../../context/AppDataContext";
import { useToast } from "../../../context/ToastContext";
import Icon from "../../common/Icon";
import KebabMenu from "../../common/KebabMenu";
import ConfirmModal from "../../common/ConfirmModal";
import { QrPlaceholder } from "../../common/Brand";
import LiveProgrammeView from "./LiveProgrammeView";
import RecordedProgrammeView from "./RecordedProgrammeView";
import PricingPanel from "./PricingPanel";
import ReadinessChecklist from "./ReadinessChecklist";
import ProgrammeStats from "./ProgrammeStats";
import IntroVideoCard from "./IntroVideoCard";
import ClassFormModal from "../shared/ClassFormModal";
import VenueLinkModal from "../shared/VenueLinkModal";
import TimingModal from "./modals/TimingModal";
import DeleteClassModal from "./modals/DeleteClassModal";
import AddOfferModal from "./modals/AddOfferModal";
import SectionFormModal from "./modals/SectionFormModal";
import EditDetailsModal from "./modals/EditDetailsModal";
import MemberPreviewModal from "./modals/MemberPreviewModal";
import RenameVideoModal from "./modals/RenameVideoModal";
import {
  PROGRAMME_STATUS,
  PROGRAMME_TYPES,
  isLive,
  isPublished,
  isRecorded,
  orderedSections,
  runWindow,
  seriesOf,
  sortedClasses,
} from "../../../lib/programme";
import { memberStats, programmeBuyers } from "../../../lib/stats";

export default function ProgrammeDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const {
    programmes,
    members,
    payments,
    studioPlans,
    coverSwatches,
    addClasses,
    addOffer,
    removeOffer,
    setStudioOnly,
    updateProgramme,
    updateRunWindow,
    deleteProgramme,
    publishProgramme,
    unpublishProgramme,
    updateClassLink,
    updateClassTiming,
    toggleClassActive,
    deleteClass,
    addSection,
    updateSection,
    deleteSection,
    moveSection,
    addVideo,
    updateVideo,
    toggleVideoActive,
    deleteVideo,
    moveVideo,
  } = useAppData();
  const { showToast } = useToast();
  const programme = programmes.find((p) => p.id === id);

  usePageHeader("Programmes", "Courses and video series people buy on their own.");

  const [addClassOpen, setAddClassOpen] = useState(false);
  const [offerOpen, setOfferOpen] = useState(false);
  const [linkTarget, setLinkTarget] = useState(null);
  const [timingTarget, setTimingTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [sectionOpen, setSectionOpen] = useState(false);
  const [videoTarget, setVideoTarget] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [sectionEditing, setSectionEditing] = useState(null);
  const [sectionDelete, setSectionDelete] = useState(null);
  const [renameTarget, setRenameTarget] = useState(null);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const studioSubscribers = useMemo(() => memberStats(members).studio, [members]);

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

  const meta = PROGRAMME_TYPES[programme.type] || PROGRAMME_TYPES.live;
  const status = PROGRAMME_STATUS[programme.status] || PROGRAMME_STATUS.draft;
  const published = isPublished(programme);

  const copyToClipboard = (value, message) => {
    if (navigator.clipboard?.writeText) navigator.clipboard.writeText(value).catch(() => {});
    showToast(message);
  };

  // The checklist's fix button jumps straight to the first item missing its
  // link — a class for a live programme, a video's video for a recorded one.
  const fixFirstMissingLink = () => {
    if (isRecorded(programme)) {
      for (const section of orderedSections(programme)) {
        const video = section.videos.find((l) => l.active && !l.video);
        if (video) {
          setVideoTarget({ section, video });
          return;
        }
      }
      return;
    }
    const target = sortedClasses(programme).find((c) => c.active && !c.venue?.url);
    if (target) setLinkTarget(target);
  };

  const seriesCountFor = (cls) => (cls?.seriesId ? seriesOf(programme, cls.seriesId).length : 0);

  return (
    <section className="panel">
      <button className="backlink" onClick={() => navigate("/dashboard/programmes")}>
        <Icon name="back" size={16} strokeWidth={2} /> All programmes
      </button>

      <div className="pd-head">
        <div className="pd-thumb" style={{ background: programme.thumbGradient }} />
        <div className="pd-headmeta">
          <div className="prog-badges">
            <span className={`badge ${programme.type}`}>
              <Icon name={meta.icon} size={13} strokeWidth={2} />
              {meta.label}
            </span>
            <span className={`pill ${status.pill}`}>
              <i /> {status.label}
            </span>
          </div>
          <h2>{programme.name}</h2>
          <p>{programme.description}</p>
        </div>
        <div className="pd-actions">
          <button className="btn btn-ghost" onClick={() => setPreviewOpen(true)}>
            Preview as member
          </button>
          <button className="btn btn-ghost" onClick={() => setDetailsOpen(true)}>
            Edit details
          </button>
          {published && (
            <button className="btn btn-ghost" onClick={() => unpublishProgramme(programme.id)}>
              Unpublish
            </button>
          )}
          {/* A programme could be made but never unmade — the only thing in the
              app with no way out. */}
          <KebabMenu
            items={[
              {
                label: "Delete programme",
                icon: "trash",
                danger: true,
                onClick: () => setDeleteOpen(true),
              },
            ]}
          />
        </div>
      </div>

      {published ? (
        <ProgrammeStats
          programme={programme}
          members={members}
          payments={payments}
          studioSubscribers={studioSubscribers}
        />
      ) : (
        <ReadinessChecklist
          programme={programme}
          onPublish={() => publishProgramme(programme.id)}
          onFixLinks={fixFirstMissingLink}
        />
      )}

      <IntroVideoCard
        programme={programme}
        onEdit={() => setDetailsOpen(true)}
        onCopyLink={(url) => copyToClipboard(url, "Intro link copied")}
      />

      {isLive(programme) && (
        <LiveProgrammeView
          programme={programme}
          onAddClass={() => setAddClassOpen(true)}
          onEditLink={(cls) => setLinkTarget(cls)}
          onChangeTiming={(cls) => setTimingTarget(cls)}
          onToggleActive={(cls) => toggleClassActive(programme.id, cls.id)}
          onDeleteClass={(cls) => setDeleteTarget(cls)}
          onCopyLink={(url) => copyToClipboard(url, "Class link copied")}
          onSetDates={() => setDetailsOpen(true)}
        />
      )}

      {isRecorded(programme) && (
        <RecordedProgrammeView
          programme={programme}
          onAddSection={() => setSectionOpen(true)}
          onMoveSection={(section, dir) => moveSection(programme.id, section.id, dir)}
          onRenameSection={(section) => setSectionEditing(section)}
          onDeleteSection={(section) => setSectionDelete(section)}
          onAddVideo={(section, video) => addVideo(programme.id, section.id, video)}
          onMoveVideo={(section, video, dir) => moveVideo(programme.id, section.id, video.id, dir)}
          onToggleVideo={(section, video) => toggleVideoActive(programme.id, section.id, video.id)}
          onEditVideoLink={(section, video) => setVideoTarget({ section, video })}
          onRenameVideo={(section, video) => setRenameTarget({ section, video })}
          onDeleteVideo={(section, video) => deleteVideo(programme.id, section.id, video.id)}
        />
      )}

      <PricingPanel
        programme={programme}
        studioPlans={studioPlans}
        buyers={programmeBuyers(members, programme.id)}
        onAddOffer={() => setOfferOpen(true)}
        onRemoveOffer={(offerId) => removeOffer(programme.id, offerId)}
        onStudioOnly={(value) => setStudioOnly(programme.id, value)}
      />

      <div className="cardbox pd-sec">
        <div className="share">
          <div className="share-l">
            <div className="share-lbl">
              {published ? "Share this programme" : "Shareable once published"}
            </div>
            <div className={`share-link${published ? "" : " off"}`}>
              <span>{programme.pricing?.shareUrl}</span>
              <button
                className="copy"
                title="Copy link"
                disabled={!published}
                onClick={() => copyToClipboard(`https://${programme.pricing?.shareUrl}`, "Link copied")}
              >
                <Icon name="copy" size={15} strokeWidth={1.7} />
              </button>
            </div>
          </div>
          <div className="qr">
            <QrPlaceholder />
          </div>
        </div>
      </div>

      {/* ---------- live modals ---------- */}
      <ClassFormModal
        window={runWindow(programme)}
        open={addClassOpen}
        onClose={() => setAddClassOpen(false)}
        onSubmit={(form) => {
          const url = form.shareLink === false ? "" : form.venueUrl;
          addClasses(programme.id, {
            title: form.title,
            dates: form.dates,
            venue: { platform: url ? "zoom" : "none", url },
          });
          setAddClassOpen(false);
        }}
      />

      <VenueLinkModal
        open={!!linkTarget}
        onClose={() => setLinkTarget(null)}
        initialUrl={linkTarget?.venue?.url || ""}
        onSave={(url) => updateClassLink(programme.id, linkTarget.id, url)}
      />

      <TimingModal
        open={!!timingTarget}
        onClose={() => setTimingTarget(null)}
        initialStartsAt={timingTarget?.startsAt}
        seriesCount={seriesCountFor(timingTarget)}
        onSave={({ startsAt, scope, notify }) =>
          updateClassTiming(programme.id, timingTarget.id, { startsAt, scope, notify })
        }
      />

      <DeleteClassModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        seriesCount={seriesCountFor(deleteTarget)}
        onConfirm={(scope) => deleteClass(programme.id, deleteTarget.id, scope)}
      />

      {/* ---------- recorded modals ---------- */}
      <SectionFormModal
        key={sectionEditing?.id || "new-section"}
        open={sectionOpen || !!sectionEditing}
        editing={sectionEditing}
        onClose={() => {
          setSectionOpen(false);
          setSectionEditing(null);
        }}
        onSave={(title) =>
          sectionEditing
            ? updateSection(programme.id, sectionEditing.id, { title })
            : addSection(programme.id, title)
        }
      />

      <RenameVideoModal
        key={renameTarget?.video?.id || "rename-video"}
        open={!!renameTarget}
        video={renameTarget?.video}
        onClose={() => setRenameTarget(null)}
        onSave={(title) =>
          updateVideo(programme.id, renameTarget.section.id, renameTarget.video.id, { title })
        }
      />

      <ConfirmModal
        open={!!sectionDelete}
        title="Delete section"
        message={`Delete "${sectionDelete?.title}" and everything in it?`}
        detail={`${sectionDelete?.videos?.length || 0} video${
          sectionDelete?.videos?.length === 1 ? "" : "s"
        } will go with it. This can't be undone.`}
        confirmLabel="Delete section"
        onConfirm={() => deleteSection(programme.id, sectionDelete.id)}
        onClose={() => setSectionDelete(null)}
      />

      <ConfirmModal
        open={deleteOpen}
        title="Delete programme"
        message={`Delete "${programme.name}"?`}
        detail={
          programmeBuyers(members, programme.id) > 0
            ? `${programmeBuyers(members, programme.id)} ${
                programmeBuyers(members, programme.id) === 1 ? "person has" : "people have"
              } bought this — they'll lose access. Their payments stay on record. This can't be undone.`
            : "Nobody has bought this yet. This can't be undone."
        }
        confirmLabel="Delete programme"
        onConfirm={() => {
          deleteProgramme(programme.id);
          navigate("/dashboard/programmes");
        }}
        onClose={() => setDeleteOpen(false)}
      />

      <VenueLinkModal
        open={!!videoTarget}
        onClose={() => setVideoTarget(null)}
        title="Edit video link"
        label="Where is this video hosted?"
        hint="Members watch this video inside your programme page."
        initialUrl={videoTarget?.video?.video || ""}
        onSave={(url) =>
          updateVideo(programme.id, videoTarget.section.id, videoTarget.video.id, { video: url })
        }
      />

      {/* ---------- shared ---------- */}
      <AddOfferModal
        open={offerOpen}
        onClose={() => setOfferOpen(false)}
        onSave={(offer) => addOffer(programme.id, offer)}
      />

      <EditDetailsModal
        key={programme.id}
        open={detailsOpen}
        programme={programme}
        swatches={coverSwatches}
        onClose={() => setDetailsOpen(false)}
        onSave={({ startsOn, weeks, certificate, ...patch }) => {
          // `certificate` lives under pricing, so it can't ride along in the
          // same flat patch as the name and cover.
          updateProgramme(programme.id, {
            ...patch,
            pricing: { ...programme.pricing, certificate: !!certificate },
          });
          // The window lives under `schedule`, so it can't ride along in the
          // same flat patch as the name and cover.
          if (isLive(programme)) updateRunWindow(programme.id, { startsOn, weeks });
          showToast("Details updated");
        }}
      />

      <MemberPreviewModal
        open={previewOpen}
        programme={programme}
        studioPlans={studioPlans}
        onClose={() => setPreviewOpen(false)}
      />
    </section>
  );
}
