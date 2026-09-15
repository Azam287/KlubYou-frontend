// A small central icon set so every feature component can do
// <Icon name="members" /> instead of repeating raw <svg> markup.
// Keeps the outline style (1.7-2.2 stroke, rounded caps) used across the app.

const PATHS = {
  overview: (
    <>
      <path d="M3 12 12 4l9 8" />
      <path d="M5 10v10h14V10" />
    </>
  ),
  page: (
    <>
      <rect x="3" y="4" width="18" height="16" rx="2.5" />
      <path d="M3 9h18" />
    </>
  ),
  programmes: (
    <>
      <path d="M4 7 12 3l8 4-8 4-8-4Z" strokeLinejoin="round" />
      <path d="M4 12l8 4 8-4M4 17l8 4 8-4" strokeLinejoin="round" />
    </>
  ),
  members: (
    <>
      <circle cx="9" cy="8" r="3.2" />
      <path d="M3 19c.6-3.4 2.9-5 6-5s5.4 1.6 6 5" />
      <path d="M16 8h5M18.5 5.5v5" />
    </>
  ),
  payments: (
    <>
      <rect x="3" y="6" width="18" height="12" rx="2.5" />
      <path d="M3 10h18" />
    </>
  ),
  video: (
    <>
      <path d="M15 10l4.5-2.6v9.2L15 14" strokeLinejoin="round" />
      <rect x="3" y="6" width="12" height="12" rx="2.5" />
    </>
  ),
  classes: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="3" />
      <path d="M10 9.5v5l4.5-2.5L10 9.5Z" fill="currentColor" stroke="none" />
    </>
  ),
  person: (
    <>
      <circle cx="9" cy="8" r="3" />
      <path d="M3 19c.6-3.4 2.9-5 6-5s5.4 1.6 6 5" />
    </>
  ),
  personKey: (
    <>
      <circle cx="9" cy="8" r="3" />
      <path d="M3 19c.6-3.4 2.9-5 6-5s5.4 1.6 6 5" />
      <path d="M16 8h5M18.5 5.5v5" />
    </>
  ),
  money: <path d="M3 12h4l2 6 4-14 2 8h6" strokeLinejoin="round" />,
  trend: (
    <>
      <path d="M4 12a8 8 0 1 1 2.3 5.6" />
      <path d="M4 20v-4h4" strokeLinejoin="round" />
    </>
  ),
  course: (
    <>
      <rect x="4" y="4" width="16" height="16" rx="2" />
      <path d="M4 8h16" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 8v4l2.5 2" />
    </>
  ),
  certificate: (
    <>
      <circle cx="12" cy="9" r="5" />
      <path d="M9 13l-1 8 4-2 4 2-1-8" strokeLinejoin="round" />
    </>
  ),
  kebab: (
    <g fill="currentColor" stroke="none">
      <circle cx="5" cy="12" r="1.8" />
      <circle cx="12" cy="12" r="1.8" />
      <circle cx="19" cy="12" r="1.8" />
    </g>
  ),
  plus: <path d="M12 5v14M5 12h14" />,
  search: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3-3" />
    </>
  ),
  check: <path d="M20 6 9 17l-5-5" />,
  gift: (
    <>
      <rect x="3" y="9" width="18" height="11" rx="2" />
      <path d="M3 13h18M12 9v11" />
      <path d="M12 9c-1-3-6-3-5 0 3 .6 5 0 5 0Zm0 0c1-3 6-3 5 0-3 .6-5 0-5 0Z" strokeLinejoin="round" />
    </>
  ),
  mail: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m4 7 8 6 8-6" />
    </>
  ),
  voucher: (
    <>
      <path d="M4 6h16v3.5a2 2 0 0 0 0 5V18H4v-3.5a2 2 0 0 0 0-5V6Z" strokeLinejoin="round" />
      <path d="M14 6v12" strokeDasharray="2 3" />
    </>
  ),
  receipt: (
    <>
      <path d="M6 3h12v18l-3-2-3 2-3-2-3 2V3Z" strokeLinejoin="round" />
      <path d="M9 8h6M9 12h6" />
    </>
  ),
  stop: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M8.5 8.5l7 7" />
    </>
  ),
  link: (
    <>
      <path d="M10 13a4 4 0 0 0 6 .5l2-2a4 4 0 1 0-6-6l-1 1" />
      <path d="M14 11a4 4 0 0 0-6-.5l-2 2a4 4 0 1 0 6 6l1-1" />
    </>
  ),
  pause: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M10 9v6M14 9v6" />
    </>
  ),
  trash: <path d="M5 7h14M10 7V5h4v2M6 7l1 12h10l1-12" strokeLinejoin="round" />,
  info: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5M12 7.5v.5" />
    </>
  ),
  back: <path d="M15 5l-7 7 7 7" strokeLinejoin="round" />,
  heart: <path d="M12 21s-7-4.5-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 11c0 5.5-7 10-7 10Z" strokeLinejoin="round" />,
  lock: (
    <>
      <rect x="5" y="11" width="14" height="9" rx="2" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
    </>
  ),
  upload: (
    <>
      <rect x="3" y="6" width="18" height="14" rx="2.5" />
      <circle cx="9" cy="12" r="2.2" />
      <path d="m5 20 6-5 4 3 2-2 3 3" strokeLinejoin="round" />
    </>
  ),
  copy: (
    <>
      <rect x="9" y="9" width="11" height="11" rx="2" />
      <path d="M5 15V5a2 2 0 0 1 2-2h8" />
    </>
  ),
  chevronUp: <path d="m6 14 6-6 6 6" strokeLinejoin="round" />,
  chevronDown: <path d="m6 10 6 6 6-6" strokeLinejoin="round" />,
  list: (
    <>
      <path d="M9 6h11M9 12h11M9 18h11" />
      <path d="M4.5 6h.01M4.5 12h.01M4.5 18h.01" />
    </>
  ),
  pencil: (
    <>
      <path d="M4 20h4.5L20 8.5a2.5 2.5 0 0 0-3.5-3.5L5 16.5V20Z" strokeLinejoin="round" />
      <path d="M14.5 6.5 18 10" />
    </>
  ),
  table: (
    <>
      <rect x="3" y="4" width="18" height="16" rx="2.5" />
      <path d="M3 9.5h18M9.5 9.5V20M3 15h18" />
    </>
  ),
  eye: (
    <>
      <path d="M2 12s3.6-6.5 10-6.5S22 12 22 12s-3.6 6.5-10 6.5S2 12 2 12Z" strokeLinejoin="round" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
  eyeOff: (
    <>
      <path d="M4 4l16 16" />
      <path d="M9.9 5.7A9.9 9.9 0 0 1 12 5.5c6.4 0 10 6.5 10 6.5a17 17 0 0 1-3.6 4.3" strokeLinejoin="round" />
      <path d="M6.3 7.8A16.7 16.7 0 0 0 2 12s3.6 6.5 10 6.5c1.5 0 2.8-.3 4-.9" strokeLinejoin="round" />
      <path d="M10.6 10.6a3 3 0 0 0 4 4" strokeLinejoin="round" />
    </>
  ),
  settings: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z" />
    </>
  ),
  calendar: (
    <>
      <rect x="3" y="5" width="18" height="16" rx="3" />
      <path d="M3 10h18M8 3v4M16 3v4" />
    </>
  ),
  share: <path d="M12 15V4M8 8l4-4 4 4M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7" strokeLinejoin="round" />,
  globe: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" />
    </>
  ),
  play: <path d="M8 5.5v13l10.5-6.5Z" strokeLinejoin="round" />,
  // Six dots — the handle you drag a row by.
  grip: (
    <>
      <path d="M9 6h.01M15 6h.01M9 12h.01M15 12h.01M9 18h.01M15 18h.01" strokeWidth="3.2" />
    </>
  ),
  chevronLeft: <path d="M15 5l-7 7 7 7" strokeLinejoin="round" />,
  chevronRight: <path d="M9 5l7 7-7 7" strokeLinejoin="round" />,
  phone: (
    <>
      <rect x="6.5" y="2.5" width="11" height="19" rx="2.5" />
      <path d="M10.5 18.5h3" />
    </>
  ),
  monitor: (
    <>
      <rect x="2.5" y="4" width="19" height="12.5" rx="2" />
      <path d="M8.5 20.5h7M12 16.5v4" />
    </>
  ),
  arrowUpRight: <path d="M7 17 17 7M9 7h8v8" strokeLinejoin="round" />,

  /* Social sites, drawn in the same outline style as everything else rather
     than as brand-coloured logos, so they take the page's text colour. */
  instagram: (
    <>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <path d="M17.3 6.7h.01" strokeWidth="2.6" />
    </>
  ),
  youtube: (
    <>
      <rect x="2.5" y="5" width="19" height="14" rx="4" />
      <path d="M10 9.3v5.4l4.6-2.7Z" strokeLinejoin="round" />
    </>
  ),
  tiktok: <path d="M14 3v11.5a3.5 3.5 0 1 1-3.5-3.5M14 3c.6 2.6 2.4 4.4 5 4.8" strokeLinejoin="round" />,
  x: <path d="M4 4h4.4L20 20h-4.4ZM19.6 4l-6.7 7.4M11.1 12.6 4.4 20" strokeLinejoin="round" />,
  facebook: <path d="M15.5 3.5H13a4 4 0 0 0-4 4V21M6 11h9" />,
  linkedin: (
    <>
      <rect x="3" y="3" width="18" height="18" rx="3" />
      <path d="M8 10.5V17M8 7.3v.01M12 17v-3.6a2.5 2.5 0 0 1 5 0V17M12 10.5V17" />
    </>
  ),
  spotify: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M7.5 9.6c3-1 6.5-.7 9 .8M8 12.8c2.5-.7 5.3-.4 7.3.8M8.7 15.8c2-.5 4-.3 5.6.6" />
    </>
  ),
  substack: <path d="M5 4h14M5 8h14M5 12h14v8l-7-4-7 4Z" strokeLinejoin="round" />,
  pinterest: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M11 8.6c3-1 5.2 1 4.1 3.5-.8 1.9-3 2.2-3.8 1M11.6 10 9.4 20" />
    </>
  ),
};

export default function Icon({ name, size = 18, strokeWidth = 1.8, color, className, style }) {
  const content = PATHS[name];
  if (!content) return null;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color || "currentColor"}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      className={className}
      style={style}
      aria-hidden="true"
    >
      {content}
    </svg>
  );
}
