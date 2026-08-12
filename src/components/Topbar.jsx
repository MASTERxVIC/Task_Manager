const VIEW_TITLES = {
  all: 'All Tasks',
  today: 'Today',
  upcoming: 'Upcoming',
  overdue: 'Overdue',
  completed: 'Completed',
};

export default function Topbar({ view, search, setSearch, onAddClick, onMenuClick, onClearAll, hasTasks }) {
  return (
    <div className="sticky top-0 z-20 bg-void/85 backdrop-blur border-b border-line px-4 md:px-8 py-4">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          aria-label="Open menu"
          className="md:hidden text-muted hover:text-ink p-1 -ml-1"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>

        <h1 className="font-display font-semibold text-xl text-ink mr-2 hidden sm:block">
          {VIEW_TITLES[view]}
        </h1>

        <div className="flex-1 relative">
          <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-dim"
          >
            <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
            <path d="M21 21l-4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tasks..."
            className="w-full bg-surface border border-line rounded-xl pl-9 pr-3 py-2 text-sm text-ink placeholder:text-muted-dim focus:border-magenta outline-none transition-colors"
          />
        </div>

        {hasTasks && (
          <button
            onClick={onClearAll}
            className="hidden sm:inline-flex text-xs font-medium text-muted-dim hover:text-coral px-2 py-2 transition-colors"
          >
            Clear all
          </button>
        )}

        <button
          onClick={onAddClick}
          className="inline-flex items-center gap-1.5 grad-ring text-void font-semibold text-sm px-4 py-2 rounded-xl hover:opacity-90 transition-opacity"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
          </svg>
          <span className="hidden sm:inline">New Task</span>
        </button>
      </div>
    </div>
  );
}
