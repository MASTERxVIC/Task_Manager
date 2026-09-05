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

// Exact HEX Colors as shown in your design
const GROUP_HEX_COLOR = {
  overdue: '#CF0003',
  today: '#A7DD05',
  upcoming: '#008ACF',
  none: '#FFC684',
  done: '#89A1FF',
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
    <div className="flex flex-col gap-10">
      {groups.map((group) => {
        const color = GROUP_HEX_COLOR[group.key] || '#9CA3AF';

        return (
          <section key={group.key} className="relative pl-7 sm:pl-9">
            {/* INDIVIDUAL SECTION TIMELINE RAIL (DOT + VERTICAL LINE) */}
            <div className="absolute left-1.5 top-0 bottom-0 flex flex-col items-center">
              {/* Outer Glow Circle / Dot */}
              <div 
                className="w-4 h-4 rounded-full flex items-center justify-center shrink-0"
                style={{ backgroundColor: `${color}33` }} // 20% opacity glow ring
              >
                <div 
                  className="w-2.5 h-2.5 rounded-full" 
                  style={{ backgroundColor: color }}
                />
              </div>

              {/* Vertical Solid Line for this section */}
              <div 
                className="w-0.5 h-full rounded-full mt-1" 
                style={{ backgroundColor: color }}
              />
            </div>

            {/* SECTION HEADER */}
            {view === 'all' && (
              <div className="flex items-center gap-3 mb-4">
                <h2 
                  className="font-mono text-xs tracking-widest uppercase font-bold"
                  style={{ color }}
                >
                  {GROUP_LABEL[group.key]}
                  <span className="opacity-70"> ({group.items.length})</span>
                </h2>
              </div>
            )}
            
            {/* TASKS FLEX CONTAINER */}
            <div className="flex flex-wrap gap-6 items-start justify-start w-full">
              <AnimatePresence initial={false}>
                {group.items.map((task) => (
                  <TaskCard key={task.id} task={task} onToggle={onToggle} onEdit={onEdit} onDelete={onDelete} />
                ))}
              </AnimatePresence>
            </div>
          </section>
        );
      })}
    </div>
  );
}