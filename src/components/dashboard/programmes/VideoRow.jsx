import Icon from "../../common/Icon";
import KebabMenu from "../../common/KebabMenu";

export default function VideoRow({
  video,
  index,
  isFirst,
  isLast,
  onMove,
  onToggleActive,
  onEditVideo,
  onRename,
  onDelete,
}) {
  const hasVideo = !!video.video;

  return (
    <div className={`lrow${!video.active ? " muted" : ""}`}>
      <span className="lnum">{index}</span>
      <span className="lico">
        <Icon name={hasVideo ? "classes" : "video"} size={17} strokeWidth={1.8} />
      </span>
      <div className="ci-name">
        <b>{video.title}</b>
        <small>
          {hasVideo ? video.video : "No video yet"}
          {video.duration ? ` · ${video.duration}` : ""}
        </small>
      </div>
      <div className="lmove">
        <span className="tip-wrap" data-tip={isFirst ? "Already the first video" : "Move this video up"}>
          <button
            className="movebtn"
            disabled={isFirst}
            aria-label="Move video up"
            onClick={() => onMove(video, -1)}
          >
            <Icon name="chevronUp" size={15} strokeWidth={2.2} />
          </button>
        </span>
        <span className="tip-wrap" data-tip={isLast ? "Already the last video" : "Move this video down"}>
          <button
            className="movebtn"
            disabled={isLast}
            aria-label="Move video down"
            onClick={() => onMove(video, 1)}
          >
            <Icon name="chevronDown" size={15} strokeWidth={2.2} />
          </button>
        </span>
      </div>
      <KebabMenu
        size="sm"
        tip="Rename, change, hide or delete this video"
        items={[
          { label: "Rename video", icon: "link", tip: "Change the video's title", onClick: () => onRename(video) },
          {
            label: "Change video link",
            icon: "video",
            tip: "Paste a new video link",
            onClick: () => onEditVideo(video),
          },
          {
            label: video.active ? "Hide from members" : "Publish video",
            icon: "pause",
            tip: video.active ? "Members stop seeing it — nothing is deleted" : "Show it to members again",
            onClick: () => onToggleActive(video),
          },
          null,
          {
            label: "Delete video",
            icon: "trash",
            danger: true,
            tip: "Delete the video from this section",
            onClick: () => onDelete(video),
          },
        ]}
      />
    </div>
  );
}
