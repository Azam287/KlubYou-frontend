import Icon from "../../common/Icon";

const ICON_STYLE = {
  money: { bg: "rgba(46,125,80,.12)", color: "#2E7D50" },
  user: { bg: "rgba(241,91,65,.12)", color: "#D8452D" },
  clock: { bg: "rgba(227,154,44,.16)", color: "#a5711a" },
  cert: { bg: "rgba(34,26,56,.07)", color: "#221A38" },
};

const ICON_NAME = { money: "money", user: "personKey", clock: "clock", cert: "certificate" };

export default function ActivityFeed({ items }) {
  return (
    <div className="cardbox" style={{ marginTop: 16 }}>
      <div className="box-h">
        <h3>Recent activity</h3>
        <span className="mut">Today</span>
      </div>
      <div className="activity">
        {items.map((item) => {
          const style = ICON_STYLE[item.icon];
          return (
            <div className="act" key={item.id}>
              <span className="ai" style={{ background: style.bg, color: style.color }}>
                <Icon name={ICON_NAME[item.icon]} size={17} strokeWidth={1.9} />
              </span>
              <div className="txt">
                <b>{item.text[0]}</b>
                {item.text[1]}
              </div>
              <span className="when">{item.when}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
