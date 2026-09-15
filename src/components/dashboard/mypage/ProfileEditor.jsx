import ImageField from "./ImageField";

// The top of the page — always first, so always open. Everything under it is a
// tile that can be closed and moved.
export default function ProfileEditor({ studio, onChange }) {
  const nameMissing = !studio.name.trim();

  return (
    <div className="eg">
      <h4>Profile</h4>
      <ImageField
        label="Header image"
        image={studio.coverImage || ""}
        onChange={(coverImage) => onChange({ coverImage })}
        emptyText="No image yet — your colours fill this space"
        uploadTip="Choose a wide photo — landscape works best"
        removeTip="Take the image off and use your colours instead"
      />
      <ImageField
        label="Profile photo"
        round
        image={studio.avatarImage || ""}
        onChange={(avatarImage) => onChange({ avatarImage })}
        emptyText={(studio.name.trim().charAt(0) || "?").toUpperCase()}
        uploadTip="Choose a photo of you or your logo — square works best"
        removeTip="Take the photo off and show your initial instead"
      />
      <div className="ctrl">
        <label className="lbl" htmlFor="pg-name">Studio name</label>
        <input
          id="pg-name"
          className="field"
          placeholder="e.g. Maya's Yoga Studio"
          value={studio.name}
          aria-invalid={nameMissing}
          onChange={(e) => onChange({ name: e.target.value })}
        />
        {/* The one thing the page can't do without: it's the heading, the
            browser tab, and what people search for. */}
        {nameMissing && <p className="hint warn">Your page needs a name — visitors would see a blank heading.</p>}
      </div>
      <div className="ctrl">
        <label className="lbl" htmlFor="pg-tag">Tagline</label>
        <input
          id="pg-tag"
          className="field"
          placeholder="One line about what you teach"
          value={studio.tagline}
          onChange={(e) => onChange({ tagline: e.target.value })}
        />
      </div>
    </div>
  );
}
