import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "../lib/supabaseClient";

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
  assignees: [], // Multi-select ke liye Array
  image: "",
};

export default function TaskDrawer({
  open,
  onClose,
  onSave,
  editingTask,
  boardMembers = [], // Full object array [{ user_id, full_name, email, role }]
}) {
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);

  // Member Searchable Dropdown States
  const [assigneeInput, setAssigneeInput] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    if (open) {
      setForm(
        editingTask
          ? {
              task: editingTask.task || "",
              des: editingTask.des || "",
              deadline: editingTask.deadline || "",
              priority: editingTask.priority || "normal",
              assignees: Array.isArray(editingTask.assignees)
                ? editingTask.assignees
                : editingTask.assignee
                ? [editingTask.assignee]
                : [],
              image: editingTask.image || "",
            }
          : emptyForm
      );
      setError("");
      setAssigneeInput("");
      setIsDropdownOpen(false);
      setUploading(false);
    }
  }, [open, editingTask]);

  // Dropdown ke bahar click karne par use close karna
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelectMember = (member) => {
    const nameToSave = member.full_name || member.email || "Team Member";
    if (!form.assignees.includes(nameToSave)) {
      setForm((f) => ({ ...f, assignees: [...f.assignees, nameToSave] }));
    }
    setAssigneeInput("");
  };

  const handleRemoveMember = (memberToRemove) => {
    setForm((f) => ({
      ...f,
      assignees: f.assignees.filter((m) => m !== memberToRemove),
    }));
  };

  const filteredMembers = boardMembers.filter((m) => {
    const displayName = m.full_name || m.email || "Team Member";
    return (
      displayName.toLowerCase().includes(assigneeInput.toLowerCase()) &&
      !form.assignees.includes(displayName)
    );
  });

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      setError("");

      const fileExt = file.name.split(".").pop();
      const uniqueId =
        typeof crypto !== "undefined" && crypto.randomUUID
          ? crypto.randomUUID()
          : Date.now();
      const fileName = `${uniqueId}.${fileExt}`;
      const filePath = `task-images/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("todos")
        .upload(filePath, file, { cacheControl: "3600", upsert: false });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from("todos")
        .getPublicUrl(filePath);

      if (!data?.publicUrl) throw new Error("Could not retrieve public URL.");

      setForm((f) => ({ ...f, image: data.publicUrl }));
    } catch (err) {
      console.error("Error uploading image:", err.message);
      setError("Failed to upload image. Check storage permissions.");
    } finally {
      setUploading(false);
      if (e.target) e.target.value = "";
    }
  };

  // ✅ Corrected handleSubmit inside TaskDrawer.jsx
const handleSubmit = (e) => {
  e.preventDefault();
  if (!form.task.trim()) {
    setError("Give the task a name.");
    return;
  }
  
  onSave({
    ...(editingTask || {}), // Original metadata & ID preserve rahenge
    ...form,               // Updated form values overwrite ho jayenge
    task: form.task.trim(),
    des: form.des.trim(),
  });
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

                {/* Multi-Select Searchable Assignees Field */}
                <div ref={dropdownRef} className="relative">
                  <label className="block text-xs font-medium text-ink/80 mb-1.5">
                    Assignees
                  </label>
                  
                  {/* Selected Tags Container */}
                  <div className="bg-white border border-line rounded-xl p-2 min-h-[42px] flex flex-wrap gap-1.5 items-center shadow-sm">
                    {form.assignees.map((member) => (
                      <span
                        key={member}
                        className="bg-surface/10 text-ink text-xs px-2.5 py-1 rounded-lg flex items-center gap-1 font-medium border border-line"
                      >
                        {member}
                        <button
                          type="button"
                          onClick={() => handleRemoveMember(member)}
                          className="hover:text-delete text-muted transition-colors ml-0.5"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                    
                    <input
                      type="text"
                      value={assigneeInput}
                      onFocus={() => setIsDropdownOpen(true)}
                      onChange={(e) => {
                        setAssigneeInput(e.target.value);
                        setIsDropdownOpen(true);
                      }}
                      placeholder={form.assignees.length === 0 ? "Select or search member..." : ""}
                      className="flex-1 min-w-[120px] bg-transparent border-none text-sm text-ink placeholder:text-muted/50 focus:outline-none p-1"
                    />
                  </div>

                  {/* Dropdown Options List */}
                  {isDropdownOpen && (
                    <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-line rounded-xl shadow-lg max-h-40 overflow-y-auto z-50 py-1">
                      {filteredMembers.length > 0 ? (
                        filteredMembers.map((member) => {
                          const displayName = member.full_name || member.email || "Team Member";
                          return (
                            <div
                              key={member.user_id || member.id || displayName}
                              onClick={() => handleSelectMember(member)}
                              className="px-3 py-2 flex items-center justify-between text-sm text-ink hover:bg-surface/10 cursor-pointer transition-colors"
                            >
                              <span className="truncate">{displayName}</span>
                              {member.role && (
                                <span className="text-[10px] text-muted capitalize ml-2">
                                  {member.role}
                                </span>
                              )}
                            </div>
                          );
                        })
                      ) : (
                        <div className="px-3 py-2 text-xs text-muted">
                          {boardMembers.length === 0 ? "No members in this board" : "No matching members"}
                        </div>
                      )}
                    </div>
                  )}
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
                        onClick={() => setForm((f) => ({ ...f, image: "" }))}
                        className="absolute top-3 right-3 bg-ink/70 hover:bg-ink text-white px-2 py-1 rounded-full text-xs transition-colors"
                      >
                        ✕ Remove
                      </button>
                    </div>
                  ) : (
                    <div>
                      <label
                        htmlFor="task-image-upload"
                        className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border border-dashed border-line bg-white hover:bg-surface/5 text-muted hover:text-ink text-xs font-medium cursor-pointer transition-all shadow-sm ${
                          uploading ? "opacity-50 pointer-events-none" : ""
                        }`}
                      >
                        <span>{uploading ? "Uploading..." : "Attach Photo"}</span>
                      </label>
                      <input
                        id="task-image-upload"
                        type="file"
                        accept="image/*"
                        disabled={uploading}
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                    </div>
                  )}
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
                        onClick={() => setForm((f) => ({ ...f, priority: p.key }))}
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
                  disabled={uploading}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-surface text-white hover:opacity-95 transition-opacity shadow-sm disabled:opacity-50"
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