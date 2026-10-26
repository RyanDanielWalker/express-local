import { BADGES, type Badge } from "../engine/progression";
import type { SaveData } from "../engine/types";

export function BadgeCard({
  badge,
  earned,
}: {
  badge: Badge;
  earned: boolean;
}) {
  return (
    <div className={`badge2 ${earned ? "got" : ""}`}>
      <span className="dot" aria-hidden="true">
        {earned ? "✓" : ""}
      </span>
      <div>
        <b>{badge.name}</b>
        <small>{badge.how}</small>
      </div>
    </div>
  );
}

export function Badges({ save }: { save: SaveData }) {
  const count = BADGES.filter((b) => save.badges[b.id]).length;
  return (
    <section className="badges" aria-label="Badges">
      <div className="row" style={{ justifyContent: "space-between" }}>
        <h2>Badges</h2>
        <span className="xp">
          {count} / {BADGES.length}
        </span>
      </div>
      <div className="bgrid">
        {BADGES.map((b) => (
          <BadgeCard key={b.id} badge={b} earned={!!save.badges[b.id]} />
        ))}
      </div>
    </section>
  );
}
