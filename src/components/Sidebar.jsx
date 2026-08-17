import { motion } from "framer-motion";

const NAV = [
  { key: "all", label: "All Tasks", icon: "M4 6h16M4 12h16M4 18h16" },
  {
    key: "today",
    label: "Today",
    icon: "M8 7V3M16 7V3M4 11h16M5 21h14a1 1 0 001-1V7a1 1 0 00-1-1H5a1 1 0 00-1 1v13a1 1 0 001 1z",
  },
  {
    key: "upcoming",
    label: "Upcoming",
    icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z",
  },
  {
    key: "overdue",
    label: "Overdue",
    icon: "M12 9v4m0 4h.01M10.29 3.86l-8.18 14.14A1.5 1.5 0 003.34 20h17.32a1.5 1.5 0 001.23-2.36L13.71 3.86a1.5 1.5 0 00-2.42 0z",
  },
  {
    key: "completed",
    label: "Completed",
    icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",
  },
];

export default function Sidebar({
  view,
  setView,
  counts,
  user,
  onLogout,
  onClose,
}) {
  const userInitial = user?.email ? user.email.charAt(0).toUpperCase() : "U";

  return (
    <aside className="flex flex-col h-full w-full lg:w-64 shrink-0 bg-surface border-r border-line p-4 overflow-hidden">
      {/* Header - Fixed Top */}
      <div className="flex items-center justify-between px-2 mb-6 shrink-0">
        <div className="flex items-center gap-2">
          <span className="w-8 h-8 rounded-lg grad-ring flex items-center justify-center font-display font-bold text-white text-sm">
            T
          </span>
          <span className="font-display font-semibold text-lg text-white">
            Tasked
          </span>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            aria-label="Close menu"
            className="lg:hidden text-white/70 hover:text-white p-1"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path
                d="M6 6l12 12M18 6L6 18"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>
        )}
      </div>

      {/* Nav items - Only this part will scroll if height is small */}
      <nav className="flex-1 min-h-0 overflow-y-auto flex flex-col gap-1 pr-1">
        {NAV.map((item) => {
          const active = view === item.key;
          const count = counts?.[item.key] ?? 0;
          return (
            <button
              key={item.key}
              onClick={() => setView(item.key)}
              className={`group flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                active
                  ? "bg-surface-raised text-ink font-semibold shadow-sm"
                  : "text-white/90 hover:text-white hover:bg-white/10"
              }`}
            >
              <span className="flex items-center gap-3">
                <span
                  className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${
                    active
                      ? "grad-ring text-white"
                      : "bg-white/10 text-white/80 group-hover:text-white"
                  }`}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                    <path
                      d={item.icon}
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
                {item.label}
              </span>
              <span
                className={`font-mono text-[11px] px-1.5 py-0.5 rounded-md ${
                  active
                    ? "bg-void text-ink font-bold"
                    : "bg-white/15 text-white"
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </nav>

      {/* Bottom Footer Section - Fixed Bottom */}
      <div className="shrink-0 mt-auto pt-4 border-t border-white/20 flex flex-col gap-3">
        {user && (
          <div className="flex items-center justify-between gap-2 px-2 py-1.5 rounded-xl bg-white/10 border border-white/10">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-7 h-7 rounded-full bg-surface-raised border border-white/20 flex items-center justify-center font-mono text-xs font-semibold text-ink shrink-0">
                {userInitial}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[10px] uppercase font-mono tracking-wider text-white/60 leading-none mb-0.5">
                  Logged in
                </span>
                <span
                  className="text-xs font-medium text-white truncate"
                  title={user.email}
                >
                  {user.email}
                </span>
              </div>
            </div>

            <button
              onClick={onLogout}
              aria-label="Logout"
              title="Logout"
              className="p-1.5 text-white/70 hover:text-red-300 hover:bg-red-500/20 rounded-lg transition-colors shrink-0"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            </button>
          </div>
        )}

        <div className="flex items-center gap-3 px-2">
          <a
            href="https://github.com/MASTERxVIC"
            target="_blank"
            rel="noreferrer"
            aria-label="GitHub"
            className="text-white/70 hover:text-white transition-colors"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0C5.37 0 0 5.5 0 12.3c0 5.44 3.44 10.05 8.21 11.68.6.11.82-.27.82-.6 0-.29-.01-1.06-.02-2.08-3.34.75-4.04-1.66-4.04-1.66-.55-1.42-1.34-1.8-1.34-1.8-1.09-.77.08-.75.08-.75 1.21.09 1.84 1.28 1.84 1.28 1.07 1.87 2.81 1.33 3.5 1.02.11-.79.42-1.33.76-1.64-2.67-.31-5.47-1.38-5.47-6.13 0-1.35.46-2.46 1.22-3.32-.12-.31-.53-1.57.12-3.27 0 0 1-.33 3.3 1.27a11.3 11.3 0 016 0c2.29-1.6 3.29-1.27 3.29-1.27.66 1.7.25 2.96.12 3.27.76.86 1.22 1.97 1.22 3.32 0 4.76-2.81 5.82-5.49 6.12.43.38.81 1.13.81 2.29 0 1.65-.02 2.98-.02 3.39 0 .33.22.72.83.6C20.57 22.34 24 17.74 24 12.3 24 5.5 18.63 0 12 0z" />
            </svg>
          </a>
          <a
            href="https://www.linkedin.com/in/atul-kumar-012065234/"
            target="_blank"
            rel="noreferrer"
            aria-label="LinkedIn"
            className="text-white/70 hover:text-white transition-colors"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20.45 20.45h-3.55v-5.57c0-1.33-.02-3.04-1.85-3.04-1.86 0-2.14 1.45-2.14 2.94v5.67H9.36V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.38-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.06 2.06 0 110-4.12 2.06 2.06 0 010 4.12zM7.11 20.45H3.56V9h3.55v11.45z" />
            </svg>
          </a>
          <a
            href="/Documentation.html"
            className="ml-auto font-mono text-[10px] tracking-wide text-white/80 hover:text-white transition-colors"
          >
            DOCS
          </a>
        </div>
        <p className="px-2 text-[11px] text-white/60">
          &copy; {new Date().getFullYear()} Tasked
        </p>
      </div>
    </aside>
  );
}