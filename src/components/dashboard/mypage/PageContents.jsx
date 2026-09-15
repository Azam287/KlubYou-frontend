import { Link } from "react-router-dom";

// Memberships aren't chosen here: the page shows every published plan, the
// same comparison members see. This says how many and points to where they're
// edited. (Programmes are chosen one by one — see ProgrammePicker.)
export default function PageContents({ plans }) {
  return (
    <div className="pc-row">
      <div>
        <b>{plans.length ? `${plans.length} published` : "None published yet"}</b>
        <small>Every published plan is shown, with what each includes.</small>
      </div>
      <Link
        className="btn btn-ghost btn-sm"
        to="/dashboard/membership"
        data-tip="Add or change memberships on their own page"
      >
        Edit
      </Link>
    </div>
  );
}
