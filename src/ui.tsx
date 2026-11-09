import type { ReactNode } from "react";

export type IconName =
  | "arrow"
  | "bell"
  | "book"
  | "check"
  | "chevron"
  | "clock"
  | "close"
  | "edit"
  | "eye"
  | "family"
  | "flag"
  | "grid"
  | "home"
  | "idea"
  | "language"
  | "lock"
  | "logout"
  | "menu"
  | "message"
  | "person"
  | "play"
  | "review"
  | "school"
  | "spark"
  | "speaker"
  | "star"
  | "trend"
  | "warning";

const paths: Record<IconName, ReactNode> = {
  arrow: (
    <>
      <path d="M5 12h14M13 6l6 6-6 6" />
    </>
  ),
  bell: (
    <>
      <path d="M6 9a6 6 0 0112 0c0 7 3 7 3 9H3c0-2 3-2 3-9Z" />
      <path d="M9.5 21h5" />
    </>
  ),
  book: (
    <>
      <path d="M4 5.5A3.5 3.5 0 017.5 2H20v16H7.5A3.5 3.5 0 004 21.5z" />
      <path d="M4 5.5v16M8 6h8M8 10h8" />
    </>
  ),
  check: <path d="M5 12.5l4.2 4.2L19 7" />,
  chevron: <path d="M9 6l6 6-6 6" />,
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </>
  ),
  close: <path d="M6 6l12 12M18 6L6 18" />,
  edit: (
    <>
      <path d="M4 20l4.2-1 10.6-10.6-3.2-3.2L5 15.8zM13.8 7l3.2 3.2" />
    </>
  ),
  eye: (
    <>
      <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6z" />
      <circle cx="12" cy="12" r="2.5" />
    </>
  ),
  family: (
    <>
      <circle cx="8" cy="8" r="3" />
      <circle cx="17" cy="9" r="2.5" />
      <path d="M2.5 20c.4-4 2.2-6 5.5-6s5.1 2 5.5 6M14 15c3.8-.7 6.2 1.1 6.5 5" />
    </>
  ),
  flag: (
    <>
      <path d="M5 21V4M5 5h11l-2 4 2 4H5" />
    </>
  ),
  grid: (
    <>
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </>
  ),
  home: (
    <>
      <path d="M3 11l9-8 9 8" />
      <path d="M5 10v11h14V10M9 21v-7h6v7" />
    </>
  ),
  idea: (
    <>
      <path d="M9 18h6M10 22h4" />
      <path d="M8.5 15.5A7 7 0 1116 15c-.9.7-1 1.6-1 3H9c0-1.2-.1-1.9-.5-2.5z" />
    </>
  ),
  language: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M3.5 9h17M3.5 15h17M12 3c2.5 2.4 3.5 5.4 3.5 9s-1 6.6-3.5 9c-2.5-2.4-3.5-5.4-3.5-9S9.5 5.4 12 3z" />
    </>
  ),
  lock: (
    <>
      <rect x="5" y="10" width="14" height="11" rx="2" />
      <path d="M8 10V7a4 4 0 018 0v3" />
    </>
  ),
  logout: (
    <>
      <path d="M10 4H4v16h6M14 8l4 4-4 4M8 12h10" />
    </>
  ),
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  message: <path d="M4 4h16v12H9l-5 4z" />,
  person: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c.7-5 3.3-7 8-7s7.3 2 8 7" />
    </>
  ),
  play: <path d="M9 6l9 6-9 6z" />,
  review: (
    <>
      <path d="M7 3h10v4H7zM5 5H3v17h18V5h-2" />
      <path d="M8 12l2.3 2.3L16 9" />
    </>
  ),
  school: (
    <>
      <path d="M3 10l9-6 9 6-9 5zM6 12v5c3.5 2.5 8.5 2.5 12 0v-5M21 10v7" />
    </>
  ),
  spark: (
    <>
      <path d="M12 2l1.4 5.6L19 9l-5.6 1.4L12 16l-1.4-5.6L5 9l5.6-1.4zM19 15l.7 2.3L22 18l-2.3.7L19 21l-.7-2.3L16 18l2.3-.7z" />
    </>
  ),
  speaker: (
    <>
      <path d="M4 10v4h4l5 4V6l-5 4zM16 9c1.5 1.7 1.5 4.3 0 6M19 6c3 3.4 3 8.6 0 12" />
    </>
  ),
  star: <path d="M12 3l2.8 5.7 6.2.9-4.5 4.4 1 6.2-5.5-2.9-5.5 2.9 1-6.2L3 9.6l6.2-.9z" />,
  trend: (
    <>
      <path d="M4 19V9M10 19V5M16 19v-7M22 19H2" />
      <path d="M4 6l5-3 6 5 6-5" />
    </>
  ),
  warning: (
    <>
      <path d="M12 3L2.5 20h19z" />
      <path d="M12 9v4M12 17h.01" />
    </>
  ),
};

export function Icon({ name, size = 20 }: { name: IconName; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  );
}

export function Button({
  children,
  icon,
  variant = "primary",
  onClick,
  className = "",
  disabled = false,
}: {
  children: ReactNode;
  icon: IconName;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
}) {
  return (
    <button className={`button ${variant} ${className}`} onClick={onClick} disabled={disabled}>
      <Icon name={icon} />
      {children}
    </button>
  );
}

export function Status({
  type,
  children,
}: {
  type: "good" | "warn" | "bad" | "neutral";
  children: ReactNode;
}) {
  const icon =
    type === "good" ? "check" : type === "warn" ? "warning" : type === "bad" ? "idea" : "clock";
  return (
    <span className={`status ${type}`}>
      <Icon name={icon} size={16} />
      {children}
    </span>
  );
}
