import { motion } from 'framer-motion';
import { urgency, formatDeadline, URGENCY_META } from '../lib/date';

const PRIORITY_DOT = {
  low: 'bg-low',
  normal: 'bg-normal',
  high: 'bg-high',
};

export default function TaskCard({ task, onToggle, onEdit, onDelete }) {
  const u = task.completed ? 'done' : urgency(task);
  const meta = URGENCY_META[u];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -12, transition: { duration: 0.15 } }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className={`group relative flex items-start gap-3 rounded-2xl border px-4 py-3.5 transition-all shadow-sm ${
        task.completed
          ? 'bg-void/60 border-line/60 opacity-75'
          : 'bg-white border-line hover:border-surface/40 hover:shadow-md'
      }`}
    >
      {/* Checkbox Button */}
      <button
        onClick={() => onToggle(task.id)}
        aria-label={task.completed ? 'Mark incomplete' : 'Mark complete'}
        className={`mt-0.5 shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
          task.completed
            ? 'bg-surface border-surface text-white'
            : 'border-line hover:border-surface bg-white'
        }`}
      >
        {task.completed && (
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none">
            <path
              d="M5 13l4 4L19 7"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </button>

      {/* Main Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p
            className={`text-sm font-medium leading-snug break-words ${
              task.completed ? 'text-muted/60 line-through' : 'text-ink'
            }`}
          >
            {task.task}
          </p>
          <span
            className={`shrink-0 w-2 h-2 mt-1.5 rounded-full ${
              PRIORITY_DOT[task.priority] || PRIORITY_DOT.normal
            }`}
          />
        </div>

        {task.des && (
          <p
            className={`mt-1 text-xs leading-relaxed line-clamp-2 ${
              task.completed ? 'text-muted/50' : 'text-muted'
            }`}
          >
            {task.des}
          </p>
        )}

        <div className="mt-2.5 flex items-center gap-2">
          <span
            className="font-mono text-[10px] font-medium tracking-wide px-2 py-0.5 rounded-md border"
            style={{
              color: meta.color,
              borderColor: meta.color + '40',
              backgroundColor: meta.color + '10',
            }}
          >
            {formatDeadline(task.deadline)}
          </span>
        </div>
      </div>

      {/* Action Buttons (Mobile/Tablet par direct visible, Desktop par hover par hi dikhenge) */}
      <div className="flex items-center gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 md:focus-within:opacity-100 transition-opacity">
        <button
          onClick={() => onEdit(task)}
          aria-label="Edit task"
          className="p-1.5 rounded-lg text-muted hover:text-lime-600 hover:bg-lime-100 transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path
              d="M12 20h9M16.5 3.5a2.12 2.12 0 013 3L7 19l-4 1 1-4L16.5 3.5z"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
        <button
          onClick={() => onDelete(task.id)}
          aria-label="Delete task"
          className="p-1.5 rounded-lg text-muted hover:text-delete hover:bg-delete/10 transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path
              d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0l-1 14a2 2 0 01-2 2H7a2 2 0 01-2-2L4 6h16z"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>
    </motion.div>
  );
}