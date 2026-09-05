import { AnimatePresence } from 'framer-motion';
import TaskCard from './TaskCard';
import EmptyState from './EmptyState';
import { urgency } from '../lib/date';

const GROUP_ORDER = ['overdue', 'today', 'upcoming', 'none', 'done'];

const GROUP_LABEL = {
  overdue: 'Overdue',
  today: 'Today',
  upcoming: 'Upcoming',
  none: 'No date',
  done: 'Completed',
};

// Tumhare exact colors ka map
const GROUP_HEX_COLOR = {
  overdue: '#CF0003',
  today: '#A7DD05',
  upcoming: '#008ACF',
  none: '#FFC684',
  done: '#9CA3AF',
};

function groupTasks(tasks) {
  const groups = {};
  tasks.forEach((t) => {
    const key = t.completed ? 'done' : urgency(t);
    (groups[key] ||= []).push(t);
  });
  return GROUP_ORDER.filter((k) => groups[k]?.length).map((k) => ({ key: k, items: groups[k] }));
}

export default function TaskList({ tasks, view, search, onToggle, onEdit, onDelete }) {
  const filtered = tasks.filter((t) => {
    if (search) {
      const q = search.toLowerCase();
      if (!t.task.toLowerCase().includes(q) && !t.des?.toLowerCase().includes(q)) return false;
    }
    if (view === 'all') return true;
    if (view === 'completed') return t.completed;
    if (t.completed) return false;
    return urgency(t) === view;
  });

  if (filtered.length === 0) {
    return <EmptyState context={search ? 'search' : view} />;
  }

  const groups = view === 'all' ? groupTasks(filtered) : [{ key: view, items: filtered }];

  // Jo sections screen par dikh rahe hain, unhi ke colors se dynamic gradient rail banegi
  const activeColors = groups.map((g) => GROUP_HEX_COLOR[g.key] || '#9CA3AF');
  const gradientStyle = activeColors.length > 1
    ? `linear-gradient(180deg, ${activeColors.join(', ')})`
    : activeColors[0] || '#9CA3AF';

  return (
    <div className="relative">
      {/* Dynamic timeline rail (jo view me active hain, sirf unhi ka color flow karega) */}
      {view === 'all' && (
        <div
          className="absolute left-[13px] top-2 bottom-2 w-px hidden sm:block transition-all duration-300"
          style={{ background: gradientStyle }}
        />
      )}

      <div className="flex flex-col gap-8">
        {groups.map((group) => (
          <section key={group.key}>
            {view === 'all' && (
              <div className="flex items-center gap-3 mb-4 relative">
                {/* Dot color inline style se mapped color use karega */}
                <span
                  className="w-2 h-2 rounded-full sm:ml-2.25 ring-4 ring-void shrink-0 transition-colors"
                  style={{ backgroundColor: GROUP_HEX_COLOR[group.key] || '#9CA3AF' }}
                />
                <h2 className="font-mono text-[11px] tracking-widest text-muted-dim uppercase font-bold">
                  {GROUP_LABEL[group.key]}
                  <span className="text-muted-dim/60"> ({group.items.length})</span>
                </h2>
              </div>
            )}

            {/* FLEX-WRAP CONTAINER WITH EXACT GAPS */}
            <div className="flex flex-wrap gap-6 items-start justify-start w-full">
              <AnimatePresence initial={false}>
                {group.items.map((task) => (
                  <TaskCard key={task.id} task={task} onToggle={onToggle} onEdit={onEdit} onDelete={onDelete} />
                ))}
              </AnimatePresence>
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}