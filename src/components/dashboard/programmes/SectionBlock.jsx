import { useState } from "react";
import Icon from "../../common/Icon";
import KebabMenu from "../../common/KebabMenu";
import VideoRow from "./VideoRow";

const emptyDraft = { title: "", video: "", duration: "" };

export default function SectionBlock({
  section,
  isFirst,
  isLast,
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
  const videos = section.videos || [];
  // Adding a video happens on the row itself. Building a 20-video curriculum
  // used to mean 20 round-trips through a modal.
  const [draft, setDraft] = useState(null);

  const commit = () => {
    if (!draft?.title.trim()) return setDraft(null);
    onAddVideo(section, { ...draft, duration: draft.duration || null });
    setDraft({ ...emptyDraft });
  };

  return (
    <div className="secblock">
      <div className="sec-h">
        <span className="sec-n">Section {section.order}</span>
        <h4>{section.title}</h4>
        <span className="mut sec-count">
          {videos.length} video{videos.length === 1 ? "" : "s"}
        </span>
        <div className="lmove">
          <span className="tip-wrap" data-tip={isFirst ? "Already the first section" : "Move this section up"}>
            <button
              className="movebtn"
              disabled={isFirst}
              aria-label="Move section up"
              onClick={() => onMoveSection(section, -1)}
            >
              <Icon name="chevronUp" size={15} strokeWidth={2.2} />
            </button>
          </span>
          <span className="tip-wrap" data-tip={isLast ? "Already the last section" : "Move this section down"}>
            <button
              className="movebtn"
              disabled={isLast}
              aria-label="Move section down"
              onClick={() => onMoveSection(section, 1)}
            >
              <Icon name="chevronDown" size={15} strokeWidth={2.2} />
            </button>
          </span>
        </div>
        <KebabMenu
          size="sm"
          tip="Add a video, rename or delete this section"
          items={[
            {
              label: "Add video",
              icon: "plus",
              tip: "Add a video to the end of this section",
              onClick: () => setDraft({ ...emptyDraft }),
            },
            {
              label: "Rename section",
              icon: "link",
              tip: "Change the section's name",
              onClick: () => onRenameSection(section),
            },
            null,
            {
              label: "Delete section",
              icon: "trash",
              danger: true,
              tip: "Delete the section and the videos in it — asks first",
              onClick: () => onDeleteSection(section),
            },
          ]}
        />
      </div>

      {videos.length ? (
        <div className="clist">
          {videos.map((l, i) => (
            <VideoRow
              key={l.id}
              video={l}
              index={i + 1}
              isFirst={i === 0}
              isLast={i === videos.length - 1}
              onMove={(video, dir) => onMoveVideo(section, video, dir)}
              onToggleActive={(video) => onToggleVideo(section, video)}
              onEditVideo={(video) => onEditVideoLink(section, video)}
              onRename={(video) => onRenameVideo(section, video)}
              onDelete={(video) => onDeleteVideo(section, video)}
            />
          ))}
        </div>
      ) : (
        !draft && <p className="sec-empty">No videos in this section yet.</p>
      )}

      {draft ? (
        <div className="ivideo">
          <span className="lnum on">{videos.length + 1}</span>
          <input
            className="iv-f title"
            autoFocus
            placeholder="Video name"
            value={draft.title}
            onChange={(e) => setDraft({ ...draft, title: e.target.value })}
            onKeyDown={(e) => {
              if (e.key === "Enter") commit();
              if (e.key === "Escape") setDraft(null);
            }}
          />
          <input
            className="iv-f"
            placeholder="Paste video link"
            value={draft.video}
            onChange={(e) => setDraft({ ...draft, video: e.target.value })}
            onKeyDown={(e) => e.key === "Enter" && commit()}
          />
          <input
            className="iv-f dur"
            placeholder="0:00"
            value={draft.duration}
            onChange={(e) => setDraft({ ...draft, duration: e.target.value })}
            onKeyDown={(e) => e.key === "Enter" && commit()}
          />
          <button
            className="btn btn-coral btn-sm"
            onClick={commit}
            data-tip="Add this video to the section"
          >
            Add
          </button>
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => setDraft(null)}
            data-tip="Stop adding videos"
          >
            Done
          </button>
        </div>
      ) : (
        <button
          className="addrow"
          onClick={() => setDraft({ ...emptyDraft })}
          data-tip="Add another video to this section"
        >
          <Icon name="plus" size={15} strokeWidth={2.2} /> Add another video
        </button>
      )}
    </div>
  );
}
