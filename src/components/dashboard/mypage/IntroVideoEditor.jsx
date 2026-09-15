import { looksLikeUrl, videoEmbedOf } from "../../../lib/page";

// The intro video link, as a tile body. YouTube and Vimeo links play on the
// page; the hint says which of the three a pasted link turned out to be.
export default function IntroVideoEditor({ value, onChange }) {
  const video = (value || "").trim();
  const bad = video && !looksLikeUrl(video);
  const embed = !bad && videoEmbedOf(video);

  return (
    <div className="ctrl">
      <label className="lbl" htmlFor="pg-video">Video link</label>
      <input
        id="pg-video"
        className="field"
        placeholder="Paste a YouTube or Vimeo link"
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
      />
      <p className={`hint${bad || (video && !embed) ? " warn" : ""}`}>
        {!video
          ? "Optional. A short hello people can watch before they join."
          : bad
            ? "That doesn't look like a link yet — it won't show on your page."
            : embed
              ? `Plays on your page from ${embed.provider}.`
              : "Only YouTube and Vimeo videos play on the page — this link shows as a card that opens it."}
      </p>
    </div>
  );
}
