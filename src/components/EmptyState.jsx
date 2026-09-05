const COPY = {
  all: {
    title: 'Nothing on the list yet',
    body: 'Add your first task and it will show up here.',
  },
  today: {
    title: 'Nothing due today',
    body: 'Tasks due today will land in this view.',
  },
  upcoming: {
    title: 'No upcoming tasks',
    body: 'Tasks with a future date will show up here.',
  },
  overdue: {
    title: "You're all caught up",
    body: 'No overdue tasks — nice work.',
  },
  completed: {
    title: 'No completed tasks yet',
    body: 'Check off a task and it will move here.',
  },
  search: {
    title: 'No matches',
    body: 'Try a different search term.',
  },
};

export default function EmptyState({ context = 'all' }) {
  const copy = COPY[context] || COPY.all;
  return (
    <div className="flex flex-col items-center justify-center text-center py-20 px-6">
      <div className="w-14 h-14 rounded-2xl bg-[#FDD739]  flex items-center justify-center mb-4">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" strokeWidth="1.6" className="text-[#1E1E24]" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <p className="font-display font-medium text-[#1E1E24]">{copy.title}</p>
      <p className="text-sm text-gray-500 mt-1 max-w-xs">{copy.body}</p>
    </div>
  );
}
