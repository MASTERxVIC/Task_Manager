const VIEW_TITLES = {
  all: "All Tasks",
  today: "Today",
  upcoming: "Upcoming",
  overdue: "Overdue",
  completed: "Completed",
};

export default function Topbar({
  view,
  search,
  setSearch,
  onAddClick,
  onMenuClick,
  onClearAll,
  hasTasks,
}) {
  return (
    <div className="sticky top-0 z-20 bg-[#1E1E24] backdrop-blur border-b border-line px-3 sm:px-8 py-3.5 sm:py-4">
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Menu Toggle (Mobile/Tablet) */}
        <button
          onClick={onMenuClick}
          aria-label="Open menu"
          className="lg:hidden text-[#FDFBF7] p-1 -ml-1 shrink-0"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path
              d="M4 7h16M4 12h16M4 17h16"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </button>

        {/* View Title */}
        <h1 className="font-display font-semibold text-xl text-[#FDFBF7] mr-1 hidden lg:block shrink-0">
          {VIEW_TITLES[view]}
        </h1>

        {/* Search Input (Squeezes on mobile automatically) */}
        <div className="flex-1 min-w-[110px] relative flex items-center bg-white border border-line rounded-xl px-2.5 sm:px-3 py-2 transition-all duration-200 focus-within:border-[#FDFBF7] focus-within:shadow-[0_0_15px_rgba(124,106,204,0.25)] shadow-sm">
          <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            className="shrink-0 text-[#1E1E24]"
          >
            <circle
              cx="11"
              cy="11"
              r="7"
              stroke="currentColor"
              strokeWidth="2"
            />
            <path
              d="M21 21l-4-4"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>

          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search..."
            style={{ outline: "none", boxShadow: "none" }}
            className="w-full bg-transparent pl-2 sm:pl-2.5 text-xs sm:text-sm text-[#1E1E24] placeholder:text-[#1E1E24]/80 border-0 focus:border-0 focus:ring-0 focus-visible:ring-0"
          />
        </div>

        {/* Clear All Button (Mobile pe ab visible rhega) */}
        {hasTasks && (
          <button
            onClick={onClearAll}
            className="shrink-0 inline-flex items-center text-[11px] sm:text-xs font-medium text-muted-dim hover:text-coral border border-line hover:border-coral rounded-xl px-2.5 py-2 transition-colors bg-white whitespace-nowrap shadow-sm"
          >
            Clear all
          </button>
        )}

        {/* New Task Button */}
        <button
          onClick={onAddClick}
          className="shrink-0 inline-flex items-center gap-1 sm:gap-1.5 bg-[#FDD739] text-[#1E1E24] font-semibold text-xs sm:text-sm px-3 sm:px-4 py-2 rounded-xl hover:opacity-90 transition-opacity whitespace-nowrap"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
            <path
              d="M12 5v14M5 12h14"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
            />
          </svg>
          <span className="hidden xs:inline sm:inline">New Task</span>
        </button>
      </div>
    </div>
  );
}