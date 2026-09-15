import Icon from "../../common/Icon";
import SectionBlock from "./SectionBlock";
import { videoCount, orderedSections } from "../../../lib/programme";
import { totalRuntime } from "../../../lib/stats";

// A recorded programme: ordered sections of videos members work through at
// their own pace, the way a course platform lays a syllabus out.
export default function RecordedProgrammeView({
  programme,
  onAddSection,
  onMoveSection,
  onRenameSection,
  onDeleteSection,
  onAddVideo,
  onMoveVideo,
  onToggleVideo,
  onRenameVideo,
  onEditVideoLink,
  onDeleteVideo,
}) {
  const sections = orderedSections(programme);
  const total = videoCount(programme);
  const runtime = totalRuntime(programme);

  return (
    <div className="cardbox pd-sec">
      <div className="box-h">
        <h3>Curriculum</h3>
        <span className="mut">
          {sections.length} section{sections.length === 1 ? "" : "s"} · {total} video
          {total === 1 ? "" : "s"}
          {runtime ? ` · ${runtime}` : ""}
        </span>
      </div>

      {sections.length ? (
        <div className="seclist">
          {sections.map((s, i) => (
            <SectionBlock
              key={s.id}
              section={s}
              isFirst={i === 0}
              isLast={i === sections.length - 1}
              onMoveSection={onMoveSection}
              onRenameSection={onRenameSection}
              onDeleteSection={onDeleteSection}
              onAddVideo={onAddVideo}
              onMoveVideo={onMoveVideo}
              onToggleVideo={onToggleVideo}
              onRenameVideo={onRenameVideo}
              onEditVideoLink={onEditVideoLink}
              onDeleteVideo={onDeleteVideo}
            />
          ))}
        </div>
      ) : (
        <p className="sec-empty">Nothing here yet. Add a section to start building the curriculum.</p>
      )}

      <button
        className="btn btn-ghost"
        style={{ marginTop: 14 }}
        onClick={onAddSection}
        data-tip="Add a group of videos members work through in order"
      >
        <Icon name="plus" size={15} strokeWidth={2.2} /> Add section
      </button>
    </div>
  );
}
