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
const GROUP_DOT = {
  overdue: 'bg-[#CF0003]',
  today: 'bg-[#B0E01E]',
  upcoming: 'bg-[#008ACF]',
  none: 'bg-[#FFC684]',
  done: 'bg-gray-400',
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

  return (
    <div className="relative">
      {/* signature: gradient timeline rail */}
      {view === 'all' && (
        <div
          className="absolute left-[13px] top-2 bottom-2 w-px hidden sm:block"
          style={{ background: 'linear-gradient(180deg, #CF0003, #B0E01E, #008ACF, #FFC684, #9CA3AF)' }}
        />
      )}

      <div className="flex flex-col gap-8">
        {groups.map((group) => (
          <section key={group.key}>
            {view === 'all' && (
              <div className="flex items-center gap-3 mb-4 relative">
                <span className={`w-2 h-2 rounded-full ${GROUP_DOT[group.key]} sm:ml-[9px] ring-4 ring-void`} />
                <h2 className="font-mono text-[11px] tracking-widest text-muted-dim uppercase font-bold">
                  {GROUP_LABEL[group.key]}
                  <span className="text-muted-dim/60"> ({group.items.length})</span>
                </h2>
              </div>
            )}
            
            {/* GRID LAYOUT: 3 CARDS PER ROW */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:pl-6 items-start justify-start max-w-[1100px]">
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