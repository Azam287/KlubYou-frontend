import { formatWhen } from "../../../lib/datetime";
import { isLive, videoCount } from "../../../lib/programme";
import {
  averageAttendance,
  classesRemaining,
  money,
  nextClassLabel,
  programmeBuyers,
  programmeRevenue,
  programmeSales,
  totalRuntime,
} from "../../../lib/stats";

// Makes the detail page answer "is this working?", not just "what's in it".
// Every figure is derived from members and payments.
export default function ProgrammeStats({ programme, members, payments, studioSubscribers }) {
  const buyers = programmeBuyers(members, programme.id);
  const revenue = programmeRevenue(payments, programme.id);
  const sales = programmeSales(payments, programme.id);

  const tiles = [
    {
      label: "Bought directly",
      value: buyers,
      note: `plus ${studioSubscribers} studio subscriber${studioSubscribers === 1 ? "" : "s"}`,
    },
    {
      label: "Earned",
      value: money(revenue),
      note: sales ? `${sales} sale${sales === 1 ? "" : "s"} all time` : "No direct sales yet",
      good: sales > 0,
    },
  ];

  if (isLive(programme)) {
    const left = classesRemaining(programme);
    const next = nextClassLabel(programme);
    const avg = averageAttendance(programme);
    tiles.push({
      label: "Classes left",
      value: left,
      note: next ? formatWhen(next).split(" · ")[0] + " next" : "Series finished",
    });
    tiles.push({
      label: "Avg attendance",
      value: avg === null ? "—" : avg,
      note: avg === null ? "No class has run yet" : "per class held",
    });
  } else {
    tiles.push({ label: "Videos", value: videoCount(programme), note: `${programme.sections?.length || 0} sections` });
    tiles.push({ label: "Runtime", value: totalRuntime(programme) || "—", note: "total watch time" });
  }

  return (
    <div className="grid4 pstats">
      {tiles.map((t) => (
        <div className="cardbox pstat" key={t.label}>
          <div className="pstat-l">{t.label}</div>
          <div className="pstat-v num">{t.value}</div>
          <div className={`pstat-n${t.good ? " good" : ""}`}>{t.note}</div>
        </div>
      ))}
    </div>
  );
}
