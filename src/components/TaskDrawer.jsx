import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const PRIORITIES = [
  { key: 'low', label: 'Low', color: 'bg-low' },
  { key: 'normal', label: 'Normal', color: 'bg-normal' },
  { key: 'high', label: 'High', color: 'bg-high' },
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
            className="fixed inset-0 z-40 bg-ink/40 backdrop-blur-sm"
          />
          <motion.div
            key="drawer"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
            role="dialog"
            aria-modal="true"
            className="fixed top-0 right-0 z-50 h-full w-full sm:w-[420px] bg-void border-l border-line flex flex-col shadow-2xl"
          >
            <div className="flex items-center justify-between px-6 py-5 border-b border-line bg-void">
              <h2 className="font-display font-semibold text-lg text-ink">
                {editingTask ? 'Edit Task' : 'New Task'}
              </h2>
              <button
                onClick={onClose}
                aria-label="Close"
                className="text-muted/70 hover:text-ink p-1 transition-colors"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-y-auto">
              <div className="flex-1 px-6 py-5 flex flex-col gap-5">
                <div>
                  <label className="block text-xs font-medium text-ink/80 mb-1.5" htmlFor="task-name">
                    Task name
                  </label>
                  <input
                    id="task-name"
                    autoFocus
                    value={form.task}
                    onChange={(e) => setForm((f) => ({ ...f, task: e.target.value }))}
                    placeholder="e.g. Renew domain"
                    className="w-full bg-white border border-line rounded-xl px-3 py-2.5 text-sm text-ink placeholder:text-muted/50 focus:border-surface outline-none transition-colors shadow-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-ink/80 mb-1.5" htmlFor="task-des">
                    Description
                  </label>
                  <textarea
                    id="task-des"
                    rows={4}
                    value={form.des}
                    onChange={(e) => setForm((f) => ({ ...f, des: e.target.value }))}
                    placeholder="Optional details..."
                    className="w-full bg-white border border-line rounded-xl px-3 py-2.5 text-sm text-ink placeholder:text-muted/50 focus:border-surface outline-none transition-colors resize-none shadow-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-ink/80 mb-1.5" htmlFor="task-date">
                    Due date
                  </label>
                  <input
                    id="task-date"
                    type="date"
                    value={form.deadline}
                    onChange={(e) => setForm((f) => ({ ...f, deadline: e.target.value }))}
                    className="w-full bg-white border border-line rounded-xl px-3 py-2.5 text-sm text-ink focus:border-surface outline-none transition-colors shadow-sm"
                  />
                </div>

                <div>
                  <span className="block text-xs font-medium text-ink/80 mb-1.5">Priority</span>
                  <div className="flex gap-2">
                    {PRIORITIES.map((p) => (
                      <button
                        key={p.key}
                        type="button"
                        onClick={() => setForm((f) => ({ ...f, priority: p.key }))}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                          form.priority === p.key
                            ? 'border-surface bg-surface/10 text-ink font-semibold shadow-sm'
                            : 'border-line text-muted hover:text-ink bg-white'
                        }`}
                      >
                        <span className={`w-2 h-2 rounded-full ${p.color}`} />
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>

                {error && <p className="text-xs text-delete font-medium">{error}</p>}
              </div>

              <div className="px-6 py-5 border-t border-line flex gap-3 bg-void">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-2.5 rounded-xl text-sm font-medium text-ink/80 hover:text-ink border border-line bg-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-surface text-white hover:opacity-95 transition-opacity shadow-sm"
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