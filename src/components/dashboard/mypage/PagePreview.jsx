import { Fragment } from "react";
import Icon from "../../common/Icon";
import { PROGRAMME_TYPES, contentSummary, hasIntro } from "../../../lib/programme";
import { planPrice } from "../../../lib/membership";
import MembershipComparison from "../membership/MembershipComparison";
import {
  buttonLinks,
  cheapestPlan,
  isEmailLink,
  videoEmbedOf,
  linkLabel,
  looksLikeUrl,
  onAccent,
  platformOf,
  programmeAction,
  programmePriceLabel,
  visibleSections,
  socialLinks,
  themeOf,
} from "../../../lib/page";

// The public page as a follower meets it — on a phone from a link in bio, or
// on a computer (`device="web"`). One page, two frames: the web view widens
// the column, lays memberships and programmes out in a grid, and moves the join
// button from the bottom of the screen to a bar across the top.
//
// It reads like the creator pages people already know — a cover and a ringed
// avatar, @handle, social icons, big tappable links, a store underneath and a
// join button that stays in reach. Below the header, sections come in the
// order the creator set, minus any they've hidden.
//
// Nothing here is clickable — it's a preview inside the dashboard — so the
// calls to action are drawn, not wired.
// `programmes` is what the page shows; `catalogue` is every published
// programme. The membership comparison reads the catalogue — hiding a
// programme from the page mustn't change what a membership says it includes.
export default function PagePreview({
  studio,
  plans,
  programmes,
  catalogue = programmes,
  bundles,
  lessons,
  features = [],
  device = "phone",
}) {
  const web = device === "web";
  const theme = themeOf(studio);
  const socials = socialLinks(studio.links);
  const buttons = buttonLinks(studio.links);
  const video = looksLikeUrl(studio.introVideo) ? studio.introVideo : "";
  // YouTube and Vimeo play right on the page; any other link gets a card.
  const embed = videoEmbedOf(video);
  const initial = (studio.name || "").trim().charAt(0).toUpperCase() || "?";
  const entry = cheapestPlan(plans);
  // Hidden sections are left out entirely — and with memberships hidden, the
  // join button goes too, since there'd be nothing on the page to join.
  const order = visibleSections(studio);
  const joinable = entry && order.includes("memberships");
  const avatar = studio.avatarImage ? { backgroundImage: `url(${studio.avatarImage})` } : undefined;
  // No upload shows a placeholder photo, so the header is never empty.
  const cover = { backgroundImage: `url(${studio.coverImage || "https://picsum.photos/400/150"})` };

  // The sections under the header, in the order the creator set. Each is
  // written as if it stood alone; empty ones render nothing.
  const sections = {
    about: studio.about.trim() && <p className="pg-about">{studio.about}</p>,
    video: embed ? (
      <div className="pg-video player">
        <iframe
          src={embed.src}
          title={`Intro video on ${embed.provider}`}
          loading="lazy"
          allow="accelerometer; encrypted-media; gyroscope; picture-in-picture; fullscreen"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
        />
      </div>
    ) : video && (
      <div className="pg-video" role="img" aria-label="Intro video">
        <span className="pg-play">
          <Icon name="play" size={20} strokeWidth={2.2} />
        </span>
        <span className="pg-video-lbl">
          <b>Watch my intro</b>
          <small>{platformOf(video)?.name || "Video"}</small>
        </span>
      </div>
    ),
    links: (socials.length > 0 || buttons.length > 0) && (
      <nav className="pg-links" aria-label="Links">
        {socials.length > 0 && (
          <div className="pg-socials">
            {socials.map((l) => {
              const p = platformOf(l.url);
              return (
                <span className="pg-social" key={l.id} role="img" aria-label={p.name}>
                  <Icon name={p.key} size={20} strokeWidth={1.9} />
                </span>
              );
            })}
          </div>
        )}
        {buttons.map((l) => {
          const p = platformOf(l.url);
          return (
            <span className="pg-link" key={l.id}>
              <span className="pg-link-ic">
                <Icon name={p ? p.key : isEmailLink(l.url) ? "mail" : "globe"} size={17} strokeWidth={1.9} />
              </span>
              <span className="pg-link-t">{linkLabel(l)}</span>
              <Icon name="arrowUpRight" size={15} strokeWidth={2} />
            </span>
          );
        })}
      </nav>
    ),
    memberships: plans.length > 0 && (
      <section className="pg-sec">
        <h3>Join the membership</h3>
        {/* The same cards and table members choose from in the membership
            preview, in this page's colours. */}
        <MembershipComparison
          plans={plans}
          bundles={bundles}
          programmes={catalogue}
          lessons={lessons}
          features={features}
          picture
        />
      </section>
    ),
    programmes: programmes.length > 0 && (
      <section className="pg-sec">
        <h3>Programmes</h3>
        {/* A row you swipe, like a creator's shop — one programme at a
            time, with the next peeking in so it's obvious there's more. */}
        <div className={`pg-rail${programmes.length === 1 ? " single" : ""}`}>
          {programmes.map((p) => {
            const type = PROGRAMME_TYPES[p.type] || PROGRAMME_TYPES.live;
            return (
              <div className="pg-product" key={p.id}>
                <div
                  className="pg-thumb"
                  style={p.thumbGradient ? { background: p.thumbGradient } : undefined}
                >
                  <span className="pg-badge">{type.label}</span>
                  {hasIntro(p) && (
                    <span className="pg-thumb-play" role="img" aria-label="Has an intro video">
                      <Icon name="play" size={14} strokeWidth={2.4} />
                    </span>
                  )}
                </div>
                <div className="pg-product-b">
                  <b>{p.name}</b>
                  <small>{contentSummary(p)}</small>
                  <div className="pg-product-f">
                    <strong>{programmePriceLabel(p)}</strong>
                    {programmeAction(p, { canJoin: joinable }) && (
                      <span className="pg-btn sm">{programmeAction(p, { canJoin: joinable })}</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    ),
  };

  const page = (
    <div
      className={`pg ${web ? "web" : "mobile"}`}
      style={{
        "--pg-bg": theme.background,
        "--pg-text": theme.text,
        "--pg-accent": theme.accent,
        "--pg-on-accent": onAccent(theme.accent),
      }}
    >
      {/* A phone's status bar. The page scrolls beneath it, the way it does on
          a real phone, instead of sliding up past the camera cut-out. */}
      {!web && (
        <div className="phone-status" aria-hidden="true">
          <span>9:41</span>
          <span className="phone-status-r">
            <svg width="17" height="11" viewBox="0 0 17 11">
              <rect x="0" y="7" width="3" height="4" rx="1" />
              <rect x="4.5" y="5" width="3" height="6" rx="1" />
              <rect x="9" y="2.5" width="3" height="8.5" rx="1" />
              <rect x="13.5" y="0" width="3" height="11" rx="1" />
            </svg>
            <svg width="25" height="12" viewBox="0 0 25 12">
              <rect x="0.5" y="0.5" width="21" height="11" rx="3" fill="none" stroke="currentColor" opacity="0.45" />
              <rect x="2" y="2" width="15" height="8" rx="1.8" />
              <rect x="22.5" y="4" width="1.8" height="4" rx="0.9" opacity="0.45" />
            </svg>
          </span>
        </div>
      )}

      {/* On a computer the join button lives in a bar across the top,
          where a site's main action is expected. */}
      {web && (
        <div className="pg-topbar">
          <span className="pg-topbar-id">
            <span className="pg-mini-av" aria-hidden="true" style={avatar}>
              {avatar ? "" : initial}
            </span>
            <b>{studio.name.trim() || "Your studio name"}</b>
          </span>
          <span className="pg-topbar-r">
            <span className="pg-round" aria-hidden="true">
              <Icon name="share" size={15} strokeWidth={2} />
            </span>
            {joinable && <span className="pg-btn sm">Join from {planPrice(entry)}</span>}
          </span>
        </div>
      )}

      <div className={`pg-cover${studio.coverImage ? " img" : ""}`} style={cover}>
        {!web && (
          <span className="pg-round" aria-hidden="true">
            <Icon name="share" size={15} strokeWidth={2} />
          </span>
        )}
      </div>

      <div className="pg-col">
        <header className="pg-head">
          <div className="pg-av" aria-hidden="true">
            <span className={avatar ? "img" : undefined} style={avatar}>
              {avatar ? "" : initial}
            </span>
          </div>
          {/* Empty fields show as placeholders, so a blank page still
              shows where everything goes. */}
          <h2 className={`pg-name${studio.name.trim() ? "" : " pg-ph"}`}>
            {studio.name.trim() || "Your studio name"}
          </h2>
          <p className="pg-handle">@{studio.handle}</p>
          <p className={`pg-tag${studio.tagline.trim() ? "" : " pg-ph"}`}>
            {studio.tagline.trim() || "Your tagline"}
          </p>
        </header>

        {order.map((key) => (
          <Fragment key={key}>{sections[key]}</Fragment>
        ))}

        <footer className="pg-foot">
          Made with <b>KlubYou</b>
        </footer>
      </div>

      {/* Pinned to the bottom of a phone screen, the way creator pages
          keep the one thing they want you to do within thumb's reach. */}
      {!web && joinable && (
        <div className="pg-sticky">
          <span className="pg-btn">Join from {planPrice(entry)}</span>
        </div>
      )}
    </div>
  );

  if (web) {
    return (
      <div className="browser">
        <div className="browser-bar">
          <div className="dots">
            <i />
            <i />
            <i />
          </div>
          <div className="browser-url">
            <Icon name="lock" size={12} strokeWidth={2} />
            klubyou.co/{studio.handle}
          </div>
        </div>
        <div className="browser-view">{page}</div>
      </div>
    );
  }

  return (
    <div className="phone-stage">
      <div className="phone">
        <div className="phone-screen">{page}</div>
      </div>
      <div className="phone-url">
        <Icon name="lock" size={12} strokeWidth={2} />
        klubyou.co/{studio.handle}
      </div>
    </div>
  );
}
