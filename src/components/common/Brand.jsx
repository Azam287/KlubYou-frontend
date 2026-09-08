// Logo mark, Google "G", and the decorative QR code used in a couple of
// places — split out because they're multi-colour / one-off, unlike the
// single-tone icons in Icon.jsx.

export function LogoMark({ size = 28, dark = false }) {
  return (
    <svg className="mark" width={size} height={size} viewBox="0 0 32 32" fill="none">
      <rect width="32" height="32" rx="9" fill={dark ? "#2E2450" : "#221A38"} />
      <path d="M13 11.5v9l7.5-4.5L13 11.5Z" fill="#F15B41" />
    </svg>
  );
}

export function GoogleIcon({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24">
      <path
        fill="#4285F4"
        d="M22.5 12.2c0-.7-.1-1.4-.2-2H12v3.8h5.9a5 5 0 0 1-2.2 3.3v2.7h3.6c2.1-2 3.2-4.9 3.2-7.8Z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.9 0 5.4-1 7.2-2.7l-3.6-2.7c-1 .7-2.3 1.1-3.6 1.1-2.8 0-5.1-1.9-6-4.4H2.3v2.8A11 11 0 0 0 12 23Z"
      />
      <path fill="#FBBC05" d="M6 14.3a6.6 6.6 0 0 1 0-4.2V7.3H2.3a11 11 0 0 0 0 9.8L6 14.3Z" />
      <path
        fill="#EA4335"
        d="M12 5.5c1.6 0 3 .5 4.1 1.6l3.1-3.1A11 11 0 0 0 2.3 7.3L6 10.1c.9-2.6 3.2-4.6 6-4.6Z"
      />
    </svg>
  );
}

export function QrPlaceholder({ size = 68 }) {
  return (
    <svg viewBox="0 0 68 68" width={size} height={size} fill="none" aria-hidden="true">
      <rect width="68" height="68" rx="8" fill="#fff" />
      <g fill="#221A38">
        <rect x="8" y="8" width="16" height="16" rx="3" />
        <rect x="44" y="8" width="16" height="16" rx="3" />
        <rect x="8" y="44" width="16" height="16" rx="3" />
      </g>
      <g fill="#fff">
        <rect x="12" y="12" width="8" height="8" rx="1.5" />
        <rect x="48" y="12" width="8" height="8" rx="1.5" />
        <rect x="12" y="48" width="8" height="8" rx="1.5" />
      </g>
      <g fill="#221A38">
        <rect x="14" y="14" width="4" height="4" />
        <rect x="50" y="14" width="4" height="4" />
        <rect x="14" y="50" width="4" height="4" />
        <rect x="30" y="10" width="4" height="4" />
        <rect x="30" y="18" width="4" height="4" />
        <rect x="30" y="30" width="4" height="4" />
        <rect x="38" y="30" width="4" height="4" />
        <rect x="46" y="34" width="4" height="4" />
        <rect x="30" y="46" width="4" height="4" />
        <rect x="38" y="46" width="4" height="4" />
        <rect x="46" y="46" width="4" height="4" />
        <rect x="46" y="54" width="4" height="4" />
        <rect x="54" y="30" width="4" height="4" />
        <rect x="38" y="54" width="4" height="4" />
      </g>
    </svg>
  );
}
