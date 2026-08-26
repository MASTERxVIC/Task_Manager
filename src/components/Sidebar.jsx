import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronDown,
  ChevronUp,
  Check,
  FolderPlus,
  UserPlus,
  Copy,
  CheckCircle2,
  LogOut,
  X,
  History,
} from "lucide-react";

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
  boards = [],
  activeBoard,
  onSelectBoard,
  onLogout,
  onClose,
  onOpenCreateModal,
  onOpenJoinModal,
  onOpenLogs,
}) {
  const [copied, setCopied] = useState(false);
  const [isBoardDropdownOpen, setIsBoardDropdownOpen] = useState(false);
  const [isCollabOpen, setIsCollabOpen] = useState(false);
  const [isLogsOpen, setIsLogsOpen] = useState(false);

  const userInitial = user?.email ? user.email.charAt(0).toUpperCase() : "U";

  const inviteCode = activeBoard?.invite_code;
  const hasValidCode = Boolean(inviteCode && inviteCode !== "XXXXXX");
  const displayCode = hasValidCode ? inviteCode : "XXXXXX";

  const handleCopyInvite = () => {
    if (!hasValidCode) return;
    navigator.clipboard.writeText(inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <aside className="flex flex-col h-full w-full lg:w-64 shrink-0 bg-surface border-r border-line p-4 overflow-hidden select-none">
      {/* Header - App Brand */}
      <div className="flex items-center justify-between mb-4 shrink-0 px-2">
        <div className="flex items-center gap-2">
          <img
            src="/Logo.svg"
            alt="Tasked Logo"
            className="w-6 h-6 rounded-lg object-contain"
          />
          <span className="font-display font-semibold text-lg text-white">
            Tasked
          </span>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            aria-label="Close menu"
            className="lg:hidden text-white/70 hover:text-white p-1 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Boards Switcher Dropdown */}
      <div className="relative mb-4 px-1">
        <button
          onClick={() => setIsBoardDropdownOpen((prev) => !prev)}
          className="w-full flex items-center justify-between p-2.5 rounded-xl bg-slate-800/80 border border-line text-white hover:bg-slate-800 transition-all cursor-pointer"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-6 h-6 rounded-lg bg-surface-raised border border-white/20 flex items-center justify-center text-xs font-bold text-ink shrink-0">
              {activeBoard?.name
                ? activeBoard.name.charAt(0).toUpperCase()
                : "B"}
            </div>
            <span className="text-xs font-semibold truncate">
              {activeBoard?.name || "Select Board"}
            </span>
          </div>
          <ChevronDown
            className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${
              isBoardDropdownOpen ? "rotate-180" : ""
            }`}
          />
        </button>

        {/* Dropdown Menu */}
        <AnimatePresence>
          {isBoardDropdownOpen && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15 }}
              className="absolute left-1 right-1 top-12 z-20 bg-slate-900 border border-line rounded-xl p-1.5 shadow-xl space-y-1 max-h-48 overflow-y-auto"
            >
              <div className="text-[10px] uppercase font-semibold text-gray-400 px-2 py-1 tracking-wider">
                Your Workspaces
              </div>
              {boards.map((board) => (
                <button
                  key={board.id}
                  onClick={() => {
                    onSelectBoard(board);
                    setIsBoardDropdownOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs transition-colors cursor-pointer ${
                    activeBoard?.id === board.id
                      ? "bg-surface text-ink font-semibold"
                      : "text-gray-300 hover:bg-white/10"
                  }`}
                >
                  <span className="truncate">{board.name}</span>
                  {activeBoard?.id === board.id && (
                    <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  )}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Navigation Filter Links */}
      <nav className="flex-1 min-h-0 overflow-y-auto flex flex-col gap-1 pr-1">
        {NAV.map((item) => {
          const active = view === item.key;
          const count = counts?.[item.key] ?? 0;
          return (
            <button
              key={item.key}
              onClick={() => setView(item.key)}
              className={`group flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-colors cursor-pointer ${
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

        {/* COLLAB SECTION ACCORDION */}
        <div className="px-1 py-2 mt-4 space-y-2">
          {/* Header Toggle */}
          <div
            onClick={() => setIsCollabOpen((prev) => !prev)}
            className="flex items-center justify-between cursor-pointer px-2 py-1 select-none group"
          >
            <span className="text-[11px] font-semibold tracking-wider text-gray-400 uppercase group-hover:text-white transition-colors">
              Collab
            </span>
            <button
              type="button"
              className="p-1 rounded-md text-gray-400 group-hover:text-white hover:bg-white/10 transition-all"
              aria-label="Toggle Collab Section"
            >
              {isCollabOpen ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>
          </div>

          {/* Collapsible Content */}
          <AnimatePresence>
            {isCollabOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="space-y-2 overflow-hidden"
              >
                {/* Active Board Invite Code Copy Block */}
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/60 border border-line">
                  <div className="min-w-0 pr-2">
                    <p className="text-[10px] text-gray-400 font-medium uppercase truncate">
                      {activeBoard ? `${activeBoard.name} Code` : "Invite Code"}
                    </p>
                    <p
                      className={`text-xs font-mono font-semibold truncate ${
                        hasValidCode ? "text-emerald-400" : "text-gray-500"
                      }`}
                    >
                      {displayCode}
                    </p>
                  </div>
                  <button
                    onClick={handleCopyInvite}
                    disabled={!hasValidCode}
                    title={
                      hasValidCode
                        ? "Copy Invite Code"
                        : "Select or create a board first"
                    }
                    className={`p-1.5 rounded-lg transition-colors ${
                      hasValidCode
                        ? "bg-slate-700/50 hover:bg-slate-700 text-gray-300 hover:text-white cursor-pointer"
                        : "bg-slate-800 text-gray-600 cursor-not-allowed opacity-50"
                    }`}
                  >
                    {copied ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>

                {/* Action Buttons */}
                <button
                  onClick={onOpenJoinModal}
                  className="glass-button w-full flex items-center justify-center gap-2 py-2 px-3 text-gray-100 rounded-xl text-xs font-medium cursor-pointer transition-all"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Join Board with Code</span>
                </button>

                <button
                  onClick={onOpenCreateModal}
                  className="glass-button w-full flex items-center justify-center gap-2 py-2 px-3 text-gray-100 rounded-xl text-xs font-medium cursor-pointer transition-all"
                >
                  <FolderPlus className="w-4 h-4" />
                  <span>Create Board</span>
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* LOGS SECTION ACCORDION */}
        <div className="px-1 py-2 space-y-2">
          {/* Header Toggle */}
          <div
            onClick={() => setIsLogsOpen((prev) => !prev)}
            className="flex items-center justify-between cursor-pointer px-2 py-1 select-none group"
          >
            <span className="text-[11px] font-semibold tracking-wider text-gray-400 uppercase group-hover:text-white transition-colors">
              Logs
            </span>
            <button
              type="button"
              className="p-1 rounded-md text-gray-400 group-hover:text-white hover:bg-white/10 transition-all"
              aria-label="Toggle Logs Section"
            >
              {isLogsOpen ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>
          </div>

          {/* Collapsible Content */}
          <AnimatePresence>
            {isLogsOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="space-y-2 overflow-hidden"
              >
                <button
                  onClick={onOpenLogs}
                  disabled={!activeBoard}
                  className={`glass-button w-full flex items-center justify-center gap-2 py-2 px-3 text-gray-100 rounded-xl text-xs font-medium transition-all ${
                    activeBoard
                      ? "cursor-pointer hover:bg-white/10"
                      : "opacity-50 cursor-not-allowed"
                  }`}
                >
                  <History className="w-4 h-4" />
                  <span>Activity Logs</span>
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </nav>

      {/* Bottom Footer Section */}
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
              className="p-1.5 text-white/70 hover:bg-void hover:text-red-400 rounded-lg transition-colors shrink-0 cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
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
            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
            </svg>
          </a>
          <a
            href="https://www.linkedin.com/in/atul-kumar-012065234/"
            target="_blank"
            rel="noreferrer"
            aria-label="LinkedIn"
            className="text-white/70 hover:text-white transition-colors"
          >
            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
              <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z" />
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