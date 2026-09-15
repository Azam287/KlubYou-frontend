// "About you", as a tile body.
export default function AboutEditor({ value, onChange }) {
  return (
    <div className="ctrl">
      <label className="lbl" htmlFor="pg-about">About you</label>
      <textarea
        id="pg-about"
        className="field"
        rows={5}
        placeholder="A few sentences in your own voice"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
