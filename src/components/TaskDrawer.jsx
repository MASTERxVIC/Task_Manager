import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const PRIORITIES = [
  { key: "low", label: "Low", color: "bg-low" },
  { key: "normal", label: "Normal", color: "bg-normal" },
  { key: "high", label: "High", color: "bg-high" },
];

const emptyForm = {
  task: "",
  des: "",
  deadline: "",
  priority: "normal",
  image: "",
};

export default function TaskDrawer({ open, onClose, onSave, editingTask }) {
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setForm(
        editingTask
          ? {
              task: editingTask.task,
              des: editingTask.des || "",
              deadline: editingTask.deadline || "",
              priority: editingTask.priority || "normal",
              image: editingTask.image || "",
            }
          : emptyForm,
      );
      setError("");
    }
  }, [open, editingTask]);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setForm((f) => ({ ...f, image: reader.result }));
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleRemoveImage = () => {
    setForm((f) => ({ ...f, image: "" }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.task.trim()) {
      setError("Give the task a name.");
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
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
            role="dialog"
            aria-modal="true"
            className="fixed top-0 right-0 z-50 h-full w-full sm:w-[420px] bg-void border-l border-line flex flex-col shadow-2xl"
          >
            <div className="flex items-center justify-between px-6 py-5 border-b border-line bg-void">
              <h2 className="font-display font-semibold text-lg text-ink">
                {editingTask ? "Edit Task" : "New Task"}
              </h2>
              <button
                onClick={onClose}
                aria-label="Close"
                className="text-muted/70 hover:text-ink p-1 transition-colors"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M6 6l12 12M18 6L6 18"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            </div>

            <form
              onSubmit={handleSubmit}
              className="flex-1 flex flex-col overflow-y-auto no-scrollbar"
            >
              <div className="flex-1 px-6 py-5 flex flex-col gap-5">
                <div>
                  <label
                    className="block text-xs font-medium text-ink/80 mb-1.5"
                    htmlFor="task-name"
                  >
                    Task name
                  </label>
                  <input
                    id="task-name"
                    autoFocus
                    value={form.task}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, task: e.target.value }))
                    }
                    placeholder="e.g. Renew domain"
                    className="w-full bg-white border border-line rounded-xl px-3 py-2.5 text-sm text-ink placeholder:text-muted/50 focus:border-surface outline-none transition-colors shadow-sm"
                  />
                </div>

                {/* Attachment */}
                <div>
                  <label className="block text-xs font-medium text-ink/80 mb-1.5">
                    Attachment
                  </label>
                  {form.image ? (
                    <div className="relative rounded-xl overflow-hidden border border-line bg-white p-2">
                      <img
                        src={form.image}
                        alt="Task Attachment"
                        className="w-full h-36 object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={handleRemoveImage}
                        className="absolute top-3 right-3 bg-ink/70 hover:bg-ink text-white p-1 rounded-full text-xs transition-colors"
                      >
                        ✕ Remove
                      </button>
                    </div>
                  ) : (
                    <div>
                      <label
                        htmlFor="task-image-upload"
                        className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border border-dashed border-line bg-white hover:bg-surface/5 text-muted hover:text-ink text-xs font-medium cursor-pointer transition-all shadow-sm"
                      >
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <rect
                            x="3"
                            y="3"
                            width="18"
                            height="18"
                            rx="2"
                            ry="2"
                          />
                          <circle cx="8.5" cy="8.5" r="1.5" />
                          <polyline points="21 15 16 10 5 21" />
                        </svg>
                        <span>Attach Photo</span>
                      </label>
                      <input
                        id="task-image-upload"
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                    </div>
                  )}
                </div>

                <div>
                  <label
                    className="block text-xs font-medium text-ink/80 mb-1.5"
                    htmlFor="task-des"
                  >
                    Description
                  </label>
                  <textarea
                    id="task-des"
                    rows={4}
                    value={form.des}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, des: e.target.value }))
                    }
                    placeholder="Optional details..."
                    className="w-full bg-white border border-line rounded-xl px-3 py-2.5 text-sm text-ink placeholder:text-muted/50 focus:border-surface outline-none transition-colors resize-none shadow-sm"
                  />
                </div>

                <div>
                  <label
                    className="block text-xs font-medium text-ink/80 mb-1.5"
                    htmlFor="task-date"
                  >
                    Due date
                  </label>
                  <input
                    id="task-date"
                    type="date"
                    value={form.deadline}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, deadline: e.target.value }))
                    }
                    onClick={(e) => e.target.showPicker?.()}
                    className="w-full bg-white border border-line rounded-xl px-3 py-2.5 text-sm text-ink focus:border-surface outline-none transition-colors shadow-sm cursor-pointer"
                  />
                </div>

                <div>
                  <span className="block text-xs font-medium text-ink/80 mb-1.5">
                    Priority
                  </span>
                  <div className="flex gap-2">
                    {PRIORITIES.map((p) => (
                      <button
                        key={p.key}
                        type="button"
                        onClick={() =>
                          setForm((f) => ({ ...f, priority: p.key }))
                        }
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                          form.priority === p.key
                            ? "border-surface bg-surface/10 text-ink font-semibold shadow-sm"
                            : "border-line text-muted hover:text-ink bg-white"
                        }`}
                      >
                        <span className={`w-2 h-2 rounded-full ${p.color}`} />
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>

                {error && (
                  <p className="text-xs text-delete font-medium">{error}</p>
                )}
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
                  {editingTask ? "Save changes" : "Add task"}
                </button>
              </div>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
