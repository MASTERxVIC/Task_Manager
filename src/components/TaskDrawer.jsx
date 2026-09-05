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
  assignees: [],
  image: "",
};

export default function TaskDrawer({
  open,
  onClose,
  onSave,
  editingTask,
  boardMembers = [],
}) {
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);

  const [assigneeInput, setAssigneeInput] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    if (open) {
      // 1. Safely handle assignee data regardless of DB schema (array, string, or single string)
      const rawAssignee = editingTask?.assignee ?? editingTask?.assignees;

      let initialAssignees = [];
      if (Array.isArray(rawAssignee)) {
        initialAssignees = rawAssignee;
      } else if (typeof rawAssignee === "string" && rawAssignee.trim()) {
        initialAssignees = rawAssignee
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
      }

      setForm(
        editingTask
          ? {
              task: editingTask.task || "",
              des: editingTask.des || "",
              deadline: editingTask.deadline || "",
              priority: editingTask.priority || "normal",
              assignees: initialAssignees,
              image: editingTask.image || "",
            }
          : emptyForm,
      );
      setError("");
      setAssigneeInput("");
      setIsDropdownOpen(false);
      setUploading(false);
    }
  }, [open, editingTask]);

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
    setIsDropdownOpen(false);
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

      const { data } = supabase.storage.from("todos").getPublicUrl(filePath);

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

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.task.trim()) {
      setError("Give the task a name.");
      return;
    }

    // Convert array to string for DB 'assignee' column mapping while preserving array fallback
    const assigneeString = form.assignees.join(", ");

    onSave({
      ...(editingTask || {}),
      ...form,
      task: form.task.trim(),
      des: form.des.trim(),
      assignee: assigneeString, // Exact database column key mapped
      assignees: form.assignees, // Kept for UI local state consistency
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
            className="fixed inset-0 z-40 bg-[#1E1E24]/40 backdrop-blur-sm"
          />
          <motion.div
            key="drawer"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
            role="dialog"
            aria-modal="true"
            className="fixed top-0 right-0 z-50 h-full w-full sm:w-[420px] bg-[#1E1E24] flex flex-col shadow-2xl"
          >
            <div className="flex items-center justify-between px-6 py-5 border-b border-[#FDD739] bg-[#1E1E24]">
              <h2 className="font-display font-semibold text-lg text-[#FDD739]">
                {editingTask ? "Edit Task" : "New Task"}
              </h2>
              <button
                onClick={onClose}
                aria-label="Close"
                className="text-muted/70 hover:text-muted p-1 transition-colors cursor-pointer"
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
                    className="block text-xs font-medium text-[#FDFBF7]/85 mb-1.5"
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
                    className="w-full bg-muted border border-muted rounded-xl px-3 py-2.5 text-sm text-[#1E1E24] placeholder:text-gray-500  outline-none transition-colors shadow-sm"
                  />
                </div>

                <div ref={dropdownRef} className="relative">
                  <label className="block text-xs font-medium text-[#FDFBF7]/85 mb-1.5">
                    Assignees
                  </label>

                  <div className="bg-[#FDFBF7] border border-line rounded-xl p-2 min-h-[42px] flex flex-wrap gap-1.5 items-center shadow-sm">
                    {form.assignees.map((member) => (
                      <span
                        key={member}
                        className="bg-muted text-[#1E1E24] text-xs px-2.5 py-1 rounded-lg flex items-center gap-1 font-medium border border-line"
                      >
                        {member}
                        <button
                          type="button"
                          onClick={() => handleRemoveMember(member)}
                          className=" text-[#1E1E24]  transition-colors ml-0.5 cursor-pointer"
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
                      placeholder={
                        form.assignees.length === 0
                          ? "Select or search member..."
                          : ""
                      }
                      className="flex-1 min-w-[120px] bg-transparent border-none text-sm text-[#1E1E24] placeholder:text-gray-500  p-1"
                    />
                  </div>

                  {isDropdownOpen && (
                    <div className="absolute left-0 right-0 top-full mt-1 bg-muted border border-line rounded-xl shadow-lg max-h-40 overflow-y-auto z-50 py-1">
                      {filteredMembers.length > 0 ? (
                        filteredMembers.map((member) => {
                          const displayName =
                            member.full_name || member.email || "Team Member";
                          return (
                            <div
                              key={member.user_id || member.id || displayName}
                              onClick={() => handleSelectMember(member)}
                              className="group px-3 py-2 flex items-center justify-between text-sm text-[#1E1E24] hover:bg-[#1E1E24] hover:text-muted cursor-pointer transition-colors"
                            >
                              <span className="truncate">{displayName}</span>
                              {member.role && (
                                <span className="text-[10px] text-[#1E1E24] group-hover:text-muted opacity-75 capitalize ml-2 transition-colors">
                                  {member.role}
                                </span>
                              )}
                            </div>
                          );
                        })
                      ) : (
                        <div className="px-3 py-2 text-xs text-[#1E1E24] bg-muted">
                          {boardMembers.length === 0
                            ? "No members in this board"
                            : "No matching members"}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#FDFBF7]/85 mb-1.5">
                    Attachment
                  </label>
                  {form.image ? (
                    <div className="relative rounded-xl overflow-hidden border border-line bg-[#FDFBF7] p-2">
                      <img
                        src={form.image}
                        alt="Task Attachment"
                        className="w-full h-36 object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => setForm((f) => ({ ...f, image: "" }))}
                        className="absolute top-3 right-3 bg-[#1E1E24]/70 hover:bg-[#1E1E24] text-[#FDFBF7]/85 px-2 py-1 rounded-full text-xs transition-colors"
                      >
                        ✕ Remove
                      </button>
                    </div>
                  ) : (
                    <div>
                      <label
                        htmlFor="task-image-upload"
                        className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border border-dashed border-line bg-muted hover:bg-muted/80 text-[#1E1E24] text-sm font-medium cursor-pointer transition-all shadow-sm ${
                          uploading ? "opacity-50 pointer-events-none" : ""
                        }`}
                      >
                        {/* SVG ICON ADDED HERE */}
                        <svg
                          width="15"
                          height="17"
                          viewBox="0 0 18 20"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                          className="shrink-0"
                        >
                          <path
                            d="M1 9.43198L7.89429 2.53769C9.94454 0.487437 13.2687 0.487437 15.319 2.53769C17.3692 4.58794 17.369 7.91224 15.3187 9.96249L7.36377 17.9174C5.99693 19.2843 3.78123 19.2841 2.4144 17.9173C1.04756 16.5504 1.04723 14.3346 2.41406 12.9677L10.369 5.01279C11.0524 4.32937 12.1611 4.32937 12.8445 5.01279C13.5279 5.6962 13.5274 6.80398 12.844 7.4874L5.94971 14.3817"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                        <span>
                          {uploading ? "Uploading..." : "Attach Photo"}
                        </span>
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
                  <label
                    className="block text-xs font-medium text-[#FDFBF7]/85 mb-1.5"
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
                    className="w-full bg-[#FDFBF7] border border-line rounded-xl px-3 py-2.5 text-sm text-[#1E1E24] placeholder:text-gray-500  outline-none transition-colors resize-none shadow-sm"
                  />
                </div>

                <div>
                  <label
                    className="block text-xs font-medium text-[#FDFBF7]/85 mb-1.5"
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
                    className="w-full bg-[#FDFBF7] border border-line rounded-xl px-3 py-2.5 text-sm text-[#1E1E24] outline-none transition-colors shadow-sm cursor-pointer"
                  />
                </div>

                {error && (
                  <p className="text-xs text-delete font-medium">{error}</p>
                )}
              </div>

              <div className="px-6 py-5 border-t border-gray-500 flex gap-3 bg-[#1E1E24]">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-2.5 rounded-xl text-sm font-medium text-[#1E1E24] hover:text-[#1E1E24]/80 border border-line bg-[#FDFBF7] transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-muted text-[#1E1E24] hover:opacity-95 transition-opacity shadow-sm disabled:opacity-50 cursor-pointer"
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
