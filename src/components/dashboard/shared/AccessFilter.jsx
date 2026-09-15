import { planLabel, planName } from "../../../lib/membership";

// "What was bought" as a filter: any plan or one plan, any programme or one
// programme. Shared by the members and payments pages so the two lists of
// choices can't drift apart. Values are read by lib/members.js (matchesAccess)
// and lib/payments.js (matchesPaidFor).
export default function AccessFilter({
  id,
  label,
  value,
  onChange,
  plans = [],
  programmes = [],
  allLabel = "Everything",
  includeNone = false,
}) {
  return (
    <>
      <label className="sr-only" htmlFor={id}>
        {label}
      </label>
      <select id={id} className="field selectw" value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="all">{allLabel}</option>
        <optgroup label="Membership">
          <option value="plans">Any membership plan</option>
          {plans.map((p) => (
            <option key={p.id} value={`plan:${p.id}`}>
              {planName(p)} · {planLabel(p)}
            </option>
          ))}
        </optgroup>
        <optgroup label="Programmes">
          <option value="programmes">Any programme</option>
          {programmes.map((p) => (
            <option key={p.id} value={`programme:${p.id}`}>
              {p.name}
            </option>
          ))}
        </optgroup>
        {includeNone && <option value="none">Not bought yet</option>}
      </select>
    </>
  );
}
