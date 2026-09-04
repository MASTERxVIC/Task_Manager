import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronDown,
  Check,
  FolderPlus,
  UserPlus,
  Copy,
  CheckCircle2,
  LogOut,
  X,
  History,
  Eye,
  EyeOff,
  Trash2,
  Lock,
  Bell,
} from "lucide-react";
import { enableNotifications } from "../utils/pushService";

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
  onDeleteBoard,
  onLogout,
  onClose,
  onOpenCreateModal,
  onOpenJoinModal,
  onOpenLogs,
  boardMembers = [], // Added default prop to avoid undefined error
}) {
  const [copied, setCopied] = useState(false);
  const [showCode, setShowCode] = useState(false);
  const [isBoardDropdownOpen, setIsBoardDropdownOpen] = useState(false);
  const [isCollabOpen, setIsCollabOpen] = useState(false);
  const [isLogsOpen, setIsLogsOpen] = useState(false);

  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsBoardDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, []);

  const userInitial = user?.email ? user.email.charAt(0).toUpperCase() : "U";

  const isDefaultBoard = activeBoard?.name?.trim().toLowerCase() === "default";
  const inviteCode = activeBoard?.invite_code;
  const hasValidCode = Boolean(
    !isDefaultBoard && inviteCode && inviteCode !== "XXXXXX",
  );

  const displayCode = hasValidCode
    ? showCode
      ? inviteCode
      : "••••••"
    : "XXXXXX";

  const handleCopyInvite = () => {
    if (!hasValidCode) return;
    navigator.clipboard.writeText(inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleEnablePushNotification = async () => {
    if (!user?.id) return;
    await enableNotifications(user.id, true);
  };

  return (
    <aside className="flex flex-col h-full w-full lg:w-84.75 shrink-0 bg-[#1E1E24] p-4 overflow-hidden select-none">
      {/* Header - App Brand */}
      <div className="flex items-center justify-between mb-4 shrink-0 px-2">
        <div className="flex items-center gap-2">
          <img src="/Logo.svg" alt="CollabUS Logo" className="w-6 h-6" />
          <span className="font-archivo font-semibold text-lg text-[#FDFBF7]">
            Collab<span className="text-[#FDD739]">US</span>
          </span>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close menu"
            className="lg:hidden text-white/70 hover:text-[#FDFBF7] p-1 cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Boards Switcher Dropdown */}
      <div className="relative mb-4 px-1" ref={dropdownRef}>
        <button
          type="button"
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

        <AnimatePresence>
          {isBoardDropdownOpen && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15 }}
              className="absolute left-1 right-1 top-12 z-20 bg-slate-900 border border-line rounded-xl p-1.5 shadow-xl space-y-1 max-h-48 overflow-y-auto no-scrollbar"
            >
              <div className="text-[10px] uppercase font-semibold text-gray-400 px-2 py-1 tracking-wider">
                Your Workspaces
              </div>
              {boards.map((board) => {
                const isBoardDefault =
                  board.name?.trim().toLowerCase() === "default";
                return (
                  <div
                    key={board.id}
                    onClick={() => {
                      onSelectBoard(board);
                      setIsBoardDropdownOpen(false);
                    }}
                    className={`group flex items-center justify-between px-2.5 py-2 rounded-lg text-xs transition-colors cursor-pointer ${
                      activeBoard?.id === board.id
                        ? "bg-[#FDD739] text-[#2F2F2F] font-semibold"
                        : "text-gray-300 hover:bg-white/10"
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate pr-2">
                      {isBoardDefault && (
                        <Lock
                          className={`w-3.5 h-3.5 shrink-0 ${
                            activeBoard?.id === board.id
                              ? "text-[#2F2F2F]"
                              : "text-[#FDFBF7]"
                          }`}
                          title="Default Locked Board"
                        />
                      )}
                      <span className="truncate">{board.name}</span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {activeBoard?.id === board.id && (
                        <Check className="w-3.5 h-3.5 text-[#2F2F2F]" />
                      )}

                      {!isBoardDefault && onDeleteBoard && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteBoard(board);
                          }}
                          title="Delete Workspace"
                          className={`p-1 transition-all duration-200 cursor-pointer hover:text-red-400 hover:scale-110 ${
                            activeBoard?.id === board.id
                              ? "text-[#2F2F2F] opacity-70 hover:!opacity-100"
                              : "text-gray-50 opacity-30 group-hover:opacity-70 hover:!opacity-100"
                          }`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Navigation Filter Links */}
      <nav className="flex-1 min-h-0 overflow-y-auto flex flex-col gap-1 pr-1 no-scrollbar">
        {NAV.map((item) => {
          const active = view === item.key;
          const count = counts?.[item.key] ?? 0;
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => setView(item.key)}
              className={`group flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-colors cursor-pointer ${
                active
                  ? "bg-[#FDFBF7] text-[#2F2F2F] font-semibold shadow-sm"
                  : "text-white/90 hover:text-white hover:bg-white/10"
              }`}
            >
              <span className="flex items-center gap-3">
                <span
                  className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${
                    active
                      ? "bg-[#FDD739] text-[#2F2F2F]"
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
                    ? "bg-[#FDFBF7] text-[#2F2F2F] font-bold"
                    : "bg-white/15 text-[#FDFBF7]"
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}

        {/* COLLAB SECTION ACCORDION */}
        <div className="px-1 py-2 mt-4 space-y-2">
          <div
            onClick={() => setIsCollabOpen((prev) => !prev)}
            className="flex items-center justify-between cursor-pointer px-2 py-1 select-none group"
          >
            <span className="text-[11px] font-semibold tracking-wider text-gray-400 uppercase group-hover:text-white transition-colors">
              Collab
            </span>
            <ChevronDown
              className={`w-4 h-4 text-gray-400 group-hover:text-white transition-transform duration-200 ${
                isCollabOpen ? "rotate-180" : ""
              }`}
            />
          </div>

          <AnimatePresence>
            {isCollabOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="space-y-2 overflow-hidden"
              >
                {!isDefaultBoard && (
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#2F2F2F] border border-line">
                    <div className="min-w-0 pr-2">
                      <p className="text-[10px] text-gray-400 font-medium uppercase truncate">
                        {activeBoard
                          ? `${activeBoard.name} -Code`
                          : "Invite Code"}
                      </p>
                      <p
                        className={`text-xs font-mono font-semibold truncate ${
                          hasValidCode ? "text-[#FDD739]" : "text-gray-500"
                        }`}
                      >
                        {displayCode}
                      </p>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {hasValidCode && (
                        <button
                          type="button"
                          onClick={() => setShowCode((prev) => !prev)}
                          title={showCode ? "Hide Code" : "Show Code"}
                          className="p-1.5 rounded-lg bg-slate-700/50 hover:bg-slate-700 text-gray-300 hover:text-white cursor-pointer transition-colors"
                        >
                          {showCode ? (
                            <EyeOff className="w-4 h-4 text-[#FDD739]" />
                          ) : (
                            <Eye className="w-4 h-4 text-gray-400" />
                          )}
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={handleCopyInvite}
                        disabled={!hasValidCode}
                        title={
                          hasValidCode
                            ? "Copy Invite Code"
                            : "Select board first"
                        }
                        className={`p-1.5 rounded-lg transition-colors ${
                          hasValidCode
                            ? "bg-slate-700/50 hover:bg-slate-700 text-gray-300 hover:text-white cursor-pointer"
                            : "bg-slate-800 text-gray-600 cursor-not-allowed opacity-50"
                        }`}
                      >
                        {copied ? (
                          <CheckCircle2 className="w-4 h-4 text-[#FDD739]" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                )}

                <button
                  type="button"
                  onClick={onOpenJoinModal}
                  className="glass-button w-full flex items-center justify-center gap-2 py-2 px-3 text-gray-100 rounded-xl text-xs font-medium cursor-pointer transition-all"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Join Board with Code</span>
                </button>

                <button
                  type="button"
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
        <div className="px-1 py-2 mt-2 space-y-2">
          <div
            onClick={() => setIsLogsOpen((prev) => !prev)}
            className="flex items-center justify-between cursor-pointer px-2 py-1 select-none group"
          >
            <span className="text-[11px] font-semibold tracking-wider text-gray-400 uppercase group-hover:text-white transition-colors">
              Logs & Members
            </span>
            <ChevronDown
              className={`w-4 h-4 text-gray-400 group-hover:text-white transition-transform duration-200 ${
                isLogsOpen ? "rotate-180" : ""
              }`}
            />
          </div>

          <AnimatePresence>
            {isLogsOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="space-y-3 overflow-hidden pt-1"
              >
                {!isDefaultBoard && boardMembers?.length > 0 && (
                  <div className="space-y-1 px-1">
                    <p className="text-[10px] text-gray-400 font-semibold uppercase px-1">
                      Members
                    </p>
                    {boardMembers.map((member) => (
                      <div
                        key={member.user_id}
                        className="flex items-center gap-2 px-2 py-1.5 text-xs text-gray-300 rounded-lg hover:bg-slate-800 transition-colors"
                      >
                        <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
                        <span className="truncate">
                          {member.full_name || member.email || "Team Member"}
                        </span>
                        <span className="ml-auto text-[10px] text-gray-500 capitalize">
                          {member.role}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                <button
                  type="button"
                  onClick={onOpenLogs}
                  disabled={!activeBoard || isDefaultBoard}
                  className={`glass-button w-full flex items-center justify-center gap-2 py-2 px-3 text-gray-100 rounded-xl text-xs font-medium transition-all ${
                    !activeBoard || isDefaultBoard
                      ? "opacity-50 cursor-not-allowed"
                      : "cursor-pointer hover:bg-white/10"
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
      <div className="shrink-0 mt-auto pt-3 border-t border-white/10 flex flex-col gap-2.5">
        {user && (
          <div className="flex items-center justify-between gap-2 px-2 py-1.5 rounded-xl bg-white/5 border border-white/10">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-7 h-7 rounded-full bg-surface-raised border border-white/20 flex items-center justify-center font-mono text-xs font-semibold text-ink shrink-0">
                {userInitial}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[9px] uppercase font-mono tracking-wider text-white/50 leading-none mb-0.5">
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

            <div className="flex items-center gap-1 shrink-0">
              {/* Sleek Notification Bell Icon Button (Bina layout disturb kiye) */}
              <button
                type="button"
                onClick={handleEnablePushNotification}
                disabled={!user?.id}
                title="Enable Push Notifications"
                className="p-1.5 text-white/70 hover:bg-white/10 hover:text-white rounded-lg transition-colors cursor-pointer disabled:opacity-40"
              >
                <Bell className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={onLogout}
                aria-label="Logout"
                title="Logout"
                className="p-1.5 text-white/70 hover:bg-void hover:text-red-400 rounded-lg transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        <p className="px-2 text-[10px] text-white/40 text-center">
          &copy; {new Date().getFullYear()} Tasked
        </p>
      </div>
    </aside>
  );
}
