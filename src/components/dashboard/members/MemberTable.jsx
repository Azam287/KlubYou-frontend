import MemberRow from "./MemberRow";

export default function MemberTable({ members }) {
  return (
    <div className="cardbox" style={{ padding: "16px 8px" }}>
      <div className="tbl-wrap">
        <table className="tbl">
          <thead>
            <tr>
              <th style={{ paddingLeft: 12 }}>Member</th>
              <th>Access</th>
              <th>Status</th>
              <th>Joined</th>
              <th>Renews / ends</th>
              <th>Attendance</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {members.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: "center", color: "var(--ink-soft)", padding: "24px 0" }}>
                  No members match these filters.
                </td>
              </tr>
            ) : (
              members.map((m) => <MemberRow key={m.id} member={m} />)
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
