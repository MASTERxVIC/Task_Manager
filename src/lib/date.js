function startOfDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function todayStart() {
  return startOfDay(new Date());
}

export function parseDeadline(deadline) {
  if (!deadline) return null;
  // deadline stored as "YYYY-MM-DD" from <input type="date">
  const [y, m, d] = deadline.split('-').map(Number);
  return new Date(y, m - 1, d);
}

// checkig update
export function urgency(task) {
  if (task.completed) return 'done';
  if (!task.deadline) return 'none';
  const due = parseDeadline(task.deadline);
  const today = todayStart();
  if (due < today) return 'overdue';
  if (due.getTime() === today.getTime()) return 'today';
  return 'upcoming';
}

export function formatDeadline(deadline) {
  if (!deadline) return 'No date';
  const due = parseDeadline(deadline);
  const today = todayStart();
  const diffDays = Math.round((due - today) / 86400000);

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Tomm';
  if (diffDays === -1) return 'Yest';

  return due.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: due.getFullYear() !== today.getFullYear() ? 'numeric' : undefined,
  });
}

export const URGENCY_META = {
  overdue: { label: 'Overdue', color: 'var(--color-coral)' },
  today: { label: 'Today', color: 'var(--color-amber)' },
  upcoming: { label: 'Upcoming', color: 'var(--color-violet)' },
  none: { label: 'No date', color: 'var(--color-muted-dim)' },
  done: { label: 'Completed', color: 'var(--color-mint)' },
};
