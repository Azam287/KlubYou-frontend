import Icon from "../../common/Icon";

const ICON_STYLE = {
  money: { bg: "rgba(46,125,80,.12)", color: "#2E7D50", icon: "money" },
  user: { bg: "rgba(241,91,65,.12)", color: "#D8452D", icon: "personKey" },
  clock: { bg: "rgba(227,154,44,.16)", color: "#a5711a", icon: "clock" },
  voucher: { bg: "rgba(34,26,56,.07)", color: "#221A38", icon: "voucher" },
};

// Lately, from real rows: payments in and not through, sign-ups, vouchers.
// Worked out in lib/overview.js → recentActivity, with real relative times.
export default function ActivityFeed({ items }) {
  return (
    <div className="cardbox">
      <div className="box-h">
        <h3>Recent activity</h3>
      </div>
      {items.length ? (
        <div className="activity">
          {items.map((item) => {
            const style = ICON_STYLE[item.icon] || ICON_STYLE.money;
            return (
              <div className="act" key={item.id}>
                <span className="ai" style={{ background: style.bg, color: style.color }}>
                  <Icon name={style.icon} size={17} strokeWidth={1.9} />
                </span>
                <div className="txt">
                  <b>{item.who}</b>
                  {item.text}
                </div>
                <span className="when">{item.when}</span>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="hint">Nothing yet — payments and sign-ups will show here.</p>
      )}
    </div>
  );
}
