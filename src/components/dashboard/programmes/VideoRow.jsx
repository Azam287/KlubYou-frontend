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
        <button
          className="movebtn"
          disabled={isFirst}
          title="Move up"
          onClick={() => onMove(video, -1)}
        >
          <Icon name="chevronUp" size={15} strokeWidth={2.2} />
        </button>
        <button
          className="movebtn"
          disabled={isLast}
          title="Move down"
          onClick={() => onMove(video, 1)}
        >
          <Icon name="chevronDown" size={15} strokeWidth={2.2} />
        </button>
      </div>
      <KebabMenu
        size="sm"
        items={[
          { label: "Rename video", icon: "link", onClick: () => onRename(video) },
          { label: "Change video link", icon: "video", onClick: () => onEditVideo(video) },
          {
            label: video.active ? "Hide from members" : "Publish video",
            icon: "pause",
            onClick: () => onToggleActive(video),
          },
          null,
          { label: "Delete video", icon: "trash", danger: true, onClick: () => onDelete(video) },
        ]}
      />
    </div>
  );
}
