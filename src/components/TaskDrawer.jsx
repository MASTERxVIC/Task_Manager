import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const PRIORITIES = [
  { key: 'low', label: 'Low', color: 'bg-muted-dim' },
  { key: 'normal', label: 'Normal', color: 'bg-violet' },
  { key: 'high', label: 'High', color: 'bg-gold' },
];

const emptyForm = { task: '', des: '', deadline: '', priority: 'normal' };

export default function TaskDrawer({ open, onClose, onSave, editingTask }) {
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      setForm(
        editingTask
          ? {
              task: editingTask.task,
              des: editingTask.des || '',
              deadline: editingTask.deadline || '',
              priority: editingTask.priority || 'normal',
            }
          : emptyForm
      );
      setError('');
    }
  }, [open, editingTask]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.task.trim()) {
      setError('Give the task a name.');
      return;
    }
    onSave({ ...form, task: form.task.trim(), des: form.des.trim() });
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-void/70 backdrop-blur-sm"
          />
          <motion.div
            key="drawer"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
            role="dialog"
            aria-modal="true"
            className="fixed top-0 right-0 z-50 h-full w-full sm:w-[420px] bg-surface border-l border-line flex flex-col"
          >
            <div className="flex items-center justify-between px-6 py-5 border-b border-line">
              <h2 className="font-display font-semibold text-lg text-ink">
                {editingTask ? 'Edit Task' : 'New Task'}
              </h2>
              <button
                onClick={onClose}
                aria-label="Close"
                className="text-muted-dim hover:text-ink p-1"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-y-auto">
              <div className="flex-1 px-6 py-5 flex flex-col gap-5">
                <div>
                  <label className="block text-xs font-medium text-muted mb-1.5" htmlFor="task-name">
                    Task name
                  </label>
                  <input
                    id="task-name"
                    autoFocus
                    value={form.task}
                    onChange={(e) => setForm((f) => ({ ...f, task: e.target.value }))}
                    placeholder="e.g. Renew domain"
                    className="w-full bg-void border border-line rounded-xl px-3 py-2.5 text-sm text-ink placeholder:text-muted-dim focus:border-magenta outline-none transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-muted mb-1.5" htmlFor="task-des">
                    Description
                  </label>
                  <textarea
                    id="task-des"
                    rows={4}
                    value={form.des}
                    onChange={(e) => setForm((f) => ({ ...f, des: e.target.value }))}
                    placeholder="Optional details..."
                    className="w-full bg-void border border-line rounded-xl px-3 py-2.5 text-sm text-ink placeholder:text-muted-dim focus:border-magenta outline-none transition-colors resize-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-muted mb-1.5" htmlFor="task-date">
                    Due date
                  </label>
                  <input
                    id="task-date"
                    type="date"
                    value={form.deadline}
                    onChange={(e) => setForm((f) => ({ ...f, deadline: e.target.value }))}
                    className="w-full bg-void border border-line rounded-xl px-3 py-2.5 text-sm text-ink focus:border-magenta outline-none transition-colors"
                  />
                </div>

                <div>
                  <span className="block text-xs font-medium text-muted mb-1.5">Priority</span>
                  <div className="flex gap-2">
                    {PRIORITIES.map((p) => (
                      <button
                        key={p.key}
                        type="button"
                        onClick={() => setForm((f) => ({ ...f, priority: p.key }))}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                          form.priority === p.key
                            ? 'border-ink/30 bg-surface-raised text-ink'
                            : 'border-line text-muted hover:text-ink'
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${p.color}`} />
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>

                {error && <p className="text-xs text-coral">{error}</p>}
              </div>

              <div className="px-6 py-5 border-t border-line flex gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-2.5 rounded-xl text-sm font-medium text-muted hover:text-ink border border-line transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold grad-ring text-void hover:opacity-90 transition-opacity"
                >
                  {editingTask ? 'Save changes' : 'Add task'}
                </button>
              </div>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
