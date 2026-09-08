export default function ProfileEditor({ studio, onChange }) {
  return (
    <div className="eg">
      <h4>Profile</h4>
      <div className="ctrl">
        <label className="lbl">Studio name</label>
        <input className="field" value={studio.name} onChange={(e) => onChange({ name: e.target.value })} />
      </div>
      <div className="ctrl">
        <label className="lbl">Tagline</label>
        <input className="field" value={studio.tagline} onChange={(e) => onChange({ tagline: e.target.value })} />
      </div>
      <div className="ctrl">
        <label className="lbl">About you</label>
        <textarea className="field" value={studio.about} onChange={(e) => onChange({ about: e.target.value })} />
      </div>
    </div>
  );
}
